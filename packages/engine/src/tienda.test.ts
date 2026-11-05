import test, { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { GameSpec } from "@brain-rush/gamespec";
import { MecanicaTienda, EscenaTienda } from "./tienda.ts";
import { EmisorEventosMotor, type EventoMotor } from "./eventos.ts";

describe("MecanicaTienda (Phaser - N1 Activación)", () => {
  const rutaFixtureN1 = resolve(process.cwd(), "../../fixtures/juegos/n1-tienda.json");
  const rutaFixtureN2 = resolve(
    process.cwd(),
    "../../fixtures/juegos/n2-carrera-unidades-longitud.json"
  );

  const fixtureTienda: GameSpec = JSON.parse(readFileSync(rutaFixtureN1, "utf8"));
  const fixtureCarrera: GameSpec = JSON.parse(readFileSync(rutaFixtureN2, "utf8"));

  it("la mecánica carga el fixture N1 sin lanzar excepciones en el constructor", () => {
    assert.doesNotThrow(() => {
      const escena = new MecanicaTienda(fixtureTienda, "v1");
      assert.ok(escena);
      assert.equal(escena.spec.mecanica, "tienda");
      assert.equal(escena.versionId, "v1");
      assert.equal(escena.totalItems, 12);
      assert.equal(escena.todosLosItems.length, 12);
      assert.ok(escena.itemActual);
      assert.equal(escena.itemActual.id, "f1");
    });
  });

  it("exporta también EscenaTienda como alias de MecanicaTienda", () => {
    assert.equal(MecanicaTienda, EscenaTienda);
    const escena = new EscenaTienda(fixtureTienda, "v1");
    assert.ok(escena instanceof MecanicaTienda);
  });

  it("rechaza specs que no correspondan a la mecánica 'tienda'", () => {
    assert.throws(
      () => {
        new MecanicaTienda(fixtureCarrera as any, "v1");
      },
      {
        message: /mecanica 'tienda'/
      }
    );
  });

  it("emite inicio al finalizar el tutorial (usando duracionTutorialMs: 0)", () => {
    const emisor = new EmisorEventosMotor();
    const eventos: EventoMotor[] = [];
    emisor.suscribir((e) => eventos.push(e));

    const escena = new MecanicaTienda({
      spec: fixtureTienda,
      versionId: "v1",
      emisor,
      duracionTutorialMs: 0
    });

    assert.equal(escena.tutorialFinalizado, false);
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

  it("un acierto de clasificación emite respuesta con correcto: true y el criterio del ítem", () => {
    const emisor = new EmisorEventosMotor();
    const eventos: EventoMotor[] = [];
    emisor.suscribir((e) => eventos.push(e));

    const escena = new MecanicaTienda({
      spec: fixtureTienda,
      versionId: "v1",
      emisor,
      duracionTutorialMs: 0
    });

    escena.finalizarTutorial();
    assert.equal(escena.itemActual?.id, "f1");
    assert.equal(escena.itemActual?.criterio, "C1");

    // En f1: producto 'p1' es gaseosa, estantería 'gaseosas' coincide
    const acierto = escena.clasificarProducto("p1", "gaseosas");
    assert.equal(acierto, true);

    const respuestas = eventos.filter((e) => e.tipo === "respuesta");
    assert.equal(respuestas.length, 1);

    const resp = respuestas[0];
    assert.ok(resp && resp.tipo === "respuesta");
    if (resp && resp.tipo === "respuesta") {
      assert.equal(resp.correcto, true);
      assert.equal(resp.itemId, "f1");
      assert.equal(resp.criterio, "C1");
      assert.equal(resp.intentos, 1);
      assert.ok(typeof resp.tiempoMs === "number");
    }
  });

  it("un error emite respuesta con correcto: false (sin penalización, puede reintentar)", () => {
    const emisor = new EmisorEventosMotor();
    const eventos: EventoMotor[] = [];
    emisor.suscribir((e) => eventos.push(e));

    const escena = new MecanicaTienda({
      spec: fixtureTienda,
      versionId: "v1",
      emisor,
      duracionTutorialMs: 0
    });

    escena.finalizarTutorial();
    // En f1: producto 'p2' es agua, intentar ponerlo en 'gaseosas' debe dar error
    const fallo = escena.clasificarProducto("p2", "gaseosas");
    assert.equal(fallo, false);

    const respuestas = eventos.filter((e) => e.tipo === "respuesta");
    assert.equal(respuestas.length, 1);

    const resp = respuestas[0];
    assert.ok(resp && resp.tipo === "respuesta");
    if (resp && resp.tipo === "respuesta") {
      assert.equal(resp.correcto, false);
      assert.equal(resp.itemId, "f1");
      assert.equal(resp.criterio, "C1");
      assert.equal(resp.intentos, 1);
    }

    // Reintento: no está penalizado y se puede colocar en la estantería correcta 'aguas'
    assert.equal(escena.productosClasificados.has("p2"), false);
    const reintento = escena.clasificarProducto("p2", "aguas");
    assert.equal(reintento, true);

    const respuestas2 = eventos.filter((e) => e.tipo === "respuesta");
    assert.equal(respuestas2.length, 2);
    const resp2 = respuestas2[1];
    if (resp2 && resp2.tipo === "respuesta") {
      assert.equal(resp2.correcto, true);
      assert.equal(resp2.itemId, "f1");
      assert.equal(resp2.intentos, 2);
    }
  });

  it("Fase 2 · Pedido: arrastrar a la bolsa productos requeridos emite respuesta al completar", () => {
    const emisor = new EmisorEventosMotor();
    const eventos: EventoMotor[] = [];
    emisor.suscribir((e) => eventos.push(e));

    const escena = new MecanicaTienda({
      spec: fixtureTienda,
      versionId: "v1",
      emisor,
      duracionTutorialMs: 0
    });

    // Cargar directamente el ítem f3 (acción: "pedido", requiere 3 aguas, criterio C2)
    escena.cargarItem(2);
    assert.equal(escena.itemActual?.id, "f3");
    assert.equal(escena.itemActual?.accion, "pedido");
    assert.equal(escena.itemActual?.pedido?.categoria, "aguas");
    assert.equal(escena.itemActual?.pedido?.cantidad, 3);
    assert.equal(escena.itemActual?.criterio, "C2");

    // Arrastrar producto incorrecto a la bolsa (p4 es jugo)
    const errorProd = escena.arrastrarABolsa("p4");
    assert.equal(errorProd, false);

    let respuestas = eventos.filter((e) => e.tipo === "respuesta");
    assert.equal(respuestas.length, 1);
    assert.equal(respuestas[0]?.tipo === "respuesta" && respuestas[0].correcto, false);

    // Arrastrar 1er producto correcto (p1 es agua)
    const paso1 = escena.arrastrarABolsa("p1");
    assert.equal(paso1, true);
    assert.equal(escena.productosEnBolsa.length, 1);
    // Todavía no completa el total (3), no emite respuesta de completado aún
    respuestas = eventos.filter((e) => e.tipo === "respuesta");
    assert.equal(respuestas.length, 1);

    // Arrastrar 2do producto correcto (p2 es agua)
    const paso2 = escena.arrastrarABolsa("p2");
    assert.equal(paso2, true);
    assert.equal(escena.productosEnBolsa.length, 2);

    // Arrastrar 3er producto correcto (p3 es agua) -> completa el pedido
    const paso3 = escena.arrastrarABolsa("p3");
    assert.equal(paso3, true);

    respuestas = eventos.filter((e) => e.tipo === "respuesta");
    assert.equal(respuestas.length, 2);
    const respCompletado = respuestas[1];
    assert.ok(respCompletado && respCompletado.tipo === "respuesta");
    if (respCompletado && respCompletado.tipo === "respuesta") {
      assert.equal(respCompletado.correcto, true);
      assert.equal(respCompletado.itemId, "f3");
      assert.equal(respCompletado.criterio, "C2");
    }
  });

  it("Fase 3 · Meta colectiva: el camión avanza con cada acierto", () => {
    const escena = new MecanicaTienda({
      spec: fixtureTienda,
      versionId: "v1",
      duracionTutorialMs: 0
    });

    assert.equal(escena.progresoCamion, 0);
    assert.equal(escena.objetivoCamion, 12);

    // 1 acierto en clasificación
    escena.clasificarProducto("p1", "gaseosas");
    assert.equal(escena.progresoCamion, 1);

    // Un error no avanza el camión
    escena.clasificarProducto("p2", "gaseosas");
    assert.equal(escena.progresoCamion, 1);

    // Otro acierto
    escena.clasificarProducto("p2", "aguas");
    assert.equal(escena.progresoCamion, 2);
  });

  it("al cerrar emite fin con aciertos y total coherentes", () => {
    const emisor = new EmisorEventosMotor();
    const eventos: EventoMotor[] = [];
    emisor.suscribir((e) => eventos.push(e));

    const escena = new MecanicaTienda({
      spec: fixtureTienda,
      versionId: "v1",
      emisor,
      duracionTutorialMs: 0
    });

    escena.finalizarTutorial();
    escena.clasificarProducto("p1", "gaseosas"); // 1 acierto

    escena.cerrarConFin();

    const fins = eventos.filter((e) => e.tipo === "fin");
    assert.equal(fins.length, 1);

    const fin = fins[0];
    assert.ok(fin && fin.tipo === "fin");
    if (fin && fin.tipo === "fin") {
      assert.equal(fin.total, 12);
      assert.ok(fin.aciertos >= 0 && fin.aciertos <= fin.total);
      assert.equal(fin.aciertos, 1);
      assert.equal(fin.completado, false);
      assert.ok(typeof fin.duracionMs === "number");
    }
  });

  it("avanzar por todos los ítems y completar llama automáticamente a cerrarConFin", () => {
    const emisor = new EmisorEventosMotor();
    const eventos: EventoMotor[] = [];
    emisor.suscribir((e) => eventos.push(e));

    const escena = new MecanicaTienda({
      spec: fixtureTienda,
      versionId: "v1",
      emisor,
      duracionTutorialMs: 0
    });

    escena.finalizarTutorial();

    // Saltar al último ítem (índice 11: a4, pedido de 7 jugos)
    escena.cargarItem(11);
    assert.equal(escena.itemActual?.id, "a4");

    // Simulamos completar el último ítem
    escena.avanzarSiguienteItem();

    const fins = eventos.filter((e) => e.tipo === "fin");
    assert.equal(fins.length, 1);
    assert.equal(fins[0]?.tipo, "fin");
  });
});
