import { z } from "zod";

export const NIVELES = ["N1", "N2", "N3"] as const;
export const GRADOS_POR_NIVEL = { N1: [1, 2], N2: [3, 4], N3: [5, 6] } as const;
export const LIMITE_PALABRAS = { N1: 8, N2: 15, N3: 25 } as const;
export const UNIDADES = ["km", "hm", "dam", "m", "dm", "cm", "mm"] as const;
export const DIFICULTADES = ["facil", "medio", "avanzado"] as const;
export const RETRO_OK = ["estrella", "aplauso"] as const;
export const RETRO_ERROR = ["pista"] as const;
export const ACCIONES_TIENDA = ["clasificar", "pedido"] as const;

const Recurso = z
  .object({
    asset: z.string().min(1).optional(),
    texto: z.string().min(1).optional(),
  })
  .refine((r) => r.asset !== undefined || r.texto !== undefined, {
    message: "Cada pantalla requiere un asset o un texto",
  });

const Retro = z.object({
  ok: z.enum(RETRO_OK),
  error: z.enum(RETRO_ERROR),
});

// Tienda (N1, activación): el niño arrastra productos a su estantería.
// accion "clasificar": todos los productos van a su estantería.
// accion "pedido": el cliente pide una cantidad de una categoría; el niño la lleva a la bolsa.
const ItemTienda = z.object({
  id: z.string().min(1),
  criterio: z.string().min(1),
  accion: z.enum(ACCIONES_TIENDA),
  consigna: Recurso.optional(),
  estanterias: z
    .array(z.object({ id: z.string().min(1), asset: z.string().min(1) }))
    .min(2)
    .max(3),
  productos: z
    .array(z.object({ id: z.string().min(1), asset: z.string().min(1), categoria: z.string().min(1) }))
    .min(4)
    .max(10),
  pedido: z
    .object({
      categoria: z.string().min(1),
      cantidad: z.number().int().min(1).max(10),
    })
    .optional(),
  retro: Retro,
});

// Carrera (N2, complemento): Reglita convierte medidas con botones ×10 y ÷10 y arrastra el resultado.
const ItemCarrera = z.object({
  id: z.string().min(1),
  criterio: z.string().min(1),
  enunciado: Recurso,
  cantidad: z.number().positive(),
  desde: z.enum(UNIDADES),
  hasta: z.enum(UNIDADES),
  opciones: z.array(z.number()).min(3).max(4),
  correcta: z.number().int().min(0),
  retro: Retro,
});

const Nivel = (items: z.ZodType) =>
  z.object({
    dificultad: z.enum(DIFICULTADES),
    items: z.array(items).min(3),
  });

const Comun = {
  specVersion: z.literal("1.0"),
  titulo: z.string().min(3).max(60),
  tipo: z.enum(["activacion", "complemento"]),
  nivel: z.enum(NIVELES),
  grados: z.array(z.number().int().min(1).max(6)).min(1),
  duracionMin: z.number().int().min(5).max(15),
  origen: z.object({
    sesion: z.string().min(1),
    grado: z.number().int().min(1).max(6),
    area: z.string().min(1),
    competencia: z.string().min(1),
  }),
  criterios: z.array(z.object({ id: z.string().min(1), texto: z.string().min(1) })).min(1),
  personaje: z.object({ id: z.string().min(1), nombre: z.string().min(1) }),
  escenario: z.object({ id: z.string().min(1), tema: z.string().min(1) }),
  tutorial: z.object({
    animacion: z.string().min(1),
    texto: z.string().min(1).optional(),
  }),
  evaluacion: z.object({ minimoLogro: z.number().min(0).max(1) }),
};

// Meta colectiva de la activación: el camión se llena entre todos los alumnos.
const MetaColectiva = z.object({
  tipo: z.literal("camion"),
  objetivo: z.number().int().min(5).max(15),
});

export const TiendaSpecSchema = z.object({
  ...Comun,
  mecanica: z.literal("tienda"),
  meta: MetaColectiva.optional(),
  niveles: z.array(Nivel(ItemTienda)).length(3),
});

export const CarreraSpecSchema = z.object({
  ...Comun,
  mecanica: z.literal("carrera"),
  niveles: z.array(Nivel(ItemCarrera)).length(3),
});

export const GameSpecSchema = z.discriminatedUnion("mecanica", [TiendaSpecSchema, CarreraSpecSchema]);

export type GameSpec = z.infer<typeof GameSpecSchema>;
export type ItemTienda = z.infer<typeof ItemTienda>;
export type ItemCarrera = z.infer<typeof ItemCarrera>;
export type Unidad = (typeof UNIDADES)[number];
