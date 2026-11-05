import test, { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  CATALOGO_VISUAL,
  resolverVisual,
  tieneVisual,
  type FormaVisual
} from "./visuales.ts";

const FORMAS_VALIDAS: Set<FormaVisual> = new Set([
  "rectangulo",
  "circulo",
  "cuadrado",
  "estrella",
  "triangulo",
  "capsula"
]);

function extraerIdsAssets(obj: unknown, coleccion: Set<string> = new Set()): Set<string> {
  if (!obj || typeof obj !== "object") return coleccion;

  for (const [clave, valor] of Object.entries(obj)) {
    if ((clave === "asset" || clave === "animacion") && typeof valor === "string") {
      coleccion.add(valor);
    } else if ((clave === "personaje" || clave === "escenario") && valor && typeof valor === "object") {
      const vObj = valor as Record<string, unknown>;
      if (typeof vObj.id === "string") {
        coleccion.add(vObj.id);
      }
    } else if (typeof valor === "object") {
      extraerIdsAssets(valor, coleccion);
    }
  }
  return coleccion;
}

describe("Resolvedor visual (src/visuales.ts)", () => {
  const rutaFixtureN1 = resolve(process.cwd(), "../../fixtures/juegos/n1-tienda.json");
  const rutaFixtureN2 = resolve(
    process.cwd(),
    "../../fixtures/juegos/n2-carrera-unidades-longitud.json"
  );

  const fixtureN1 = JSON.parse(readFileSync(rutaFixtureN1, "utf8"));
  const fixtureN2 = JSON.parse(readFileSync(rutaFixtureN2, "utf8"));

  const assetsN1 = extraerIdsAssets(fixtureN1);
  const assetsN2 = extraerIdsAssets(fixtureN2);
  const todosLosAssets = new Set([...assetsN1, ...assetsN2]);

  it("extrae assets de los dos fixtures exitosamente", () => {
    assert.ok(assetsN1.size > 0, "N1 debe declarar assets");
    assert.ok(assetsN2.size > 0, "N2 debe declarar assets");
    assert.ok(todosLosAssets.size >= 15, "Deben encontrarse al menos 15 assets únicos");
  });

  it("todos los assets de los dos fixtures tienen una entrada en el resolvedor", () => {
    for (const assetId of todosLosAssets) {
      assert.ok(
        tieneVisual(assetId),
        `El assetId '${assetId}' debe tener una entrada en CATALOGO_VISUAL`
      );

      const res = resolverVisual(assetId);
      assert.ok(res, `resolverVisual('${assetId}') no debe retornar nulo`);
      assert.ok(
        typeof res.emoji === "string" && res.emoji.length > 0,
        `El asset '${assetId}' debe tener un emoji válido`
      );
      assert.ok(
        typeof res.color === "string" && res.color.startsWith("#"),
        `El asset '${assetId}' debe tener un color hexadecimal (#RRGGBB)`
      );
      assert.ok(
        FORMAS_VALIDAS.has(res.forma),
        `El asset '${assetId}' debe tener una forma geométrica válida (${res.forma})`
      );
    }
  });

  it("el resolvedor provee fallback seguro ante un asset desconocido", () => {
    const desconocido = "asset-inexistente-12345";
    assert.equal(tieneVisual(desconocido), false);

    const fallback = resolverVisual(desconocido);
    assert.ok(fallback.emoji.length > 0);
    assert.ok(fallback.color.startsWith("#"));
    assert.ok(FORMAS_VALIDAS.has(fallback.forma));
  });
});
