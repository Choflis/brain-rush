import { validarGameSpec, type GameSpec } from "@brain-rush/gamespec";
import type { Hono } from "hono";
import { z } from "zod";
import { soloDocente } from "../auth.ts";
import { ahora, codigoLegible, escribirJson, leerJson, nuevoId } from "../db.ts";
import { conflicto, ErrorHttp, leerCuerpo, noEncontrado, validacion } from "../errores.ts";
import { EsquemaCrearJuego, EsquemaPublicar } from "../esquemas.ts";
import type { AppEnv } from "../tipos.ts";

export type FilaJuego = {
  id: string;
  session_id: string | null;
  titulo: string;
  tipo: "activacion" | "complemento";
  mecanica: "tienda" | "carrera";
  nivel: "N1" | "N2" | "N3";
  grados: string;
  estado: "borrador" | "publicado";
  version_actual: number;
  codigo: string;
  creado_en: string;
};

export type FilaVersion = {
  id: string;
  game_id: string;
  numero: number;
  spec: string;
  origen_generacion: string;
  publicada: number;
  publicada_en: string | null;
  creada_en: string;
};

type JuegoPublicado = {
  juego: FilaJuego;
  version: FilaVersion;
  spec: GameSpec;
};

export async function buscarPublicado(
  db: D1Database,
  codigo: string,
): Promise<JuegoPublicado | null> {
  const juego = await db
    .prepare("SELECT * FROM games WHERE codigo = ? AND estado = 'publicado'")
    .bind(codigo.toUpperCase())
    .first<FilaJuego>();
  if (!juego) return null;
  const version = await db
    .prepare("SELECT * FROM game_versions WHERE game_id = ? AND publicada = 1 ORDER BY numero DESC LIMIT 1")
    .bind(juego.id)
    .first<FilaVersion>();
  if (!version) return null;
  return { juego, version, spec: JSON.parse(version.spec) as GameSpec };
}

function aResumen(juego: FilaJuego) {
  return {
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
  };
}

async function codigoDisponible(db: D1Database, base: string): Promise<string> {
  const limpio = base.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8) || "JUEGO";
  for (let intento = 0; intento < 20; intento++) {
    const codigo = intento === 0 ? limpio : `${limpio.slice(0, 6)}${intento + 1}`;
    const existe = await db.prepare("SELECT 1 FROM games WHERE codigo = ?").bind(codigo).first();
    if (!existe) return codigo;
  }
  return `${limpio.slice(0, 5)}${Date.now().toString(36).slice(-3).toUpperCase()}`;
}

