import { validarGameSpec } from "@brain-rush/gamespec";
import type { Hono } from "hono";
import { soloDocente } from "../auth.ts";
import { ahora, escribirJson } from "../db.ts";
import { leerCuerpo, validacion } from "../errores.ts";
import { EsquemaSemilla } from "../esquemas.ts";
import type { AppEnv } from "../tipos.ts";

function fechaDeSesion(): string {
  return ahora();
}

export function rutasDev(app: Hono<AppEnv>) {
  app.post("/api/dev/semilla", soloDocente, async (c) => {
    if (c.env.ENVIRONMENT !== "dev") {
      return c.json(
        { error: { codigo: "NO_ENCONTRADO", mensaje: "Ruta no disponible." } },
        404,
      );
    }

    const datos = await leerCuerpo(c, EsquemaSemilla);
    const creadoEn = fechaDeSesion();

    for (const sesion of datos.sesiones) {
      await c.env.DB.prepare(
        `INSERT INTO sessions
          (id, school_id, titulo, area, grado, competencia, capacidad, desempenos, criterios,
           instrumento, proposito, momentos, materiales, creado_en)
         VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           titulo = excluded.titulo,
           area = excluded.area,
           grado = excluded.grado,
           competencia = excluded.competencia,
           capacidad = excluded.capacidad,
           desempenos = excluded.desempenos,
           criterios = excluded.criterios,
           instrumento = excluded.instrumento,
           proposito = excluded.proposito,
           momentos = excluded.momentos,
           materiales = excluded.materiales`,
      )
        .bind(
          sesion.id,
          sesion.titulo,
          sesion.area,
          sesion.grado,
          sesion.competencia,
          sesion.capacidad ?? null,
          escribirJson(sesion.desempenos),
          escribirJson(sesion.criterios),
          sesion.instrumento ?? null,
          sesion.proposito ?? null,
          escribirJson(sesion.momentos),
          escribirJson(sesion.materiales),
          creadoEn,
        )
        .run();
    }

    for (const juego of datos.juegos) {
      const resultado = validarGameSpec(juego.spec);
      if (!resultado.ok) {
        validacion(`El spec de "${juego.id}" no pasa la validación.`, resultado.errores);
      }
      const spec = resultado.spec;
      const versionId = `v1-${juego.id}`;

      await c.env.DB.batch([
        c.env.DB.prepare(
          `INSERT INTO games
            (id, session_id, titulo, tipo, mecanica, nivel, grados, estado, version_actual, codigo, creado_en)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'publicado', 1, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             session_id = excluded.session_id,
             titulo = excluded.titulo,
             tipo = excluded.tipo,
             mecanica = excluded.mecanica,
             nivel = excluded.nivel,
             grados = excluded.grados,
             estado = 'publicado',
             version_actual = 1,
             codigo = excluded.codigo`,
        ).bind(
          juego.id,
          juego.sessionId ?? null,
          spec.titulo,
          spec.tipo,
          spec.mecanica,
          spec.nivel,
          escribirJson(spec.grados),
          juego.codigo.toUpperCase(),
          creadoEn,
        ),
        c.env.DB.prepare(
          `INSERT INTO game_versions
            (id, game_id, numero, spec, origen_generacion, publicada, publicada_en, creada_en)
           VALUES (?, ?, 1, ?, ?, 1, ?, ?)
           ON CONFLICT(game_id, numero) DO UPDATE SET
             id = excluded.id,
             spec = excluded.spec,
             origen_generacion = excluded.origen_generacion,
             publicada = 1,
             publicada_en = excluded.publicada_en`,
        ).bind(
          versionId,
          juego.id,
          escribirJson(spec),
          escribirJson(juego.origenGeneracion),
          creadoEn,
          creadoEn,
        ),
      ]);
    }

    return c.json({
      sesiones: datos.sesiones.length,
      juegos: datos.juegos.length,
      creadoEn,
    });
  });
}
