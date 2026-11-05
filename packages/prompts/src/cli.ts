import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderizar } from "./render.ts";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const CATALOGO = join(RAIZ, "..", "assets", "catalogo.json");
const LIMITES = { N1: 8, N2: 15, N3: 25 } as const;
const GRADOS = { N1: "1 y 2", N2: "3 y 4", N3: "5 y 6" } as const;

const args: Record<string, string> = {};
for (let i = 2; i < process.argv.length; i += 2) {
  args[process.argv[i]!.replace(/^--/, "")] = process.argv[i + 1] ?? "";
}

const nivel = (args.nivel ?? "") as keyof typeof LIMITES;
const mecanica = args.mecanica ?? "carrera";
if (!args.sesion || !(nivel in LIMITES) || !args.tipo || !args.mecanica) {
  console.error("Uso: --sesion <json> --nivel N1|N2|N3 --tipo activacion|complemento --mecanica tienda|carrera [--duracion 8]");
  process.exit(2);
}

const sesion = readFileSync(args.sesion, "utf8");
const assets = (JSON.parse(readFileSync(CATALOGO, "utf8")) as { assets: { id: string; tipo: string; niveles: string[]; descripcion: string }[] }).assets
  .filter((a) => a.niveles.includes(nivel));
const plantilla = readFileSync(join(RAIZ, "generacion", "v1.md"), "utf8");
const ejemplo = readFileSync(join(RAIZ, "ejemplos", `${mecanica}.json`), "utf8");

process.stdout.write(
  renderizar(plantilla, {
    SESION_JSON: sesion.trim(),
    NIVEL: nivel,
    GRADOS: GRADOS[nivel],
    TIPO: args.tipo,
    MECANICA: mecanica,
    DURACION: args.duracion ?? "8",
    ASSETS: JSON.stringify(assets, null, 2),
    LIMITE: String(LIMITES[nivel]),
    EJEMPLO: "```json\n" + ejemplo.trim() + "\n```",
  }),
);
