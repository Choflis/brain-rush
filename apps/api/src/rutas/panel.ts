import type { GameSpec } from "@brain-rush/gamespec";
import type { Context, Hono } from "hono";
import { soloDocente } from "../auth.ts";
import { ahora, leerJson } from "../db.ts";
import { noEncontrado } from "../errores.ts";
import type { FilaJuego, FilaVersion } from "./juegos.ts";
import type { AppEnv } from "../tipos.ts";

type FilaCriterio = { criterio: string; aciertos: number; total: number };
type FilaRiesgo = { student_id: string; nombre: string; aciertos: number; total: number };

function csv(valor: unknown): string {
  const texto = String(valor ?? "");
  return /[",\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

async function contextoPanel(db: D1Database, juegoId: string) {
  const juego = await db.prepare("SELECT * FROM games WHERE id = ?").bind(juegoId).first<FilaJuego>();
  if (!juego) noEncontrado("El juego no existe.");
  const version = await db
    .prepare(
      "SELECT * FROM game_versions WHERE game_id = ? ORDER BY publicada DESC, numero DESC LIMIT 1",
    )
    .bind(juego.id)
    .first<FilaVersion>();
  if (!version) noEncontrado("El juego no tiene versiones.");
  return { juego, version, spec: JSON.parse(version.spec) as GameSpec };
}

export function rutasPanel(app: Hono<AppEnv>) {
  // Un solo patrón: Hono no distingue bien ":param.csv" de ":param".
  // El sufijo .csv se decide dentro del manejador.
  app.get("/api/panel/:juegoId{[^/]+}", soloDocente, async (c) => {
    const crudo = c.req.param("juegoId");
    if (!crudo.toLowerCase().endsWith(".csv")) {
      return panelJson(c, crudo);
    }
    const juegoId = crudo.slice(0, -4);
    const juego = await c.env.DB.prepare("SELECT id, titulo FROM games WHERE id = ?")
      .bind(juegoId)
      .first<{ id: string; titulo: string }>();
    if (!juego) noEncontrado("El juego no existe.");

    const { results } = await c.env.DB.prepare(
      `SELECT
         att.student_id AS alumno_id,
         s.nombre AS nombre,
         att.id AS intento_id,
         att.version_id AS version_id,
         att.fuente AS fuente,
         ans.item_id AS item_id,
         ans.criterio AS criterio,
         ans.correcto AS correcto,
         ans.tiempo_ms AS tiempo_ms,
         att.creado_en AS fecha
       FROM answers ans
       JOIN attempts att ON att.id = ans.attempt_id
       JOIN students s ON s.id = att.student_id
       WHERE att.game_id = ?
       ORDER BY att.creado_en, att.student_id, ans.item_id`,
    )
      .bind(juego.id)
      .all<Record<string, unknown>>();

    const cabecera = [
      "alumno_id",
      "nombre",
      "intento_id",
      "version_id",
      "fuente",
      "item_id",
      "criterio",
      "correcto",
      "tiempo_ms",
      "fecha",
    ];
    const lineas = [
      cabecera.join(","),
      ...results.map((fila) => cabecera.map((clave) => csv(fila[clave])).join(",")),
    ];

    return new Response(lineas.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="brain-rush-${juego.id}.csv"`,
      },
    });
  });

}

async function panelJson(c: Context<AppEnv>, juegoId: string) {
    const { juego, version, spec } = await contextoPanel(c.env.DB, juegoId);
    const minimo = spec.evaluacion.minimoLogro;

    const participacion = await c.env.DB.prepare(
      "SELECT COUNT(*) AS intentos, COUNT(DISTINCT student_id) AS alumnos FROM attempts WHERE game_id = ?",
    )
      .bind(juego.id)
      .first<{ intentos: number; alumnos: number }>();
    const completados = await c.env.DB.prepare(
      `SELECT COUNT(*) AS total FROM attempts a
        WHERE a.game_id = ?
          AND (SELECT COUNT(*) FROM answers WHERE attempt_id = a.id) >= ?`,
    )
      .bind(juego.id, spec.niveles.reduce((n, nivel) => n + nivel.items.length, 0))
      .first<{ total: number }>();

    const { results: filasCriterio } = await c.env.DB.prepare(
      `SELECT ans.criterio AS criterio,
              SUM(ans.correcto) AS aciertos,
              COUNT(*) AS total
         FROM answers ans
         JOIN attempts att ON att.id = ans.attempt_id
        WHERE att.game_id = ?
        GROUP BY ans.criterio`,
    )
      .bind(juego.id)
      .all<FilaCriterio>();
    const porCriterioMapa = new Map(filasCriterio.map((f) => [f.criterio, f]));

    const porCriterio = spec.criterios.map((criterio) => {
      const fila = porCriterioMapa.get(criterio.id);
      const total = fila?.total ?? 0;
      const aciertos = fila?.aciertos ?? 0;
      return {
        criterio: criterio.id,
        texto: criterio.texto,
        aciertos,
        total,
        porcentaje: total > 0 ? aciertos / total : 0,
      };
    });

    const { results: filasRiesgo } = await c.env.DB.prepare(
      `SELECT att.student_id AS student_id, s.nombre AS nombre,
              SUM(ans.correcto) AS aciertos, COUNT(*) AS total
         FROM attempts att
         JOIN answers ans ON ans.attempt_id = att.id
         JOIN students s ON s.id = att.student_id
        WHERE att.game_id = ?
        GROUP BY att.student_id, s.nombre
       HAVING SUM(ans.correcto) * 1.0 / COUNT(*) < ?
        ORDER BY SUM(ans.correcto) * 1.0 / COUNT(*) ASC
        LIMIT 20`,
    )
      .bind(juego.id, minimo)
      .all<FilaRiesgo>();

    const riesgo = [];
    for (const fila of filasRiesgo) {
      const { results: criterios } = await c.env.DB.prepare(
        `SELECT ans.criterio AS criterio, SUM(ans.correcto) * 1.0 / COUNT(*) AS porcentaje
           FROM answers ans
           JOIN attempts att ON att.id = ans.attempt_id
          WHERE att.game_id = ? AND att.student_id = ?
          GROUP BY ans.criterio`,
      )
        .bind(juego.id, fila.student_id)
        .all<{ criterio: string; porcentaje: number }>();

      riesgo.push({
        alumnoId: fila.student_id,
        nombre: fila.nombre,
        aciertos: fila.aciertos,
        total: fila.total,
        criteriosBajos: criterios.filter((x) => x.porcentaje < minimo).map((x) => x.criterio),
      });
    }

    return c.json({
      juego: {
        id: juego.id,
        titulo: juego.titulo,
        tipo: juego.tipo,
        mecanica: juego.mecanica,
        nivel: juego.nivel,
        grados: leerJson<number[]>(juego.grados, []),
        estado: juego.estado,
        versionActual: juego.version_actual,
        codigo: juego.codigo,
        creadoEn: juego.creado_en,
        origenGeneracion: leerJson<Record<string, unknown>>(version.origen_generacion, {}),
      },
      participacion: {
        intentos: participacion?.intentos ?? 0,
        alumnos: participacion?.alumnos ?? 0,
        completados: completados?.total ?? 0,
      },
      porCriterio,
      riesgo,
      generadoEn: ahora(),
    });
}
