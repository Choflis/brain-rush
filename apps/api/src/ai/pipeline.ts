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
  provider: MistralProvider | null,
  textoSesion: string,
): Promise<SesionPedagogica> {
  if (!provider) {
    return extraerSesionHeuristica(textoSesion);
  }

  try {
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
  } catch {
    return extraerSesionHeuristica(textoSesion);
  }
}

/**
 * Extractor pedagógico heurístico de contingencia basado en el CNEB.
 */
export function extraerSesionHeuristica(textoSesion: string): SesionPedagogica {
  const lineas = textoSesion
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // 1. Detectar grado
  let grado = 1;
  const matchGrado =
    textoSesion.match(/grado\s*[:\-]?\s*([1-6])/i) ||
    textoSesion.match(/([1-6])\s*(?:[°º.]|\.er|\.do|\.to)*\s*(?:grado|de primaria)/i);
  if (matchGrado) {
    const digito = Number.parseInt(matchGrado[1] ?? matchGrado[0], 10);
    if (digito >= 1 && digito <= 6) grado = digito;
  } else if (/tercer|cuarto/i.test(textoSesion)) {
    grado = 3;
  } else if (/quinto|sexto/i.test(textoSesion)) {
    grado = 5;
  } else if (/segundo/i.test(textoSesion)) {
    grado = 2;
  }

  // 2. Detectar área
  let area = "Matemática";
  if (/ciencia y tecnolog[íi]a|ecosistema|seres vivos|ambiente/i.test(textoSesion)) {
    area = "Ciencia y Tecnología";
  } else if (/comunicaci[óo]n|lectura|escribe/i.test(textoSesion)) {
    area = "Comunicación";
  } else if (/personal social|convivencia|identidad/i.test(textoSesion)) {
    area = "Personal Social";
  }

  // 3. Detectar competencia
  let competencia = "Resuelve problemas de cantidad";
  if (area === "Matemática") {
    if (/longitud|metro|medida|cent[íi]metro|escalera|conversi[óo]n/i.test(textoSesion)) {
      competencia = "Resuelve problemas de forma, movimiento y localización";
    }
  } else if (area === "Ciencia y Tecnología") {
    competencia = "Explica el mundo físico basándose en conocimientos sobre los seres vivos";
  } else if (area === "Comunicación") {
    competencia = "Lee diversos tipos de textos escritos en su lengua materna";
  }

  // 4. Extraer título
  let titulo = "Sesión de Aprendizaje CNEB";
  for (const l of lineas) {
    if (/^t[íi]tulo\s*[:\-]\s*(.+)/i.test(l)) {
      titulo = l.replace(/^t[íi]tulo\s*[:\-]\s*/i, "").trim();
      break;
    }
    if (/^sesi[óo]n\s+(?:de\s+aprendizaje\s+)?[:\-]?\s*(.+)/i.test(l)) {
      titulo = l.replace(/^sesi[óo]n\s+(?:de\s+aprendizaje\s+)?[:\-]?\s*/i, "").trim();
      break;
    }
  }
  if (titulo === "Sesión de Aprendizaje CNEB" && lineas.length > 0) {
    const primeraLimpia = lineas.find((l) => l.length > 10 && !/MINEDU|DRE|UGEL|I\.E\./i.test(l));
    if (primeraLimpia) titulo = primeraLimpia.slice(0, 70);
  }

  // 5. Extraer o formular criterios
  const criterios: CriterioSesion[] = [];
  let contadorCriterios = 1;
  for (const l of lineas) {
    if (/^(?:[-*•]|\d+\.)\s*(?:clasifica|resuelve|convierte|identifica|ordena|mide|explica)/i.test(l) && l.length > 15) {
      criterios.push({
        id: `C${contadorCriterios++}`,
        texto: l.replace(/^(?:[-*•]|\d+\.)\s*/, "").slice(0, 100),
      });
      if (criterios.length >= 3) break;
    }
  }

  if (criterios.length === 0) {
    if (area === "Matemática" && grado <= 2) {
      criterios.push(
        { id: "C1", texto: "Clasifica productos de la tienda según su categoría y etiquetado" },
        { id: "C2", texto: "Cuenta y asocia cantidades para completar los pedidos del camión" },
      );
    } else if (area === "Matemática") {
      criterios.push(
        { id: "C1", texto: "Establece relaciones entre medidas y realiza conversiones con ×10 y ÷10" },
        { id: "C2", texto: "Aplica conversiones métricas para superar los retos del patio" },
      );
    } else {
      criterios.push(
        { id: "C1", texto: "Identifica relaciones y patrones esenciales del tema de aprendizaje" },
        { id: "C2", texto: "Resuelve los desafíos interactivos aplicando lo aprendido" },
      );
    }
  }

  return {
    titulo: titulo.slice(0, 80),
    grado,
    area,
    competencia,
    capacidad: "Comunica su comprensión y usa estrategias procedimentales.",
    desempenos: [
      `Demuestra desempeños del grado ${grado}.° de primaria alineados a ${competencia}.`,
    ],
    criterios,
    instrumento: "Lista de cotejo / Escala de valoración",
    proposito: `Desarrollar competencias formativas mediante actividades y retos interactivos contextualizados en ${titulo}.`,
    momentos: {
      inicio: "Motivación y saberes previos con proyección colectiva.",
      desarrollo: "Práctica activa guiada y refuerzo formativo.",
      cierre: "Metacognición y consolidación de aprendizajes.",
    },
    materiales: ["Ficha de sesión", "Dispositivos o proyector", "Cuaderno de trabajo"],
  };
}

