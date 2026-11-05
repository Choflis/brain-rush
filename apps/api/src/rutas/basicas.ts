import type { Hono } from "hono";
import { z } from "zod";
import { soloDocente, TOKEN_DOCENTE } from "../auth.ts";
import { ahora, escribirJson, leerJson, nuevoId } from "../db.ts";
import { leerCuerpo, noEncontrado } from "../errores.ts";
import { EsquemaSesion } from "../esquemas.ts";
import type { AppEnv } from "../tipos.ts";

type FilaSesion = {
  id: string;
  school_id: string | null;
  titulo: string;
  area: string;
  grado: number;
  competencia: string;
  capacidad: string | null;
  desempenos: string;
  criterios: string;
  instrumento: string | null;
  proposito: string | null;
  momentos: string;
  materiales: string;
  creado_en: string;
};

function aSesion(fila: FilaSesion) {
  return {
    id: fila.id,
    titulo: fila.titulo,
    area: fila.area,
    grado: fila.grado,
    competencia: fila.competencia,
    capacidad: fila.capacidad,
    desempenos: leerJson<string[]>(fila.desempenos, []),
    criterios: leerJson<{ id: string; texto: string }[]>(fila.criterios, []),
    instrumento: fila.instrumento,
    proposito: fila.proposito,
    momentos: leerJson<Record<string, string | null>>(fila.momentos, {}),
    materiales: leerJson<string[]>(fila.materiales, []),
    creadoEn: fila.creado_en,
  };
}

const EsquemaAuth = z.object({ rol: z.literal("docente") });

export function rutasBasicas(app: Hono<AppEnv>) {
  app.get("/api/salud", (c) => c.json({ ok: true, version: "0.1.0" }));

  app.post("/api/auth/demo", async (c) => {
    await leerCuerpo(c, EsquemaAuth);
    return c.json({
      token: TOKEN_DOCENTE,
      usuario: { id: "u-demo-docente", rol: "docente", nombre: "Docente demo" },
    });
  });

  app.get("/api/sesiones", soloDocente, async (c) => {
    const { results } = await c.env.DB.prepare(
      "SELECT id, titulo, area, grado, creado_en FROM sessions ORDER BY creado_en DESC",
    ).all<Pick<FilaSesion, "id" | "titulo" | "area" | "grado" | "creado_en">>();
    return c.json({
      sesiones: results.map((s) => ({
        id: s.id,
        titulo: s.titulo,
        area: s.area,
        grado: s.grado,
        creadoEn: s.creado_en,
      })),
    });
  });

  app.post("/api/sesiones", soloDocente, async (c) => {
    const datos = await leerCuerpo(c, EsquemaSesion);
    const id = nuevoId();
    await c.env.DB.prepare(
      `INSERT INTO sessions
        (id, school_id, titulo, area, grado, competencia, capacidad, desempenos, criterios,
         instrumento, proposito, momentos, materiales, creado_en)
       VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        id,
        datos.titulo,
        datos.area,
        datos.grado,
        datos.competencia,
        datos.capacidad ?? null,
        escribirJson(datos.desempenos),
        escribirJson(datos.criterios),
        datos.instrumento ?? null,
        datos.proposito ?? null,
        escribirJson(datos.momentos),
        escribirJson(datos.materiales),
        ahora(),
      )
      .run();

    return c.json({ id, ...datos, creadoEn: ahora() }, 201);
  });

  app.get("/api/sesiones/:id", soloDocente, async (c) => {
    const fila = await c.env.DB.prepare("SELECT * FROM sessions WHERE id = ?")
      .bind(c.req.param("id"))
      .first<FilaSesion>();
    if (!fila) noEncontrado("La sesión no existe.");
    return c.json(aSesion(fila));
  });
}
