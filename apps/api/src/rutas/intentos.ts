import type { GameSpec } from "@brain-rush/gamespec";
import type { Hono } from "hono";
import { alumnoActual, soloAlumno } from "../auth.ts";
import { ahora, nuevoId, totalItems } from "../db.ts";
import { ErrorHttp, leerCuerpo, noEncontrado, validacion } from "../errores.ts";
import { EsquemaIntento, EsquemaLote, type IntentoEntrada } from "../esquemas.ts";
import type { FilaJuego, FilaVersion } from "./juegos.ts";
import type { AppEnv } from "../tipos.ts";

type Contexto = { juego: FilaJuego; version: FilaVersion; spec: GameSpec };

async function contexto(db: D1Database, juegoId: string, versionId: string): Promise<Contexto> {
  const juego = await db.prepare("SELECT * FROM games WHERE id = ?").bind(juegoId).first<FilaJuego>();
  if (!juego) noEncontrado("El juego no existe.");
  const version = await db
    .prepare("SELECT * FROM game_versions WHERE id = ? AND game_id = ?")
    .bind(versionId, juegoId)
    .first<FilaVersion>();
  if (!version) noEncontrado("La versión no existe para ese juego.");
  return { juego, version, spec: JSON.parse(version.spec) as GameSpec };
}

function criteriosDelSpec(spec: GameSpec): Map<string, string> {
  const mapa = new Map<string, string>();
  for (const nivel of spec.niveles) {
    for (const item of nivel.items) mapa.set(item.id, item.criterio);
  }
  return mapa;
}

async function asegurarAlumno(db: D1Database, alumnoId: string) {
  const existe = await db.prepare("SELECT 1 FROM students WHERE id = ?").bind(alumnoId).first();
  if (!existe) {
    await db
      .prepare("INSERT INTO students (id, nombre, creado_en) VALUES (?, ?, ?)")
      .bind(alumnoId, "Alumno", ahora())
      .run();
  }
}

type ResultadoIntento = {
  intentoId: string;
  juegoId: string;
  aciertos: number;
  total: number;
  minimoLogro: number;
  logrado: boolean;
  duplicado: boolean;
};

export async function guardarIntento(
  db: D1Database,
  alumnoId: string,
  datos: IntentoEntrada,
  clave: string | null,
): Promise<ResultadoIntento> {
  if (clave) {
    const previo = await db
      .prepare(
        `SELECT id, aciertos, total, minimo_logro, logrado
           FROM attempts WHERE clave_idempotencia = ?`,
      )
      .bind(clave)
      .first<{
        id: string;
        aciertos: number;
        total: number;
        minimo_logro: number;
        logrado: number;
      }>();
    if (previo) {
      return {
        intentoId: previo.id,
        juegoId: datos.juegoId,
        aciertos: previo.aciertos,
        total: previo.total,
        minimoLogro: previo.minimo_logro,
        logrado: previo.logrado === 1,
        duplicado: true,
      };
    }
  }

  const { spec } = await contexto(db, datos.juegoId, datos.versionId);
  const criterios = criteriosDelSpec(spec);
  for (const item of datos.items) {
    const criterio = criterios.get(item.itemId);
    if (!criterio) {
      validacion(`El ítem "${item.itemId}" no pertenece a esta versión del juego.`);
    }
    if (criterio !== item.criterio) {
      validacion(
        `El criterio del ítem "${item.itemId}" es "${criterio}", no "${item.criterio}".`,
      );
    }
  }

  await asegurarAlumno(db, alumnoId);

  const total = totalItems(spec);
  const aciertos = datos.items.filter((i) => i.correcto).length;
  const minimoLogro = spec.evaluacion.minimoLogro;
  const logrado = total > 0 && aciertos / total >= minimoLogro;
  const intentoId = nuevoId();
  const creadoEn = ahora();

  const sentencias = [
    db
      .prepare(
        `INSERT INTO attempts
          (id, game_id, version_id, student_id, fuente, iniciado_en, duracion_ms,
           aciertos, total, minimo_logro, logrado, clave_idempotencia, creado_en)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        intentoId,
        datos.juegoId,
        datos.versionId,
        alumnoId,
        datos.fuente,
        datos.iniciadoEn,
        datos.duracionMs,
        aciertos,
        total,
        minimoLogro,
        logrado ? 1 : 0,
        clave,
        creadoEn,
      ),
    ...datos.items.map((item) =>
      db
        .prepare(
          `INSERT INTO answers
            (id, attempt_id, item_id, criterio, correcto, tiempo_ms, intentos)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          nuevoId(),
          intentoId,
          item.itemId,
          item.criterio,
          item.correcto ? 1 : 0,
          item.tiempoMs,
          item.intentos,
        ),
    ),
  ];

  await db.batch(sentencias);

  return {
    intentoId,
    juegoId: datos.juegoId,
    aciertos,
    total,
    minimoLogro,
    logrado,
    duplicado: false,
  };
}

export function rutasIntentos(app: Hono<AppEnv>) {
  app.post("/api/intentos", soloAlumno, async (c) => {
    const alumnoId = alumnoActual(c);
    const datos = await leerCuerpo(c, EsquemaIntento);
    const clave = c.req.header("Idempotency-Key")?.trim() || null;
    const resultado = await guardarIntento(c.env.DB, alumnoId, datos, clave);
    return c.json(resultado);
  });

  app.post("/api/intentos/lote", soloAlumno, async (c) => {
    const alumnoId = alumnoActual(c);
    const { intentos } = await leerCuerpo(c, EsquemaLote);
    const resultados = [];

    for (const intento of intentos) {
      const { claveIdempotencia, ...datos } = intento;
      try {
        const resultado = await guardarIntento(c.env.DB, alumnoId, datos, claveIdempotencia);
        resultados.push({
          claveIdempotencia,
          estado: resultado.duplicado ? ("duplicado" as const) : ("guardado" as const),
          intentoId: resultado.intentoId,
        });
      } catch (error) {
        resultados.push({
          claveIdempotencia,
          estado: "rechazado" as const,
          motivo: error instanceof ErrorHttp ? error.message : "Error interno al guardar el intento.",
        });
      }
    }

    return c.json({ resultados });
  });
}
