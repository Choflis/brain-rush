import { z } from "zod";

export const EsquemaCriterio = z.object({
  id: z.string().min(1).max(20),
  texto: z.string().min(1).max(500),
});

export const EsquemaSesion = z.object({
  titulo: z.string().min(3).max(200),
  area: z.string().min(1).max(80),
  grado: z.number().int().min(1).max(6),
  competencia: z.string().min(1).max(300),
  capacidad: z.string().max(300).nullable().optional(),
  desempenos: z.array(z.string().min(1).max(500)).max(10).default([]),
  criterios: z.array(EsquemaCriterio).min(1).max(6),
  instrumento: z.string().max(200).nullable().optional(),
  proposito: z.string().max(1000).nullable().optional(),
  momentos: z
    .object({
      inicio: z.string().nullable().optional(),
      desarrollo: z.string().nullable().optional(),
      cierre: z.string().nullable().optional(),
    })
    .default({}),
  materiales: z.array(z.string().min(1).max(200)).max(30).default([]),
});

export const EsquemaCrearJuego = z.object({
  sesionId: z.string().min(1).optional(),
  tipo: z.enum(["activacion", "complemento"]),
  mecanica: z.enum(["tienda", "carrera"]),
  duracionMin: z.number().int().min(5).max(15).default(8),
  titulo: z.string().min(3).max(60).optional(),
  codigo: z.string().min(3).max(12).optional(),
  spec: z.unknown().optional(),
  origenGeneracion: z.record(z.string(), z.unknown()).optional(),
});

export const EsquemaPublicar = z.object({
  versionId: z.string().min(1),
});

export const EsquemaItemIntento = z.object({
  itemId: z.string().min(1).max(60),
  criterio: z.string().min(1).max(20),
  correcto: z.boolean(),
  tiempoMs: z.number().int().min(0).max(3_600_000),
  intentos: z.number().int().min(1).max(20).default(1),
});

export const EsquemaIntento = z.object({
  juegoId: z.string().min(1),
  versionId: z.string().min(1),
  fuente: z.enum(["digital", "papel", "sala"]),
  iniciadoEn: z.string().min(1),
  duracionMs: z.number().int().min(0).max(3_600_000),
  items: z.array(EsquemaItemIntento).min(1).max(60),
});

export const EsquemaLote = z.object({
  intentos: z
    .array(EsquemaIntento.extend({ claveIdempotencia: z.string().min(8).max(80) }))
    .min(1)
    .max(50),
});

export const EsquemaSala = z.object({
  juegoId: z.string().min(1),
  maxAlumnos: z.number().int().min(1).max(60).default(40),
});

export const EsquemaUnirse = z.object({
  nombre: z.string().trim().min(1).max(40),
});

export const EsquemaRespuestaSala = z.object({
  itemId: z.string().min(1).max(60),
  criterio: z.string().min(1).max(20),
  correcto: z.boolean(),
  tiempoMs: z.number().int().min(0).max(3_600_000),
});

export const EsquemaAvanzar = z.object({
  ronda: z.number().int().min(1).max(100),
});

export const EsquemaSemilla = z.object({
  sesiones: z
    .array(
      EsquemaSesion.extend({
        id: z.string().min(1),
      }),
    )
    .default([]),
  juegos: z
    .array(
      z.object({
        id: z.string().min(1),
        codigo: z.string().min(3).max(12),
        sessionId: z.string().min(1).nullable().optional(),
        origenGeneracion: z.record(z.string(), z.unknown()).default({}),
        spec: z.unknown(),
      }),
    )
    .default([]),
});

export type SesionEntrada = z.infer<typeof EsquemaSesion>;
export type IntentoEntrada = z.infer<typeof EsquemaIntento>;
export type ItemIntentoEntrada = z.infer<typeof EsquemaItemIntento>;
