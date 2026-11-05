import type { Hono } from "hono";
import { soloDocente } from "../auth.ts";
import { ahora, codigoLegible, escribirJson, itemsDeSpec, nuevoId } from "../db.ts";
import { ErrorHttp, validacion } from "../errores.ts";
import type { AppEnv } from "../tipos.ts";
import { MistralProvider, extraerCadenasTextoPDF } from "../ai/mistral.ts";
import {
  extraerSesionPedagogica,
  generarGameSpecDesdeSesion,
  refinarGameSpecConIA,
  type SesionPedagogica,
} from "../ai/pipeline.ts";

async function codigoDisponible(db: D1Database, base: string): Promise<string> {
  const limpio = base.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8) || "JUEGO";
  for (let intento = 0; intento < 20; intento++) {
    const codigo = intento === 0 ? limpio : `${limpio.slice(0, 6)}${intento + 1}`;
    const existe = await db.prepare("SELECT 1 FROM games WHERE codigo = ?").bind(codigo).first();
    if (!existe) return codigo;
  }
  return `${limpio.slice(0, 5)}${Date.now().toString(36).slice(-3).toUpperCase()}`;
}

export function rutasIA(app: Hono<AppEnv>) {
  /**
   * 1. Extrae los datos pedagógicos del CNEB a partir de un archivo PDF subido por el profesor.
   */
  app.post("/api/ia/extraer-pdf", soloDocente, async (c) => {
    const apiKey = c.env.MISTRAL_API_KEY;
    const provider = apiKey ? new MistralProvider({ apiKey }) : null;
    let textoDocumento = "";

    const contentType = c.req.header("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const body = await c.req.parseBody();
      const archivo = body.archivo;

      if (!archivo || !(archivo instanceof File)) {
        validacion("Debes adjuntar un archivo en el campo 'archivo'.", ["archivo requerido"]);
      }

      const bytes = new Uint8Array(await archivo.arrayBuffer());
      if (archivo.type === "application/pdf" || archivo.name.endsWith(".pdf")) {
        if (provider) {
          try {
            textoDocumento = await provider.extraerTextoOcr(bytes, archivo.name);
          } catch {
            textoDocumento = extraerCadenasTextoPDF(bytes);
          }
        } else {
          textoDocumento = extraerCadenasTextoPDF(bytes);
        }
      } else {
        textoDocumento = new TextDecoder().decode(bytes);
      }

      if (!textoDocumento || textoDocumento.trim().length < 5) {
        textoDocumento = `Sesión de aprendizaje: ${archivo.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ")}`;
      }
    } else {
      const json = await c.req.json().catch(() => ({})) as { textoSesion?: string };
      textoDocumento = json.textoSesion || "";
    }

    if (!textoDocumento.trim()) {
      textoDocumento = "Sesión de aprendizaje de Matemática para primaria sobre clasificación y resolución de problemas.";
    }

    const sesion = await extraerSesionPedagogica(provider, textoDocumento);
    return c.json({ ok: true, sesion, textoExtraido: textoDocumento.slice(0, 500) });
  });

  /**
   * 2. Diseña y genera el videojuego interactivo (GameSpec) a partir de la sesión pedagógica y lo guarda en D1.
   */
  app.post("/api/ia/generar-desde-sesion", soloDocente, async (c) => {
    const apiKey = c.env.MISTRAL_API_KEY;
    const provider = apiKey ? new MistralProvider({ apiKey }) : null;

    const body = await c.req.json().catch(() => ({})) as {
      sesion: SesionPedagogica;
      enfoqueDocente?: string;
      mecanica?: "tienda" | "carrera";
      tipo?: "activacion" | "complemento";
    };

    if (!body.sesion || !body.sesion.titulo) {
      validacion("Faltan los datos de la sesión pedagógica.", ["sesion.titulo requerido"]);
    }

    const { spec } = await generarGameSpecDesdeSesion(provider, body.sesion, {
      enfoqueDocente: body.enfoqueDocente,
      mecanica: body.mecanica,
      tipo: body.tipo,
    });

    // Guardar sesión, juego y sala inicial en Cloudflare D1
    const sesionId = nuevoId();
    const juegoId = nuevoId();
    const versionId = nuevoId();
    const salaId = nuevoId();
    const codigo = await codigoDisponible(c.env.DB, codigoLegible(spec.titulo, spec.mecanica));
    const timestamp = ahora();
    const total = itemsDeSpec(spec).length;
    const meta = spec.mecanica === "tienda" ? spec.meta : undefined;

    const origen = {
      generadoPor: provider ? "mistral:mistral-small-latest" : "ia:heuristico-cneb",
      promptVersion: "generacion:v1",
      enfoqueDocente: body.enfoqueDocente || null,
    };

    await c.env.DB.batch([
      c.env.DB.prepare(
        `INSERT INTO sessions
          (id, school_id, titulo, area, grado, competencia, capacidad, desempenos, criterios,
           instrumento, proposito, momentos, materiales, creado_en)
         VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        sesionId,
        body.sesion.titulo,
        body.sesion.area,
        body.sesion.grado,
        body.sesion.competencia,
        body.sesion.capacidad ?? null,
        escribirJson(body.sesion.desempenos || []),
        escribirJson(body.sesion.criterios || []),
        body.sesion.instrumento ?? null,
        body.sesion.proposito ?? null,
        escribirJson(body.sesion.momentos || {}),
        escribirJson(body.sesion.materiales || []),
        timestamp,
      ),
      c.env.DB.prepare(
        `INSERT INTO games
          (id, session_id, titulo, tipo, mecanica, nivel, grados, estado, version_actual, codigo, creado_en)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'publicado', 1, ?, ?)`,
      ).bind(
        juegoId,
        sesionId,
        spec.titulo,
        spec.tipo,
        spec.mecanica,
        spec.nivel,
        escribirJson(spec.grados),
        codigo,
        timestamp,
      ),
      c.env.DB.prepare(
        `INSERT INTO game_versions
          (id, game_id, numero, spec, origen_generacion, publicada, publicada_en, creada_en)
         VALUES (?, ?, 1, ?, ?, 1, ?, ?)`,
      ).bind(
        versionId,
        juegoId,
        escribirJson(spec),
        escribirJson(origen),
        timestamp,
        timestamp,
      ),
      c.env.DB.prepare(
        `INSERT INTO rooms
          (id, codigo, game_id, version_id, estado, ronda, total_rondas, progreso, meta_objetivo, max_alumnos, seq, creada_en)
         VALUES (?, ?, ?, ?, 'esperando', 1, ?, 0, ?, 40, 0, ?)`,
      ).bind(
        salaId,
        codigo,
        juegoId,
        versionId,
        total,
        meta?.objetivo ?? null,
        timestamp,
      ),
    ]);

    return c.json(
      {
        ok: true,
        juegoId,
        sesionId,
        versionId,
        codigo,
        spec,
        mensaje: `Videojuego «${spec.titulo}» generado y publicado con éxito.`,
      },
      201,
    );
  });

  /**
   * 3. Flujo completo: sube PDF y genera el juego en una sola operación.
   */
  app.post("/api/ia/generar-desde-pdf", soloDocente, async (c) => {
    const apiKey = c.env.MISTRAL_API_KEY;
    const provider = apiKey ? new MistralProvider({ apiKey }) : null;
    let textoDocumento = "";
    let enfoqueDocente = "";

    const contentType = c.req.header("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const body = await c.req.parseBody();
      const archivo = body.archivo;
      enfoqueDocente = String(body.enfoqueDocente || "");

      if (!archivo || !(archivo instanceof File)) {
        validacion("Debes adjuntar un archivo PDF.", ["archivo requerido"]);
      }

      const bytes = new Uint8Array(await archivo.arrayBuffer());
      if (archivo.type === "application/pdf" || archivo.name.endsWith(".pdf")) {
        if (provider) {
          try {
            textoDocumento = await provider.extraerTextoOcr(bytes, archivo.name);
          } catch {
            textoDocumento = extraerCadenasTextoPDF(bytes);
          }
        } else {
          textoDocumento = extraerCadenasTextoPDF(bytes);
        }
      } else {
        textoDocumento = new TextDecoder().decode(bytes);
      }

      if (!textoDocumento || textoDocumento.trim().length < 5) {
        textoDocumento = `Sesión de aprendizaje: ${archivo.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ")}`;
      }
    } else {
      const json = await c.req.json().catch(() => ({})) as {
        textoSesion?: string;
        enfoqueDocente?: string;
      };
      textoDocumento = json.textoSesion || "";
      enfoqueDocente = json.enfoqueDocente || "";
    }

    if (!textoDocumento.trim()) {
      textoDocumento = "Sesión de aprendizaje de Matemática para primaria sobre clasificación y resolución de problemas.";
    }

    // Paso A: Extraer sesión
    const sesion = await extraerSesionPedagogica(provider, textoDocumento);

    // Paso B: Generar GameSpec
    const { spec } = await generarGameSpecDesdeSesion(provider, sesion, {
      enfoqueDocente,
    });

    // Paso C: Persistir en D1
    const sesionId = nuevoId();
    const juegoId = nuevoId();
    const versionId = nuevoId();
    const salaId = nuevoId();
    const codigo = await codigoDisponible(c.env.DB, codigoLegible(spec.titulo, spec.mecanica));
    const timestamp = ahora();
    const total = itemsDeSpec(spec).length;
    const meta = spec.mecanica === "tienda" ? spec.meta : undefined;

    const origen = {
      generadoPor: provider ? "mistral:mistral-small-latest" : "ia:heuristico-cneb",
      promptVersion: "generacion:v1",
      enfoqueDocente: enfoqueDocente || null,
    };

    await c.env.DB.batch([
      c.env.DB.prepare(
        `INSERT INTO sessions
          (id, school_id, titulo, area, grado, competencia, capacidad, desempenos, criterios,
           instrumento, proposito, momentos, materiales, creado_en)
         VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        sesionId,
        sesion.titulo,
        sesion.area,
        sesion.grado,
        sesion.competencia,
        sesion.capacidad ?? null,
        escribirJson(sesion.desempenos || []),
        escribirJson(sesion.criterios || []),
        sesion.instrumento ?? null,
        sesion.proposito ?? null,
        escribirJson(sesion.momentos || {}),
        escribirJson(sesion.materiales || []),
        timestamp,
      ),
      c.env.DB.prepare(
        `INSERT INTO games
          (id, session_id, titulo, tipo, mecanica, nivel, grados, estado, version_actual, codigo, creado_en)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'publicado', 1, ?, ?)`,
      ).bind(
        juegoId,
        sesionId,
        spec.titulo,
        spec.tipo,
        spec.mecanica,
        spec.nivel,
        escribirJson(spec.grados),
        codigo,
        timestamp,
      ),
      c.env.DB.prepare(
        `INSERT INTO game_versions
          (id, game_id, numero, spec, origen_generacion, publicada, publicada_en, creada_en)
         VALUES (?, ?, 1, ?, ?, 1, ?, ?)`,
      ).bind(
        versionId,
        juegoId,
        escribirJson(spec),
        escribirJson(origen),
        timestamp,
        timestamp,
      ),
      c.env.DB.prepare(
        `INSERT INTO rooms
          (id, codigo, game_id, version_id, estado, ronda, total_rondas, progreso, meta_objetivo, max_alumnos, seq, creada_en)
         VALUES (?, ?, ?, ?, 'esperando', 1, ?, 0, ?, 40, 0, ?)`,
      ).bind(
        salaId,
        codigo,
        juegoId,
        versionId,
        total,
        meta?.objetivo ?? null,
        timestamp,
      ),
    ]);

    return c.json(
      {
        ok: true,
        juegoId,
        sesionId,
        versionId,
        codigo,
        spec,
        sesion,
        mensaje: `Videojuego «${spec.titulo}» generado desde PDF y publicado con éxito.`,
      },
      201,
    );
  });

  /**
   * 4. Refinamiento en vivo del juego mediante conversación con el docente.
   */
  app.post("/api/ia/refinar-juego", soloDocente, async (c) => {
    const apiKey = c.env.MISTRAL_API_KEY;
    const provider = apiKey ? new MistralProvider({ apiKey }) : null;

    const { juegoId, instruccion } = (await c.req.json().catch(() => ({}))) as {
      juegoId?: string;
      instruccion?: string;
    };

    if (!juegoId || !instruccion?.trim()) {
      validacion("Faltan parámetros juegoId o instruccion.", ["parámetros incompletos"]);
    }

    const juego = await c.env.DB.prepare("SELECT * FROM games WHERE id = ?")
      .bind(juegoId)
      .first<{ id: string; version_actual: number }>();

    if (!juego) {
      throw new ErrorHttp(404, "NO_ENCONTRADO", "El juego no existe.");
    }

    const versionActual = await c.env.DB.prepare(
      "SELECT * FROM game_versions WHERE game_id = ? AND numero = ?",
    )
      .bind(juegoId, juego.version_actual)
      .first<{ spec: string }>();

    if (!versionActual) {
      throw new ErrorHttp(404, "NO_ENCONTRADO", "No se encontró la versión actual del juego.");
    }

    const specActual = JSON.parse(versionActual.spec);
    const { spec: nuevoSpec, respuestaIA } = await refinarGameSpecConIA(
      provider,
      specActual,
      instruccion.trim(),
    );

    const nuevaVersionNumero = juego.version_actual + 1;
    const versionId = nuevoId();
    const timestamp = ahora();

    await c.env.DB.batch([
      c.env.DB.prepare("UPDATE games SET version_actual = ? WHERE id = ?").bind(
        nuevaVersionNumero,
        juegoId,
      ),
      c.env.DB.prepare(
        `INSERT INTO game_versions
          (id, game_id, numero, spec, origen_generacion, publicada, publicada_en, creada_en)
         VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
      ).bind(
        versionId,
        juegoId,
        nuevaVersionNumero,
        escribirJson(nuevoSpec),
        escribirJson({ instruccion, refinadoConIA: true }),
        timestamp,
        timestamp,
      ),
    ]);

    return c.json({
      ok: true,
      juegoId,
      versionId,
      version: nuevaVersionNumero,
      spec: nuevoSpec,
      respuestaIA,
    });
  });
}
