import test, { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { GameSpec } from "@brain-rush/gamespec";
import { EscenaBase } from "./escena.ts";
import { EmisorEventosMotor, type EventoMotor } from "./eventos.ts";

describe("EscenaBase (Phaser)", () => {
  const rutaFixtureN1 = resolve(process.cwd(), "../../fixtures/juegos/n1-tienda.json");
  const rutaFixtureN2 = resolve(
    process.cwd(),
    "../../fixtures/juegos/n2-carrera-unidades-longitud.json"
  );

  const fixtureTienda: GameSpec = JSON.parse(readFileSync(rutaFixtureN1, "utf8"));
  const fixtureCarrera: GameSpec = JSON.parse(readFileSync(rutaFixtureN2, "utf8"));

  it("carga el fixture de Tienda (N1) sin lanzar excepciones en el constructor", () => {
    assert.doesNotThrow(() => {
      const escena = new EscenaBase(fixtureTienda, "v1");
      assert.ok(escena);
      assert.equal(escena.spec.mecanica, "tienda");
      assert.equal(escena.versionId, "v1");
      assert.equal(escena.totalItems, 12); // 4 + 4 + 4
    });
  });

  it("carga el fixture de Carrera (N2) sin lanzar excepciones en el constructor", () => {
    assert.doesNotThrow(() => {
      const escena = new EscenaBase({
        spec: fixtureCarrera,
        versionId: "v1",
        alumnoId: "alu_test",
        salaId: "sala_test"
      });
      assert.ok(escena);
      assert.equal(escena.spec.mecanica, "carrera");
      assert.equal(escena.versionId, "v1");
      assert.equal(escena.alumnoId, "alu_test");
      assert.equal(escena.salaId, "sala_test");
      assert.equal(escena.totalItems, 9); // 3 + 3 + 3
    });
  });

  it("muestra tutorial y emite inicio al terminar", () => {
    const emisor = new EmisorEventosMotor();
    const eventos: EventoMotor[] = [];
    emisor.suscribir((e) => eventos.push(e));

    const escena = new EscenaBase({
      spec: fixtureTienda,
      versionId: "v1",
      emisor,
      duracionTutorialMs: 3000
    });

    assert.equal(escena.tutorialFinalizado, false);

    // Simular inicio del tutorial
    escena.iniciarTutorial();
    assert.equal(escena.tutorialFinalizado, false);
    assert.equal(eventos.length, 0);

    // Finalizar el tutorial
    escena.finalizarTutorial();
    assert.equal(escena.tutorialFinalizado, true);
    assert.equal(eventos.length, 1);

    const inicio = eventos[0];
    assert.equal(inicio?.tipo, "inicio");
    if (inicio?.tipo === "inicio") {
      assert.equal(inicio.mecanica, "tienda");
      assert.equal(inicio.versionId, "v1");
      assert.ok(inicio.iniciadoEn);
    }
  });

  it("expone emitirRespuesta y acumula estadísticas", () => {
    const emisor = new EmisorEventosMotor();
    const eventos: EventoMotor[] = [];
    emisor.suscribir((e) => eventos.push(e));

    const escena = new EscenaBase({
      spec: fixtureCarrera,
      versionId: "v2",
      emisor
    });

    escena.emitirRespuesta({
      itemId: "f1",
      criterio: "C3",
      correcto: true,
      tiempoMs: 3200,
      intentos: 1
    });

    escena.emitirRespuesta({
      itemId: "f2",
      criterio: "C3",
      correcto: false,
      tiempoMs: 5100,
      intentos: 2
    });

    assert.equal(eventos.length, 2);
    assert.equal(escena.aciertos, 1);
    assert.equal(escena.respuestasEmitidas.length, 2);

    assert.deepEqual(eventos[0], {
      tipo: "respuesta",
      itemId: "f1",
      criterio: "C3",
      correcto: true,
      tiempoMs: 3200,
      intentos: 1
    });
  });

  it("expone cerrarConFin y emite evento fin", () => {
    const emisor = new EmisorEventosMotor();
    const eventos: EventoMotor[] = [];
    emisor.suscribir((e) => eventos.push(e));

    const escena = new EscenaBase({
      spec: fixtureTienda,
      versionId: "v1",
      emisor
    });

    escena.cerrarConFin({
      aciertos: 10,
      total: 12,
      duracionMs: 180000,
      completado: true
    });

    assert.equal(eventos.length, 1);
    assert.deepEqual(eventos[0], {
      tipo: "fin",
      aciertos: 10,
      total: 12,
      duracionMs: 180000,
      completado: true
    });
  });

  it("la capa de feedback no lanza excepciones por ausencia de assets gráficos", () => {
    const escena = new EscenaBase(fixtureTienda, "v1");
    assert.doesNotThrow(() => {
      escena.feedback.mostrarAcierto("estrella");
      escena.feedback.mostrarAcierto("aplauso");
      escena.feedback.mostrarError("Revisa la consigna");
    });
  });
});
