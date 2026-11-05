import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as engine from "../src/index.ts";
import type { EventoMotor, TiendaController, TiendaSpec } from "../src/types.ts";

const fixture = JSON.parse(readFileSync(new URL("../../../fixtures/juegos/n1-tienda.json", import.meta.url), "utf8")) as TiendaSpec;

function setup(spec = structuredClone(fixture)) {
  const events: EventoMotor[] = [];
  let clock = 0;
  assert.equal(typeof engine.createTienda, "function", "the engine must expose createTienda");
  const controller = engine.createTienda(spec, {
    juegoId: "juego-tienda", versionId: "v1", onEvent: (event) => events.push(event),
    now: () => clock, wallNow: () => "2026-11-05T10:00:00.000Z",
  });
  return { controller, events, at: (time: number) => { clock = time; } };
}

function solve(controller: TiendaController) {
  const { item } = controller.getSnapshot();
  const products = item.accion === "clasificar" ? item.productos : item.productos.filter((product) => product.categoria === item.pedido!.categoria).slice(0, item.pedido!.cantidad);
  for (const product of products) controller.drop(product.id, item.accion === "clasificar" ? product.categoria : "bolsa");
}

test("creation stays ready without events and start emits a single frozen inicio", () => {
  const { controller, events, at } = setup();
  assert.equal(controller.getSnapshot().phase, "ready");
  assert.equal(controller.getSnapshot().totalItems, 12);
  assert.equal(controller.getSnapshot().item.id, "f1");
  assert.equal(controller.getSnapshot().difficulty, "facil");
  assert.equal(events.length, 0);
  at(90_000);
  controller.start(); controller.start();
  assert.equal(controller.getSnapshot().phase, "playing");
  assert.deepEqual(events, [{ tipo: "inicio", juegoId: "juego-tienda", versionId: "v1", mecanica: "tienda", iniciadoEn: "2026-11-05T10:00:00.000Z" }]);
});

test("f1 needs every product, ignores duplicates and awaits next for feedback", () => {
  const { controller, events } = setup();
  controller.start();
  assert.deepEqual(controller.drop("p1", "gaseosas"), { kind: "correct", completed: false });
  assert.deepEqual(controller.drop("p1", "gaseosas"), { kind: "ignored", completed: false });
  controller.drop("p2", "aguas"); controller.drop("p3", "gaseosas");
  assert.equal(events.length, 1);
  assert.deepEqual(controller.drop("p4", "aguas"), { kind: "correct", completed: true });
  assert.equal(controller.getSnapshot().phase, "item-complete");
  assert.equal(controller.getSnapshot().completedItems, 1);
  assert.equal(controller.getSnapshot().progress, 1);
  assert.equal(controller.getSnapshot().item.id, "f1");
  assert.deepEqual(controller.drop("p4", "aguas"), { kind: "ignored", completed: false });
  assert.equal(events.filter((event) => event.tipo === "respuesta").length, 1);
});

test("two educational errors yield intentos3; cancellation and unknown products do not", () => {
  const { controller, events, at } = setup();
  controller.start();
  assert.deepEqual(controller.drop("p1", null), { kind: "cancelled", completed: false });
  assert.deepEqual(controller.drop("missing", "aguas"), { kind: "ignored", completed: false });
  assert.equal(controller.getSnapshot().attempts, 1);
  assert.deepEqual(controller.drop("p1", "aguas"), { kind: "wrong", completed: false });
  assert.deepEqual(controller.drop("p2", "bolsa"), { kind: "wrong", completed: false });
  assert.deepEqual(controller.getSnapshot().placedIds, []);
  at(250); solve(controller);
  assert.deepEqual(events[1], { tipo: "respuesta", itemId: "f1", criterio: "C1", correcto: true, tiempoMs: 250, intentos: 3 });
});

