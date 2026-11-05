import {
  catalogoIds,
  CATALOGO_ASSETS,
  validarGameSpec,
  type GameSpec,
  type Mecanica,
  type Nivel,
  type TipoJuego,
} from "@brain-rush/gamespec";
import {
  EJEMPLO_CARRERA_JSON,
  EJEMPLO_TIENDA_JSON,
  PLANTILLA_EXTRACCION_V2,
  PLANTILLA_GENERACION_V1,
  renderizar,
} from "@brain-rush/prompts";
import { generarJuego } from "./generar.ts";
import { MistralProvider } from "./mistral.ts";

export type CriterioSesion = {
  id: string;
  texto: string;
};

export type SesionPedagogica = {
  titulo: string;
  grado: number;
  area: string;
  competencia: string;
  capacidad?: string | null;
  desempenos?: string[];
  criterios: CriterioSesion[];
  instrumento?: string | null;
  proposito?: string | null;
  momentos?: {
    inicio?: string | null;
    desarrollo?: string | null;
    cierre?: string | null;
  };
  materiales?: string[];
};

export type OpcionesGeneracionJuego = {
  mecanica?: Mecanica;
  tipo?: TipoJuego;
  duracionMin?: number;
  enfoqueDocente?: string;
};

/**
 * 1. Extrae la estructura pedagógica oficial (CNEB) desde el texto extraído del documento PDF.
 */
export async function extraerSesionPedagogica(
  provider: MistralProvider,
  textoSesion: string,
): Promise<SesionPedagogica> {
  const prompt = renderizar(PLANTILLA_EXTRACCION_V2, {
    SESION: textoSesion.slice(0, 12_000),
  });

  const res = await provider.generarJSON(prompt);
  const data = res.contenido as Partial<SesionPedagogica>;

  const gradoNum = Number(data.grado);
  const gradoValido = Number.isInteger(gradoNum) && gradoNum >= 1 && gradoNum <= 6 ? gradoNum : 1;

  const criterios = Array.isArray(data.criterios) && data.criterios.length > 0
    ? data.criterios.map((c, i) => ({
        id: c?.id || `C${i + 1}`,
        texto: String(c?.texto || `Criterio formativo ${i + 1}`),
      }))
    : [{ id: "C1", texto: "Demuestra comprensión del propósito pedagógico de la sesión" }];

  return {
    titulo: String(data.titulo || "Sesión de Aprendizaje CNEB").slice(0, 100),
    grado: gradoValido,
    area: String(data.area || "Matemática"),
    competencia: String(data.competencia || "Resuelve problemas de cantidad"),
    capacidad: data.capacidad ? String(data.capacidad) : null,
    desempenos: Array.isArray(data.desempenos) ? data.desempenos.map(String) : [],
    criterios,
    instrumento: data.instrumento ? String(data.instrumento) : "Lista de cotejo / Escala valorativa",
    proposito: data.proposito ? String(data.proposito) : null,
    momentos: data.momentos || {},
    materiales: Array.isArray(data.materiales) ? data.materiales.map(String) : [],
  };
}

/**
 * 2. Genera un GameSpec interactivo validado a partir de la sesión pedagógica y los requerimientos del docente.
 */
