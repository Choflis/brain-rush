import test from "node:test";
import assert from "node:assert/strict";
import { retoCantidad, resumirEvidencias } from "../../../apps/web/src/juego/curriculo.ts";
import fixture from "../../../fixtures/juegos/n1-tienda.json" with { type: "json" };
test("la etiqueta fácil cuenta el subgrupo y avanzada el grupo completo",()=>{
 const item=fixture.niveles[0]!.items[0]!;
 assert.equal(retoCantidad(item as never,"facil").cantidad,2);
 assert.equal(retoCantidad(item as never,"avanzado").cantidad,4);
 assert.equal(retoCantidad(item as never,"avanzado").alcance,"grupo");
});
test("el pedido representa la cantidad pedida sin inventar un precio",()=>{
 const item=fixture.niveles[0]!.items[2]!;
 assert.equal(retoCantidad(item as never,"medio").cantidad,3);
});
test("primer intento asistido no se presenta como independencia",()=>{
 const r=resumirEvidencias([{itemId:"f1",criterio:"C1",fase:"accion",intentos:1,ayudas:1,tiempoMs:400}]);
 assert.equal(r.C1.primeroSinAyuda,0);assert.equal(r.C1.conAyuda,1);
 assert.equal(r.C2.observadas,0);
});
test("correcciones y tipos de evidencia permanecen separados",()=>{
 const r=resumirEvidencias([{itemId:"f1",criterio:"C1",fase:"accion",intentos:3,ayudas:0,tiempoMs:400},{itemId:"f1",criterio:"C2",fase:"numero",intentos:1,ayudas:0,tiempoMs:300}]);
 assert.equal(r.C1.correcciones,2);assert.equal(r.C2.primeroSinAyuda,1);assert.equal(r.C2.numericas,1);
});
test("cero observaciones no equivale a cero por ciento de logro",()=>{
 const r=resumirEvidencias([]);assert.equal(r.C1.porcentajeIndependiente,null);
});