test("next resets placements and attempts so p1 can be reused on f2", () => {
  const { controller } = setup();
  controller.start(); controller.drop("p1", "aguas"); solve(controller); controller.next();
  assert.equal(controller.getSnapshot().item.id, "f2");
  assert.equal(controller.getSnapshot().itemIndex, 1);
  assert.equal(controller.getSnapshot().attempts, 1);
  assert.deepEqual(controller.getSnapshot().placedIds, []);
  assert.deepEqual(controller.drop("p1", "aguas"), { kind: "correct", completed: false });
});

test("f3 accepts exactly three waters in bolsa and rejects wrong category or destination", () => {
  const { controller, events } = setup();
  controller.start(); solve(controller); controller.next(); solve(controller); controller.next();
  assert.equal(controller.getSnapshot().item.id, "f3");
  assert.deepEqual(controller.drop("p4", "bolsa"), { kind: "wrong", completed: false });
  assert.deepEqual(controller.drop("p1", "aguas"), { kind: "wrong", completed: false });
  controller.drop("p1", "bolsa"); controller.drop("p2", "bolsa");
  assert.equal(controller.getSnapshot().phase, "playing");
  assert.deepEqual(controller.drop("p3", "bolsa"), { kind: "correct", completed: true });
  assert.deepEqual(controller.getSnapshot().placedIds, ["p1", "p2", "p3"]);
  assert.equal(events.filter((event) => event.tipo === "respuesta").length, 3);
  assert.deepEqual(controller.drop("p5", "bolsa"), { kind: "ignored", completed: false });
});

test("all twelve items emit one response each and one completed fin only after last next", () => {
  const { controller, events } = setup();
  controller.start();
  for (let index = 0; index < 12; index++) {
    solve(controller);
    assert.equal(controller.getSnapshot().completedItems, index + 1);
    assert.equal(controller.getSnapshot().phase, "item-complete");
    assert.equal(controller.getSnapshot().completed, false);
    controller.next();
  }
  const snapshot = controller.getSnapshot();
  assert.equal(snapshot.phase, "finished"); assert.equal(snapshot.completed, true);
  assert.equal(snapshot.difficulty, "avanzado");
  assert.equal(snapshot.progress, 12);
  assert.equal(events.filter((event) => event.tipo === "inicio").length, 1);
  const responses = events.filter((event) => event.tipo === "respuesta");
  assert.deepEqual(responses.map((event) => event.itemId), ["f1", "f2", "f3", "f4", "m1", "m2", "m3", "m4", "a1", "a2", "a3", "a4"]);
  assert.deepEqual(events.at(-1), { tipo: "fin", aciertos: 12, total: 12, duracionMs: 0, completado: true });
  const eventCount = events.length;
  controller.next(); controller.finish(); controller.restart();
  assert.equal(events.length, eventCount);
  assert.equal(controller.getSnapshot().phase, "ready");
});

test("target8 clamps collective progress while all12 remain required", () => {
  const spec = structuredClone(fixture); spec.meta!.objetivo = 8;
  const { controller } = setup(spec); controller.start();
  for (let index = 0; index < 12; index++) {
    solve(controller);
    assert.equal(controller.getSnapshot().progress, Math.min(index + 1, 8));
    assert.equal(controller.getSnapshot().target, 8);
    assert.equal(controller.getSnapshot().completed, false);
    controller.next();
  }
  assert.equal(controller.getSnapshot().completedItems, 12);
  assert.equal(controller.getSnapshot().completed, true);
});

test("without collective meta the target uses total items", () => {
  const spec = structuredClone(fixture); delete spec.meta;
  const { controller } = setup(spec);
  assert.equal(controller.getSnapshot().target, 12);
});

test("pause and help exclude elapsed time, including pause nested over help", () => {
  const { controller, events, at } = setup();
  at(10_000); controller.start();
  at(10_100); controller.pause();
  at(20_000); controller.showHelp(); assert.equal(controller.getSnapshot().phase, "paused");
  controller.resume();
  at(20_050); controller.showHelp();
  at(25_000); controller.pause();
  at(30_000); controller.resume(); assert.equal(controller.getSnapshot().phase, "help");
  at(40_000); controller.closeHelp();
  at(40_025); solve(controller);
  assert.deepEqual(events[1], { tipo: "respuesta", itemId: "f1", criterio: "C1", correcto: true, tiempoMs: 175, intentos: 1 });
  controller.finish();
  assert.deepEqual(events[2], { tipo: "fin", aciertos: 1, total: 1, duracionMs: 175, completado: false });
});

