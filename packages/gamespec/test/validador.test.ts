import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { validarGameSpec } from "../src/validate.ts";
import { catalogoIds } from "../src/catalogo.ts";

const RAIZ = join(import.meta.dirname, "..", "..", "..");
const cargar = (ruta: string) => JSON.parse(readFileSync(join(RAIZ, ruta), "utf8"));

test("los fixtures N1 y N2 pasan la validación con el catálogo de assets", () => {
  for (const ruta of ["fixtures/juegos/n1-tienda.json", "fixtures/juegos/n2-carrera-unidades-longitud.json"]) {
    const resultado = validarGameSpec(cargar(ruta), { assets: catalogoIds() });
    assert.equal(resultado.ok, true, `${ruta}: ${resultado.ok ? "" : resultado.errores.join("; ")}`);
  }
});

test("un spec sin criterios o con un asset inexistente se rechaza", () => {
  const spec = cargar("fixtures/juegos/n2-carrera-unidades-longitud.json");
  const roto = structuredClone(spec);
  roto.niveles[0].items[0].retro = undefined;
  const resultado = validarGameSpec(roto, { assets: catalogoIds() });
  assert.equal(resultado.ok, false);
});
