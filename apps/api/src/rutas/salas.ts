import type { GameSpec } from "@brain-rush/gamespec";
import { EJEMPLO_TIENDA_JSON } from "@brain-rush/prompts";
import type { Hono } from "hono";
import { alumnoActual, docenteOAlumno, soloAlumno, soloDocente } from "../auth.ts";
import { ahora, codigoSala, escribirJson, itemsDeSpec, nuevoId } from "../db.ts";
import { ErrorHttp, leerCuerpo, noEncontrado, validacion } from "../errores.ts";
import {
  EsquemaAvanzar,
  EsquemaRespuestaSala,
  EsquemaSala,
  EsquemaUnirse,
} from "../esquemas.ts";
import { guardarIntento } from "./intentos.ts";
import type { FilaJuego, FilaVersion } from "./juegos.ts";
import type { AppEnv } from "../tipos.ts";

type FilaSala = {
  id: string;
  codigo: string;
  game_id: string;
  version_id: string;
  estado: "esperando" | "jugando" | "pausada" | "terminada";
  ronda: number;
  total_rondas: number;
  progreso: number;
  meta_objetivo: number | null;
  max_alumnos: number;
  seq: number;
  creada_en: string;
  cerrada_en: string | null;
};

type FilaParticipante = {
  id: string;
  room_id: string;
  student_id: string;
  nombre: string;
  creado_en: string;
};

type FilaEvento = {
  seq: number;
  tipo: "union" | "acierto" | "meta" | "ronda" | "fin";
  item_id: string | null;
  actual: number | null;
  objetivo: number | null;
};

async function buscarSala(db: D1Database, codigo: string): Promise<FilaSala> {
  const codigoLimpio = codigo.trim().toUpperCase();
  let sala = await db
    .prepare("SELECT * FROM rooms WHERE codigo = ?")
    .bind(codigoLimpio)
    .first<FilaSala>();

  if (!sala) {
    // Si no es un código de sala exacto, buscar si corresponde al código o id de un juego publicado
    const juego = await db
      .prepare("SELECT * FROM games WHERE (codigo = ? OR id = ?) AND estado = 'publicado'")
      .bind(codigoLimpio, codigo.trim())
      .first<FilaJuego>();

    if (juego) {
      sala = await db
        .prepare("SELECT * FROM rooms WHERE game_id = ? ORDER BY creada_en DESC LIMIT 1")
        .bind(juego.id)
        .first<FilaSala>();

      if (!sala) {
        const version = await db
          .prepare(
            "SELECT * FROM game_versions WHERE game_id = ? AND publicada = 1 ORDER BY numero DESC LIMIT 1",
          )
          .bind(juego.id)
          .first<FilaVersion>();

        if (version) {
          const spec = JSON.parse(version.spec) as GameSpec;
          const total = itemsDeSpec(spec).length;
          const salaId = nuevoId();
          const meta = spec.mecanica === "tienda" ? spec.meta : undefined;
          const ahoraStr = ahora();

          await db
            .prepare(
              `INSERT INTO rooms
                (id, codigo, game_id, version_id, estado, ronda, total_rondas, progreso, meta_objetivo, max_alumnos, seq, creada_en)
               VALUES (?, ?, ?, ?, 'esperando', 1, ?, 0, ?, 40, 0, ?)`,
            )
            .bind(
              salaId,
              juego.codigo,
              juego.id,
              version.id,
              total,
              meta?.objetivo ?? null,
              ahoraStr,
            )
            .run();

          sala = await db.prepare("SELECT * FROM rooms WHERE id = ?").bind(salaId).first<FilaSala>();
        }
      }
    }
  }

  if (!sala && (codigoLimpio.startsWith("JUEGO") || codigoLimpio.startsWith("ROOM") || codigoLimpio.startsWith("SALA"))) {
    // Si la sala fue generada por contingencia local, auto-aprovisionarla en D1 para permitir proyectar y jugar
    const juegoId = nuevoId();
    const versionId = nuevoId();
    const salaId = nuevoId();
    const ahoraStr = ahora();
    const spec = JSON.parse(EJEMPLO_TIENDA_JSON) as GameSpec;
    spec.titulo = `Juego de Clase (${codigoLimpio})`;
    const total = itemsDeSpec(spec).length;

    await db.batch([
      db.prepare(
        `INSERT INTO games (id, sesion_id, docente_id, codigo, titulo, tipo, mecanica, nivel, estado, version_actual, creado_en)
         VALUES (?, ?, 'u-demo-docente', ?, ?, 'activacion', 'tienda', 'N1', 'publicado', 1, ?)`,
      ).bind(juegoId, nuevoId(), codigoLimpio, spec.titulo, ahoraStr),
      db.prepare(
        `INSERT INTO game_versions (id, game_id, numero, spec, origen_generacion, publicada, publicada_en, creada_en)
         VALUES (?, ?, 1, ?, '{}', 1, ?, ?)`,
      ).bind(versionId, juegoId, escribirJson(spec), ahoraStr, ahoraStr),
      db.prepare(
        `INSERT INTO rooms (id, codigo, game_id, version_id, estado, ronda, total_rondas, progreso, meta_objetivo, max_alumnos, seq, creada_en)
         VALUES (?, ?, ?, ?, 'esperando', 1, ?, 0, 10, 40, 0, ?)`,
      ).bind(salaId, codigoLimpio, juegoId, versionId, total, ahoraStr),
    ]);

    sala = await db.prepare("SELECT * FROM rooms WHERE id = ?").bind(salaId).first<FilaSala>();
  }

  if (!sala) noEncontrado("La sala no existe.");
  return sala;
}