test("item time starts on next and pause restores item-complete", () => {
  const { controller, events, at } = setup();
  controller.start(); at(100); solve(controller);
  at(200); controller.pause(); at(900); controller.resume();
  assert.equal(controller.getSnapshot().phase, "item-complete");
  at(1_000); controller.next(); at(1_040); solve(controller);
  assert.equal(events.filter((event) => event.tipo === "respuesta")[1]!.tiempoMs, 40);
  at(9_000); controller.finish();
  assert.equal(events.filter((event) => event.tipo === "fin")[0]!.duracionMs, 140);
});

test("finish emits incomplete totals for resolved items only and is idempotent", () => {
  const { controller, events, at } = setup();
  controller.start(); at(100); solve(controller); controller.next();
  controller.drop("p1", "aguas"); at(120); controller.finish(); controller.finish();
  assert.equal(controller.getSnapshot().phase, "finished");
  assert.equal(controller.getSnapshot().completed, false);
  assert.deepEqual(events.at(-1), { tipo: "fin", aciertos: 1, total: 1, duracionMs: 120, completado: false });
  assert.equal(events.filter((event) => event.tipo === "respuesta").length, 1);
  assert.equal(events.filter((event) => event.tipo === "fin").length, 1);
});

test("finish before start emits nothing and start cannot reopen a finished execution", () => {
  const { controller, events } = setup();
  controller.finish(); controller.start();
  assert.equal(controller.getSnapshot().phase, "finished");
  assert.deepEqual(events, []);
});

test("restart closes active execution, resets full state and delays new inicio", () => {
  const { controller, events, at } = setup();
  controller.start(); solve(controller); controller.next(); controller.drop("p1", "jugos");
  at(45); controller.restart();
  assert.deepEqual(events.at(-1), { tipo: "fin", aciertos: 1, total: 1, duracionMs: 45, completado: false });
  const snapshot = controller.getSnapshot();
  assert.equal(snapshot.phase, "ready"); assert.equal(snapshot.item.id, "f1");
  assert.equal(snapshot.itemIndex, 0); assert.equal(snapshot.attempts, 1);
  assert.equal(snapshot.completedItems, 0); assert.equal(snapshot.progress, 0);
  assert.equal(snapshot.completed, false); assert.deepEqual(snapshot.placedIds, []);
  assert.equal(events.filter((event) => event.tipo === "inicio").length, 1);
  controller.start(); assert.equal(events.filter((event) => event.tipo === "inicio").length, 2);
  at(50); solve(controller);
  assert.equal(events.filter((event) => event.tipo === "respuesta").at(-1)!.tiempoMs, 5);
});

test("snapshot identity is stable until changes; subscription observes published state", () => {
  const { controller } = setup();
  const initial = controller.getSnapshot();
  let calls = 0;
  const observed: string[] = [];
  const unsubscribe = controller.subscribe(() => { calls++; observed.push(controller.getSnapshot().phase); });
  controller.next(); controller.pause(); controller.resume(); controller.showHelp(); controller.closeHelp();
  controller.drop("p1", "gaseosas");
  assert.strictEqual(controller.getSnapshot(), initial); assert.equal(calls, 0);
  controller.start(); assert.notStrictEqual(controller.getSnapshot(), initial);
  const playing = controller.getSnapshot();
  controller.drop("p1", null); controller.drop("missing", "aguas"); controller.start();
  assert.strictEqual(controller.getSnapshot(), playing); assert.equal(calls, 1);
  controller.drop("p1", "gaseosas"); const placed = controller.getSnapshot();
  assert.deepEqual(playing.placedIds, []);
  controller.drop("p2", "aguas");
  assert.deepEqual(placed.placedIds, ["p1"]);
  assert.deepEqual(observed, ["playing", "playing", "playing"]);
  unsubscribe(); controller.pause(); assert.equal(calls, 3);
});

