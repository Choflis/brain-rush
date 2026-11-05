import { readFileSync } from "node:fs";
import { validarGameSpec } from "./validate.ts";
import { catalogoIds } from "./catalogo.ts";

const ruta = process.argv[2];
if (!ruta) {
  console.error("Uso: node packages/gamespec/src/cli.ts <juego.json>");
  process.exit(2);
}

const resultado = validarGameSpec(JSON.parse(readFileSync(ruta, "utf8")), { assets: catalogoIds() });
if (resultado.ok) {
  console.log(`OK · ${resultado.spec.titulo} (${resultado.spec.nivel}, ${resultado.spec.mecanica}, ${resultado.spec.tipo})`);
} else {
  console.error(`Inválido · ${resultado.errores.length} error(es):`);
  resultado.errores.forEach((e) => console.error(`  - ${e}`));
  process.exit(1);
}
