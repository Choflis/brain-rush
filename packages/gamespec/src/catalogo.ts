import { readFileSync } from "node:fs";

const RUTA = new URL("../../assets/catalogo.json", import.meta.url);

export function catalogoIds(): Set<string> {
  const data = JSON.parse(readFileSync(RUTA, "utf8")) as { assets: { id: string }[] };
  return new Set(data.assets.map((a) => a.id));
}
