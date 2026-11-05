import type { TiendaSpec, ItemTienda } from "../../../../packages/engine/src/types";

export const recursosVisuales: Record<string, "aguas" | "gaseosas" | "jugos"> = {
  "producto-agua": "aguas", "producto-gaseosa": "gaseosas", "producto-jugo": "jugos",
  "estanteria-aguas": "aguas", "estanteria-gaseosas": "gaseosas", "estanteria-jugos": "jugos",
};
export function recursoFaltante(spec: TiendaSpec): string | null {
  for (const [id, esperado] of [[spec.personaje.id, "personaje-reglita"], [spec.escenario.id, "escenario-tiendita"], [spec.tutorial.animacion, "anim-tutorial-tienda"]]) if (id !== esperado) return id!;
  for (const nivel of spec.niveles) for (const item of nivel.items as ItemTienda[]) {
    for (const s of item.estanterias) if (!s.asset.startsWith("estanteria-") || !recursosVisuales[s.asset]) return s.asset;
    for (const p of item.productos) if (!p.asset.startsWith("producto-") || !recursosVisuales[p.asset]) return p.asset;
    if (item.consigna?.asset && (!item.consigna.asset.startsWith("producto-") || !recursosVisuales[item.consigna.asset])) return item.consigna.asset;
  }
  return null;
}