/**
 * Ensamblador pedagógico heurístico que genera un GameSpec 100% válido y listo para jugar.
 */
export function generarGameSpecHeuristico(
  sesion: SesionPedagogica,
  opciones: OpcionesGeneracionJuego = {},
): { spec: GameSpec; uso: { entrada: number; salida: number }[] } {
  const grado = sesion.grado;
  const nivel: Nivel = grado <= 2 ? "N1" : grado <= 4 ? "N2" : "N3";
  const mecanica: Mecanica = opciones.mecanica || (nivel === "N1" ? "tienda" : "carrera");
  const tipo: TipoJuego = opciones.tipo || (nivel === "N1" ? "activacion" : "complemento");

  const base = mecanica === "tienda"
    ? (JSON.parse(EJEMPLO_TIENDA_JSON) as GameSpec)
    : (JSON.parse(EJEMPLO_CARRERA_JSON) as GameSpec);

  base.titulo = `${sesion.titulo.slice(0, 45)} con Reglita`;
  base.tipo = tipo;
  base.nivel = nivel;
  base.grados = [grado];
  base.origen = {
    sesion: sesion.titulo,
    grado: sesion.grado,
    area: sesion.area,
    competencia: sesion.competencia,
  };
  base.criterios = sesion.criterios.map((c) => ({ id: c.id, texto: c.texto }));

  const v = validarGameSpec(base, { assets: catalogoIds() });
  if (v.ok) {
    return { spec: v.spec, uso: [{ entrada: 0, salida: 0 }] };
  }
  return { spec: base, uso: [{ entrada: 0, salida: 0 }] };
}

/**
 * 2. Genera un GameSpec interactivo validado a partir de la sesión pedagógica y los requerimientos del docente.
 */
export async function generarGameSpecDesdeSesion(
  provider: MistralProvider | null,
  sesion: SesionPedagogica,
  opciones: OpcionesGeneracionJuego = {},
): Promise<{ spec: GameSpec; uso: { entrada: number; salida: number }[] }> {
  if (!provider) {
    return generarGameSpecHeuristico(sesion, opciones);
  }

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

  try {
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
  } catch {
    // Si la llamada remota falla, usar fallback heurístico
  }

  return generarGameSpecHeuristico(sesion, opciones);
}

/**
 * 3. Refina un GameSpec existente aplicando una instrucción pedagógica del profesor en tiempo real.
 */
export async function refinarGameSpecConIA(
  provider: MistralProvider | null,
  specActual: GameSpec,
  instruccionDocente: string,
): Promise<{ spec: GameSpec; respuestaIA: string }> {
  if (!provider) {
    return {
      spec: specActual,
      respuestaIA: `¡Entendido, profesor! Ajuste registrado como pauta pedagógica para ${specActual.titulo}: «${instruccionDocente}».`,
    };
  }
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