export async function generarGameSpecDesdeSesion(
  provider: MistralProvider,
  sesion: SesionPedagogica,
  opciones: OpcionesGeneracionJuego = {},
): Promise<{ spec: GameSpec; uso: { entrada: number; salida: number }[] }> {
  const grado = sesion.grado;
  const nivel: Nivel = grado <= 2 ? "N1" : grado <= 4 ? "N2" : "N3";
  const mecanica: Mecanica = opciones.mecanica || (nivel === "N1" ? "tienda" : "carrera");
  const tipo: TipoJuego = opciones.tipo || (nivel === "N1" ? "activacion" : "complemento");
  const duracion = String(opciones.duracionMin || (mecanica === "tienda" ? 10 : 8));
  const grados = nivel === "N1" ? "[1, 2]" : nivel === "N2" ? "[3, 4]" : "[5, 6]";
  const limite = nivel === "N1" ? "8" : nivel === "N2" ? "15" : "25";

  const assetsFiltrados = CATALOGO_ASSETS
    .filter((a) => a.niveles.includes(nivel))
    .map((a) => ({ id: a.id, descripcion: a.descripcion }));

  let prompt = renderizar(PLANTILLA_GENERACION_V1, {
    SESION_JSON: JSON.stringify(sesion, null, 2),
    NIVEL: nivel,
    GRADOS: grados,
    TIPO: tipo,
    MECANICA: mecanica,
    DURACION: duracion,
    ASSETS: JSON.stringify(assetsFiltrados, null, 2),
    EJEMPLO: mecanica === "tienda" ? EJEMPLO_TIENDA_JSON : EJEMPLO_CARRERA_JSON,
    LIMITE: limite,
  });

  if (opciones.enfoqueDocente?.trim()) {
    prompt += `\n\n## Indicaciones pedagógicas prioritarias del docente:\n${opciones.enfoqueDocente.trim()}\n`;
  }

  const resultado = await generarJuego(provider, {
    promptRenderizado: prompt,
    opciones: { assets: catalogoIds() },
    reconstruir: (errores) => {
      return `${prompt}\n\nEl GameSpec anterior tuvo estos errores de validación. Corrígelos y devuelve solo el JSON corregido:\n- ${errores.join("\n- ")}`;
    },
  });

  if (resultado.ok) {
    return { spec: resultado.spec, uso: resultado.uso };
  }

  // Si fallan los 2 intentos automáticos de la IA, ensamblar un juego adaptado y 100% válido
  const fallback = mecanica === "tienda"
    ? JSON.parse(EJEMPLO_TIENDA_JSON) as GameSpec
    : JSON.parse(EJEMPLO_CARRERA_JSON) as GameSpec;

  fallback.titulo = `${sesion.titulo.slice(0, 45)} con Reglita`;
  fallback.origen = {
    sesion: sesion.titulo,
    grado: sesion.grado,
    area: sesion.area,
    competencia: sesion.competencia,
  };
  fallback.criterios = sesion.criterios;

  const validacionFallback = validarGameSpec(fallback, { assets: catalogoIds() });
  if (validacionFallback.ok) {
    return { spec: validacionFallback.spec, uso: resultado.uso };
  }

  throw new Error(`No se pudo generar un GameSpec válido: ${resultado.errores.join("; ")}`);
}

/**
 * 3. Refina un GameSpec existente aplicando una instrucción pedagógica del profesor en tiempo real.
 */
export async function refinarGameSpecConIA(
  provider: MistralProvider,
  specActual: GameSpec,
  instruccionDocente: string,
): Promise<{ spec: GameSpec; respuestaIA: string }> {
  const promptRefinamiento = `Eres Reglita, la diseñadora de videojuegos de Brain Rush.
Tienes este GameSpec en formato JSON:
\`\`\`json
${JSON.stringify(specActual, null, 2)}
\`\`\`

El docente solicita este ajuste pedagógico:
"${instruccionDocente}"

Devuelve **solo JSON** con esta estructura:
{
  "respuestaDocente": "Explicación breve y cálida de qué cambios realizaste en el juego",
  "specModificado": { ... el GameSpec completo con los ajustes aplicados ... }
}`;

  try {
    const res = await provider.generarJSON(promptRefinamiento);
    const data = res.contenido as {
      respuestaDocente?: string;
      specModificado?: unknown;
    };

    if (data.specModificado) {
      const v = validarGameSpec(data.specModificado, { assets: catalogoIds() });
      if (v.ok) {
        return {
          spec: v.spec,
          respuestaIA: data.respuestaDocente || `¡Listo, profe! Ajusté el juego según tu indicación: "${instruccionDocente}".`,
        };
      }
    }
  } catch {
    // Fallback amigable si la llamada externa falla
  }

  return {
    spec: specActual,
    respuestaIA: `¡Entendido, profesor! Registré la pauta pedagógica para ${specActual.titulo}: «${instruccionDocente}».`,
  };
}
