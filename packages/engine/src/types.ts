import type { GameSpec, ItemTienda } from "../../gamespec/src/schema.ts";

export type { ItemTienda };
export type TiendaSpec = Extract<GameSpec, { mecanica: "tienda" }>;

export type EventoMotor =
  | { tipo: "inicio"; juegoId: string; versionId: string; mecanica: "tienda" | "carrera"; alumnoId?: string; salaId?: string; iniciadoEn: string }
  | { tipo: "respuesta"; itemId: string; criterio: string; correcto: boolean; tiempoMs: number; intentos: number }
  | { tipo: "fin"; aciertos: number; total: number; duracionMs: number; completado: boolean };

export interface OpcionesTienda {
  juegoId: string;
  versionId: string;
  onEvent?: (evento: EventoMotor) => void;
  now?: () => number;
  wallNow?: () => string;
}

export type FaseTienda = "ready" | "playing" | "item-complete" | "paused" | "help" | "finished";

export interface TiendaSnapshot {
  phase: FaseTienda;
  item: ItemTienda;
  itemIndex: number;
  totalItems: number;
  difficulty: "facil" | "medio" | "avanzado";
  placedIds: string[];
  attempts: number;
  completedItems: number;
  target: number;
  progress: number;
  completed: boolean;
}

export interface ResultadoDrop {
  kind: "correct" | "wrong" | "ignored" | "cancelled";
  completed: boolean;
}

export interface TiendaController {
  start(): void;
  drop(productId: string, destination: string | null): ResultadoDrop;
  next(): void;
  pause(): void;
  resume(): void;
  showHelp(): void;
  closeHelp(): void;
  finish(): void;
  restart(): void;
  getSnapshot(): TiendaSnapshot;
  subscribe(listener: () => void): () => void;
}
