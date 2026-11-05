import type { GameSpec, ItemCarrera, ItemTienda } from "@brain-rush/gamespec";

export const nuevoId = (): string => crypto.randomUUID();

export const ahora = (): string => new Date().toISOString();

export function leerJson<T>(texto: string | null | undefined, porDefecto: T): T {
  if (!texto) return porDefecto;
  try {
    return JSON.parse(texto) as T;
  } catch {
    return porDefecto;
  }
}

export function escribirJson(valor: unknown): string {
  return JSON.stringify(valor);
}

export type ItemSpec = ItemTienda | ItemCarrera;

export function itemsDeSpec(spec: GameSpec): ItemSpec[] {
  const items: ItemSpec[] = [];
  for (const nivel of spec.niveles) {
    for (const item of nivel.items) items.push(item);
  }
  return items;
}

export function totalItems(spec: GameSpec): number {
  return itemsDeSpec(spec).length;
}

export function codigoLegible(titulo: string, mecanica: string): string {
  const base = titulo
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);
  return base.length >= 4 ? base : mecanica.toUpperCase();
}

const ALFABETO_SALA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function codigoSala(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALFABETO_SALA[b % ALFABETO_SALA.length]).join("");
}