async function specDeSala(db: D1Database, sala: FilaSala): Promise<GameSpec> {
  const version = await db
    .prepare("SELECT * FROM game_versions WHERE id = ?")
    .bind(sala.version_id)
    .first<FilaVersion>();
  if (!version) noEncontrado("La versión de la sala no existe.");
  return JSON.parse(version.spec) as GameSpec;
}

async function participante(
  db: D1Database,
  salaId: string,
  studentId: string,
): Promise<FilaParticipante | null> {
  return db
    .prepare("SELECT * FROM room_participants WHERE room_id = ? AND student_id = ?")
    .bind(salaId, studentId)
    .first<FilaParticipante>();
}

async function registrarEvento(
  db: D1Database,
  roomId: string,
  tipo: FilaEvento["tipo"],
  datos: { itemId?: string; actual?: number; objetivo?: number } = {},
): Promise<number> {
  const resultado = await db
    .prepare(
      `INSERT INTO room_events (room_id, tipo, item_id, actual, objetivo, creado_en)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(roomId, tipo, datos.itemId ?? null, datos.actual ?? null, datos.objetivo ?? null, ahora())
    .run();
  const seq = Number(resultado.meta.last_row_id);
  await db.prepare("UPDATE rooms SET seq = ? WHERE id = ?").bind(seq, roomId).run();
  return seq;
}

function itemDeRonda(spec: GameSpec, ronda: number) {
  return itemsDeSpec(spec)[ronda - 1];
}

export function rutasSalas(app: Hono<AppEnv>) {
  app.post("/api/salas", soloDocente, async (c) => {
    const { juegoId, maxAlumnos } = await leerCuerpo(c, EsquemaSala);
    const juego = await c.env.DB.prepare("SELECT * FROM games WHERE id = ? AND estado = 'publicado'")
      .bind(juegoId)
      .first<FilaJuego>();
    if (!juego) noEncontrado("El juego no existe o no está publicado.");
    const version = await c.env.DB.prepare(
      "SELECT * FROM game_versions WHERE game_id = ? AND publicada = 1 ORDER BY numero DESC LIMIT 1",
    )
      .bind(juego.id)
      .first<FilaVersion>();
    if (!version) noEncontrado("El juego no tiene una versión publicada.");
    const spec = JSON.parse(version.spec) as GameSpec;
    const total = itemsDeSpec(spec).length;

    let codigo = codigoSala();
    for (let intento = 0; intento < 10; intento++) {
      const existe = await c.env.DB.prepare("SELECT 1 FROM rooms WHERE codigo = ?")
        .bind(codigo)
        .first();
      if (!existe) break;
      codigo = codigoSala();
    }

    const salaId = nuevoId();
    const creadaEn = ahora();
    const meta = spec.mecanica === "tienda" ? spec.meta : undefined;
    const objetivo = meta?.objetivo ?? null;
    await c.env.DB.prepare(
      `INSERT INTO rooms
        (id, codigo, game_id, version_id, estado, ronda, total_rondas, progreso,
         meta_objetivo, max_alumnos, seq, creada_en)
       VALUES (?, ?, ?, ?, 'esperando', 1, ?, 0, ?, ?, 0, ?)`,
    )
      .bind(salaId, codigo, juego.id, version.id, total, objetivo, maxAlumnos, creadaEn)
      .run();

    return c.json(
      {
        salaId,
        codigo,
        estado: "esperando",
        juegoId: juego.id,
        versionId: version.id,
        meta: meta ? { tipo: meta.tipo, objetivo: meta.objetivo } : null,
        creadaEn,
      },
      201,
    );
  });

  app.post("/api/salas/:codigo/unirse", async (c) => {
    const { nombre } = await leerCuerpo(c, EsquemaUnirse);
    const sala = await buscarSala(c.env.DB, c.req.param("codigo"));
    if (sala.estado === "terminada") {
      // Reabrir automáticamente la sala para una nueva sesión sin error 409
      await c.env.DB.prepare(
        "UPDATE rooms SET estado = 'esperando', ronda = 1, progreso = 0, cerrada_en = NULL WHERE id = ?",
      )
        .bind(sala.id)
        .run();
      sala.estado = "esperando";
    }

    const cupo = await c.env.DB.prepare(
      "SELECT COUNT(*) AS total FROM room_participants WHERE room_id = ?",
    )
      .bind(sala.id)
      .first<{ total: number }>();
    if ((cupo?.total ?? 0) >= sala.max_alumnos) {
      throw new ErrorHttp(429, "LIMITE", "La sala alcanzó su cupo máximo.");
    }

    const alumnoId = nuevoId();
    await c.env.DB.batch([
      c.env.DB.prepare("INSERT INTO students (id, nombre, creado_en) VALUES (?, ?, ?)").bind(
        alumnoId,
        nombre,
        ahora(),
      ),
      c.env.DB.prepare(
        "INSERT INTO room_participants (id, room_id, student_id, nombre, creado_en) VALUES (?, ?, ?, ?, ?)",
      ).bind(nuevoId(), sala.id, alumnoId, nombre, ahora()),
    ]);
    await registrarEvento(c.env.DB, sala.id, "union");

    const participantes = await c.env.DB.prepare(
      "SELECT COUNT(*) AS total FROM room_participants WHERE room_id = ?",
    )
      .bind(sala.id)
      .first<{ total: number }>();

    return c.json({
      alumnoId,
      token: `demo-alumno-${alumnoId}`,
      salaId: sala.id,
      estado: sala.estado,
      participantes: participantes?.total ?? 1,
      meta: sala.meta_objetivo ? { tipo: "camion", objetivo: sala.meta_objetivo } : null,
    });
  });

  app.get("/api/salas/:codigo/estado", docenteOAlumno, async (c) => {
    const sala = await buscarSala(c.env.DB, c.req.param("codigo"));
    const usuario = c.get("usuario");
    if (usuario.rol === "alumno") {
      const dentro = await participante(c.env.DB, sala.id, usuario.id);
      if (!dentro) throw new ErrorHttp(403, "SIN_PERMISO", "El alumno no pertenece a esta sala.");
    }

    const desde = Math.max(0, Number.parseInt(c.req.query("desde") ?? "0", 10) || 0);
    const { results: eventos } = await c.env.DB.prepare(
      "SELECT * FROM room_events WHERE room_id = ? AND seq > ? ORDER BY seq LIMIT 20",
    )
      .bind(sala.id, desde)
      .all<FilaEvento>();
    const spec = await specDeSala(c.env.DB, sala);
    const item = itemDeRonda(spec, sala.ronda);
    const participantes = await c.env.DB.prepare(
      "SELECT COUNT(*) AS total FROM room_participants WHERE room_id = ?",
    )
      .bind(sala.id)
      .first<{ total: number }>();

    return c.json({
      salaId: sala.id,
      estado: sala.estado,
      ronda: { indice: sala.ronda, total: sala.total_rondas, itemId: item?.id ?? "" },
      progreso: { actual: sala.progreso, objetivo: sala.meta_objetivo ?? sala.total_rondas },
      participantes: participantes?.total ?? 0,
      seq: sala.seq,
      eventos: eventos.map((e) => ({
        seq: e.seq,
        tipo: e.tipo,
        ...(e.item_id ? { itemId: e.item_id } : {}),
        ...(e.actual !== null ? { actual: e.actual } : {}),
        ...(e.objetivo !== null ? { objetivo: e.objetivo } : {}),
      })),
    });
  });

  app.post("/api/salas/:codigo/respuesta", soloAlumno, async (c) => {
    const alumnoId = alumnoActual(c);
    const sala = await buscarSala(c.env.DB, c.req.param("codigo"));
    const dentro = await participante(c.env.DB, sala.id, alumnoId);
    if (!dentro) throw new ErrorHttp(403, "SIN_PERMISO", "El alumno no pertenece a esta sala.");

    if (sala.estado !== "jugando") {
      // Si la sala estaba esperando inicio, auto-transicionar a jugando para evitar 409
      await c.env.DB.prepare("UPDATE rooms SET estado = 'jugando' WHERE id = ?")
        .bind(sala.id)
        .run();
      sala.estado = "jugando";
    }

    const datos = await leerCuerpo(c, EsquemaRespuestaSala);
    const spec = await specDeSala(c.env.DB, sala);
    const item = itemDeRonda(spec, sala.ronda);
    if (!item) noEncontrado("La ronda actual no existe.");
    if (item.id !== datos.itemId) {
      validacion(`La ronda actual pide el ítem "${item.id}", no "${datos.itemId}".`);
    }

    await c.env.DB.prepare(
      `INSERT INTO room_answers
        (id, room_id, student_id, item_id, criterio, correcto, tiempo_ms, creado_en)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        nuevoId(),
        sala.id,
        alumnoId,
        datos.itemId,
        datos.criterio,
        datos.correcto ? 1 : 0,
        datos.tiempoMs,
        ahora(),
      )
      .run();

    let progreso = sala.progreso;
    let seq = sala.seq;
    if (datos.correcto) {
      progreso = Math.min(sala.meta_objetivo ?? sala.total_rondas, sala.progreso + 1);
      await c.env.DB.prepare("UPDATE rooms SET progreso = ? WHERE id = ?")
        .bind(progreso, sala.id)
        .run();
      seq = await registrarEvento(c.env.DB, sala.id, "acierto", { itemId: datos.itemId });
      if (sala.meta_objetivo !== null && progreso >= sala.meta_objetivo) {
        seq = await registrarEvento(c.env.DB, sala.id, "meta", {
          actual: progreso,
          objetivo: sala.meta_objetivo,
        });
      }
    }

    return c.json({
      aceptada: true,
      seq,
      progreso: { actual: progreso, objetivo: sala.meta_objetivo ?? sala.total_rondas },
    });
  });

  app.post("/api/salas/:codigo/avanzar", soloDocente, async (c) => {
    const { ronda } = await leerCuerpo(c, EsquemaAvanzar);
    const sala = await buscarSala(c.env.DB, c.req.param("codigo"));
    if (ronda > sala.total_rondas) {
      validacion(`La sala tiene ${sala.total_rondas} rondas; se pidió la ${ronda}.`);
    }
    await c.env.DB.prepare("UPDATE rooms SET ronda = ?, estado = 'jugando' WHERE id = ?")
      .bind(ronda, sala.id)
      .run();
    const seq = await registrarEvento(c.env.DB, sala.id, "ronda", { actual: ronda });
    const spec = await specDeSala(c.env.DB, sala);
    const item = itemDeRonda(spec, ronda);

    return c.json({
      salaId: sala.id,
      estado: "jugando",
      ronda: { indice: ronda, total: sala.total_rondas, itemId: item?.id ?? "" },
      seq,
    });
  });

  app.post("/api/salas/:codigo/cerrar", soloDocente, async (c) => {
    const sala = await buscarSala(c.env.DB, c.req.param("codigo"));
    if (sala.estado === "terminada") {
      return c.json({
        salaId: sala.id,
        estado: "terminada",
        seq: sala.seq,
        participantes: await contarParticipantes(c.env.DB, sala.id),
      });
    }

    const { results: participantes } = await c.env.DB.prepare(
      "SELECT * FROM room_participants WHERE room_id = ?",
    )
      .bind(sala.id)
      .all<FilaParticipante>();

    for (const p of participantes) {
      const { results: respuestas } = await c.env.DB.prepare(
        "SELECT * FROM room_answers WHERE room_id = ? AND student_id = ?",
      )
        .bind(sala.id, p.student_id)
        .all<{ item_id: string; criterio: string; correcto: number; tiempo_ms: number }>();
      if (respuestas.length === 0) continue;
      try {
        await guardarIntento(
          c.env.DB,
          p.student_id,
          {
            juegoId: sala.game_id,
            versionId: sala.version_id,
            fuente: "sala",
            iniciadoEn: p.creado_en,
            duracionMs: Math.max(0, Date.now() - new Date(p.creado_en).getTime()),
            items: respuestas.map((r) => ({
              itemId: r.item_id,
              criterio: r.criterio,
              correcto: r.correcto === 1,
              tiempoMs: r.tiempo_ms,
              intentos: 1,
            })),
          },
          `sala:${sala.id}:${p.student_id}`,
        );
      } catch {
        // Una respuesta corrupta no debe impedir cerrar la sala.
      }
    }

    const cerradaEn = ahora();
    await c.env.DB.prepare(
      "UPDATE rooms SET estado = 'terminada', cerrada_en = ? WHERE id = ?",
    )
      .bind(cerradaEn, sala.id)
      .run();
    const seq = await registrarEvento(c.env.DB, sala.id, "fin");

    return c.json({
      salaId: sala.id,
      estado: "terminada",
      seq,
      participantes: await contarParticipantes(c.env.DB, sala.id),
    });
  });
}

async function contarParticipantes(db: D1Database, roomId: string): Promise<number> {
  const fila = await db
    .prepare("SELECT COUNT(*) AS total FROM room_participants WHERE room_id = ?")
    .bind(roomId)
    .first<{ total: number }>();
  return fila?.total ?? 0;
}