export function rutasJuegos(app: Hono<AppEnv>) {
  app.get("/api/juegos", soloDocente, async (c) => {
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM games ORDER BY creado_en DESC",
    ).all<FilaJuego>();
    return c.json({ juegos: results.map(aResumen) });
  });

  app.get("/api/juegos/:id", soloDocente, async (c) => {
    const juego = await c.env.DB.prepare("SELECT * FROM games WHERE id = ?")
      .bind(c.req.param("id"))
      .first<FilaJuego>();
    if (!juego) noEncontrado("El juego no existe.");
    const { results: versiones } = await c.env.DB.prepare(
      "SELECT * FROM game_versions WHERE game_id = ? ORDER BY numero DESC",
    )
      .bind(juego.id)
      .all<FilaVersion>();

    return c.json({
      ...aResumen(juego),
      sesionId: juego.session_id,
      origenGeneracion: leerJson<Record<string, unknown>>(
        versiones[0]?.origen_generacion,
        {},
      ),
      versiones: versiones.map((v) => ({
        id: v.id,
        numero: v.numero,
        creadoEn: v.creada_en,
        publicada: v.publicada === 1,
      })),
    });
  });

  app.post("/api/juegos", soloDocente, async (c) => {
    const datos = await leerCuerpo(c, EsquemaCrearJuego);
    if (datos.spec === undefined) {
      throw new ErrorHttp(
        501,
        "INTERNO",
        "La generación automática llega con U5. Mientras tanto, importa un GameSpec validado.",
      );
    }

    const resultado = validarGameSpec(datos.spec);
    if (!resultado.ok) {
      validacion("El GameSpec no pasó la validación.", resultado.errores);
    }
    const spec = resultado.spec;
    if (spec.mecanica !== datos.mecanica || spec.tipo !== datos.tipo) {
      validacion("El spec no coincide con el tipo o la mecánica solicitados.", [
        `spec: ${spec.tipo}/${spec.mecanica}; cuerpo: ${datos.tipo}/${datos.mecanica}`,
      ]);
    }

    const id = nuevoId();
    const versionId = nuevoId();
    const codigo = await codigoDisponible(c.env.DB, datos.codigo ?? codigoLegible(spec.titulo, spec.mecanica));
    const creadoEn = ahora();
    const origen = datos.origenGeneracion ?? {
      generadoPor: "importado",
      promptVersion: "desconocida",
    };

    await c.env.DB.batch([
      c.env.DB.prepare(
        `INSERT INTO games
          (id, session_id, titulo, tipo, mecanica, nivel, grados, estado, version_actual, codigo, creado_en)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'borrador', 1, ?, ?)`,
      ).bind(
        id,
        datos.sesionId ?? null,
        spec.titulo,
        spec.tipo,
        spec.mecanica,
        spec.nivel,
        escribirJson(spec.grados),
        codigo,
        creadoEn,
      ),
      c.env.DB.prepare(
        `INSERT INTO game_versions
          (id, game_id, numero, spec, origen_generacion, publicada, creada_en)
         VALUES (?, ?, 1, ?, ?, 0, ?)`,
      ).bind(versionId, id, escribirJson(spec), escribirJson(origen), creadoEn),
    ]);

    return c.json(
      {
        juegoId: id,
        versionId,
        estado: "borrador",
        codigo,
        spec,
        origenGeneracion: origen,
      },
      201,
    );
  });

  app.post("/api/juegos/:id/publicar", soloDocente, async (c) => {
    const { versionId } = await leerCuerpo(c, EsquemaPublicar);
    const juego = await c.env.DB.prepare("SELECT * FROM games WHERE id = ?")
      .bind(c.req.param("id"))
      .first<FilaJuego>();
    if (!juego) noEncontrado("El juego no existe.");

    const version = await c.env.DB.prepare(
      "SELECT * FROM game_versions WHERE id = ? AND game_id = ?",
    )
      .bind(versionId, juego.id)
      .first<FilaVersion>();
    if (!version) noEncontrado("La versión no existe para ese juego.");

    const resultado = validarGameSpec(JSON.parse(version.spec));
    if (!resultado.ok) {
      validacion("La versión no pasa la validación y no se puede publicar.", resultado.errores);
    }
    if (version.publicada === 1 && juego.estado === "publicado") {
      conflicto("Esa versión ya está publicada.");
    }

    const publicadoEn = ahora();
    await c.env.DB.batch([
      c.env.DB.prepare("UPDATE game_versions SET publicada = 0 WHERE game_id = ?").bind(juego.id),
      c.env.DB.prepare(
        "UPDATE game_versions SET publicada = 1, publicada_en = ? WHERE id = ?",
      ).bind(publicadoEn, versionId),
      c.env.DB.prepare(
        "UPDATE games SET estado = 'publicado', version_actual = ? WHERE id = ?",
      ).bind(version.numero, juego.id),
    ]);

    return c.json({
      juegoId: juego.id,
      versionId,
      estado: "publicado",
      publicadoEn,
    });
  });

  app.get("/api/j/:codigo", async (c) => {
    const publicado = await buscarPublicado(c.env.DB, c.req.param("codigo"));
    if (!publicado) noEncontrado("El juego no existe o no está publicado.");
    return c.json({
      juegoId: publicado.juego.id,
      codigo: publicado.juego.codigo,
      versionId: publicado.version.id,
      version: publicado.version.numero,
      publicadoEn: publicado.version.publicada_en,
      spec: publicado.spec,
    });
  });

  app.post("/api/j/:codigo/entrar", async (c) => {
    const { nombre } = await leerCuerpo(c, z.object({ nombre: z.string().trim().min(1).max(40) }));
    const publicado = await buscarPublicado(c.env.DB, c.req.param("codigo"));
    if (!publicado) noEncontrado("El juego no existe o no está publicado.");

    const alumnoId = nuevoId();
    await c.env.DB.prepare("INSERT INTO students (id, nombre, creado_en) VALUES (?, ?, ?)")
      .bind(alumnoId, nombre, ahora())
      .run();

    return c.json({
      alumnoId,
      token: `demo-alumno-${alumnoId}`,
      juegoId: publicado.juego.id,
      versionId: publicado.version.id,
      spec: publicado.spec,
    });
  });
}