test("drops in pause/help are ignored without changing attempts or notifications", () => {
  const { controller } = setup(); controller.start();
  for (const enter of [() => controller.pause(), () => controller.showHelp()]) {
    enter(); const snapshot = controller.getSnapshot();
    assert.deepEqual(controller.drop("p1", "aguas"), { kind: "ignored", completed: false });
    assert.strictEqual(controller.getSnapshot(), snapshot);
    controller.resume(); controller.closeHelp();
  }
});

test("negative clock movements never produce negative elapsed values", () => {
  const { controller, events, at } = setup(); at(100); controller.start();
  at(50); solve(controller); at(25); controller.finish();
  assert.equal(events.filter((event) => event.tipo === "respuesta")[0]!.tiempoMs, 0);
  assert.equal(events.filter((event) => event.tipo === "fin")[0]!.duracionMs, 0);
});

test("controller never mutates the supplied spec", () => {
  const spec = structuredClone(fixture); const before = structuredClone(spec);
  const { controller } = setup(spec); controller.start(); solve(controller); controller.next(); controller.restart();
  assert.deepEqual(spec, before);
});

test("mutating snapshot item fields and arrays cannot change internal rules or the input spec", () => {
  const spec = structuredClone(fixture);
  const before = structuredClone(spec);
  const { controller } = setup(spec);
  controller.start();
  const snapshot = controller.getSnapshot();
  snapshot.item.productos[0]!.categoria = "otra";
  snapshot.item.productos.splice(1, 1);
  snapshot.item.estanterias.length = 0;
  snapshot.placedIds.push("p3");
  assert.deepEqual(controller.drop("p1", "gaseosas"), { kind: "correct", completed: false });
  assert.deepEqual(controller.drop("p2", "aguas"), { kind: "correct", completed: false });
  assert.deepEqual(controller.drop("p3", "gaseosas"), { kind: "correct", completed: false });
  assert.deepEqual(controller.drop("p4", "aguas"), { kind: "correct", completed: true });
  controller.next(); solve(controller); controller.next();
  const orderSnapshot = controller.getSnapshot();
  orderSnapshot.item.pedido!.categoria = "jugos";
  orderSnapshot.item.pedido!.cantidad = 1;
  orderSnapshot.item.productos.length = 0;
  assert.deepEqual(controller.drop("p1", "bolsa"), { kind: "correct", completed: false });
  assert.deepEqual(controller.drop("p2", "bolsa"), { kind: "correct", completed: false });
  assert.deepEqual(controller.drop("p3", "bolsa"), { kind: "correct", completed: true });
  assert.deepEqual(spec, before);
});

test("emitted times are integers while fractional segments retain precision internally", () => {
  const { controller, events, at } = setup();
  at(0.25); controller.start();
  at(0.5); controller.pause();
  at(1.75); controller.resume();
  at(3); solve(controller);
  controller.next();
  at(3.5); solve(controller);
  controller.finish();
  const responses = events.filter((event) => event.tipo === "respuesta");
  assert.equal(Number.isInteger(responses[0]!.tiempoMs), true);
  assert.equal(responses[0]!.tiempoMs, 2);
  assert.equal(Number.isInteger(responses[1]!.tiempoMs), true);
  assert.equal(responses[1]!.tiempoMs, 1);
  const finish = events.find((event) => event.tipo === "fin")!;
  assert.equal(Number.isInteger(finish.duracionMs), true);
  assert.equal(finish.duracionMs, 2);
});

test("response time is capped at one hour while execution duration keeps full elapsed time", () => {
  const { controller, events, at } = setup();
  controller.start();
  at(3_600_500.75); solve(controller); controller.finish();
  const response = events.find((event) => event.tipo === "respuesta")!;
  const finish = events.find((event) => event.tipo === "fin")!;
  assert.equal(response.tiempoMs, 3_600_000);
  assert.equal(finish.duracionMs, 3_600_501);
});
