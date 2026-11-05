import test, { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { GameSpec } from "@brain-rush/gamespec";
import { MecanicaCarrera, EscenaCarrera, redondearValor } from "./carrera.ts";
import { EmisorEventosMotor, type EventoMotor } from "./eventos.ts";

describe("MecanicaCarrera (N2, complemento)", () => {
  const rutaFixtureN2 = resolve(
    process.cwd(),
    "../../fixtures/juegos/n2-carrera-unidades-longitud.json"
  );
  const rutaFixtureN1 = resolve(
    process.cwd(),
    "../../fixtures/juegos/n1-tienda.json"
  );

  const fixtureCarrera: GameSpec = JSON.parse(readFileSync(rutaFixtureN2, "utf8"));
  const fixtureTienda: GameSpec = JSON.parse(readFileSync(rutaFixtureN1, "utf8"));

  it("carga el fixture N2 sin lanzar excepciones en el constructor", () => {
    assert.doesNotThrow(() => {
      const escena = new MecanicaCarrera(fixtureCarrera, "v1");
      assert.ok(escena);
      assert.equal(escena.spec.mecanica, "carrera");
      assert.equal(escena.versionId, "v1");
      assert.equal(escena.totalItems, 9);
      assert.equal(escena.items.length, 9);
      assert.ok(escena.itemActual);
      assert.equal(escena.itemActual.id, "f1");
      assert.equal(escena.valorActual, 2);
      assert.equal(escena.unidadActual, "m");
      assert.equal(escena.unidadActualIndex, 3);
    });
  });

  it("acepta configuración completa con alumnoId y salaId", () => {
    const escena = new MecanicaCarrera({
      spec: fixtureCarrera,
      versionId: "v2",
      juegoId: "juego-carrera-test",
      alumnoId: "alu_carrera",
      salaId: "sala_carrera"
    });

    assert.equal(escena.versionId, "v2");
    assert.equal(escena.juegoId, "juego-carrera-test");
    assert.equal(escena.alumnoId, "alu_carrera");
    assert.equal(escena.salaId, "sala_carrera");
    assert.equal(escena.totalItems, 9);
  });

  it("EscenaCarrera es un alias de MecanicaCarrera", () => {
    assert.equal(EscenaCarrera, MecanicaCarrera);
    const escena = new EscenaCarrera(fixtureCarrera, "v1");
    assert.ok(escena instanceof MecanicaCarrera);
  });

  it("rechaza especificaciones que no sean de tipo carrera", () => {
    assert.throws(
      () => {
        new MecanicaCarrera(fixtureTienda, "v1");
      },
      {
        message: /mecanica "carrera"/
      }
    );
  });

  it("emite inicio al finalizar el tutorial (duracionTutorialMs: 0)", () => {
    const emisor = new EmisorEventosMotor();
    const eventos: EventoMotor[] = [];
    emisor.suscribir((e) => eventos.push(e));

    const escena = new MecanicaCarrera({
      spec: fixtureCarrera,
      versionId: "v1",
      duracionTutorialMs: 0,
      alumnoId: "alu_prueba",
      salaId: "sala_prueba",
      emisor
    });

    assert.equal(eventos.length, 0);
    assert.equal(escena.tutorialFinalizado, false);

    escena.iniciarTutorial();

    assert.equal(escena.tutorialFinalizado, true);
    assert.equal(eventos.length, 1);

    const inicio = eventos[0];
    assert.equal(inicio?.tipo, "inicio");
    if (inicio?.tipo === "inicio") {
      assert.equal(inicio.mecanica, "carrera");
      assert.equal(inicio.versionId, "v1");
      assert.equal(inicio.alumnoId, "alu_prueba");
      assert.equal(inicio.salaId, "sala_prueba");
      assert.ok(inicio.iniciadoEn);
    }
  });

  it("un acierto emite respuesta con correcto: true y el criterio", () => {
    const emisor = new EmisorEventosMotor();
    const eventos: EventoMotor[] = [];
    emisor.suscribir((e) => eventos.push(e));

    const escena = new MecanicaCarrera({
      spec: fixtureCarrera,
      versionId: "v1",
      emisor
    });

    // Ítem inicial: f1 -> cantidad: 2, desde: m, hasta: dm, opciones: [0.2, 20, 2], correcta: 1 (valor 20)
    assert.equal(escena.itemActual?.id, "f1");
    assert.equal(escena.itemActual?.criterio, "C3");

    // Construir el resultado: 2 m * 10 = 20 dm
    const nuevoValor = escena.multiplicarPor10();
    assert.equal(nuevoValor, 20);
    assert.equal(escena.unidadActual, "dm");

    // Arrastrar a la puerta del guardián
    const acierto = escena.arrastrarAPuerta();
    assert.equal(acierto, true);

    assert.equal(eventos.length, 1);
    const respuesta = eventos[0];
    assert.equal(respuesta?.tipo, "respuesta");
    if (respuesta?.tipo === "respuesta") {
      assert.equal(respuesta.itemId, "f1");
      assert.equal(respuesta.criterio, "C3");
      assert.equal(respuesta.correcto, true);
      assert.equal(respuesta.intentos, 1);
      assert.ok(typeof respuesta.tiempoMs === "number");
    }
    assert.equal(escena.aciertos, 1);
  });

  it("un error emite respuesta con correcto: false", () => {
    const emisor = new EmisorEventosMotor();
    const eventos: EventoMotor[] = [];
    emisor.suscribir((e) => eventos.push(e));

    const escena = new MecanicaCarrera({
      spec: fixtureCarrera,
      versionId: "v1",
      emisor
    });

    assert.equal(escena.itemActual?.id, "f1");

    // Enviar una respuesta incorrecta (ej. 999)
    const acierto = escena.arrastrarAPuerta(999);
    assert.equal(acierto, false);

    assert.equal(eventos.length, 1);
    const respuesta = eventos[0];
    assert.equal(respuesta?.tipo, "respuesta");
    if (respuesta?.tipo === "respuesta") {
      assert.equal(respuesta.itemId, "f1");
      assert.equal(respuesta.criterio, "C3");
      assert.equal(respuesta.correcto, false);
      assert.equal(respuesta.intentos, 1);
      assert.ok(typeof respuesta.tiempoMs === "number");
    }
    assert.equal(escena.aciertos, 0);
  });

  it("al cerrar emite fin coherente", () => {
    const emisor = new EmisorEventosMotor();
    const eventos: EventoMotor[] = [];
    emisor.suscribir((e) => eventos.push(e));

    const escena = new MecanicaCarrera({
      spec: fixtureCarrera,
      versionId: "v1",
      emisor
    });

    escena.cerrarConFin();

    assert.equal(eventos.length, 1);
    const fin = eventos[0];
    assert.equal(fin?.tipo, "fin");
    if (fin?.tipo === "fin") {
      assert.equal(fin.total, 9);
      assert.equal(fin.aciertos, 0);
      assert.ok(typeof fin.duracionMs === "number");
      assert.ok(typeof fin.completado === "boolean");
    }
  });

  it("desplaza Reglita sobre la escalera métrica con ×10 y ÷10 respetando límites", () => {
    const escena = new MecanicaCarrera(fixtureCarrera, "v1");

    // f1 arranca en 2 m (unidadActualIndex = 3)
    assert.equal(escena.valorActual, 2);
    assert.equal(escena.unidadActual, "m");
    assert.equal(escena.unidadActualIndex, 3);

    // Multiplicar por 10: pasa a dm (índice 4)
    escena.multiplicarPor10();
    assert.equal(escena.valorActual, 20);
    assert.equal(escena.unidadActual, "dm");
    assert.equal(escena.unidadActualIndex, 4);

    // Multiplicar por 10: pasa a cm (índice 5)
    escena.multiplicarPor10();
    assert.equal(escena.valorActual, 200);
    assert.equal(escena.unidadActual, "cm");
    assert.equal(escena.unidadActualIndex, 5);

    // Multiplicar por 10: pasa a mm (índice 6)
    escena.multiplicarPor10();
    assert.equal(escena.valorActual, 2000);
    assert.equal(escena.unidadActual, "mm");
    assert.equal(escena.unidadActualIndex, 6);

    // Límite derecho: no pasa más allá de mm
    escena.multiplicarPor10();
    assert.equal(escena.unidadActual, "mm");
    assert.equal(escena.unidadActualIndex, 6);

    // Dividir entre 10: retrocede peldaños
    escena.dividirEntre10(); // cm
    escena.dividirEntre10(); // dm
    escena.dividirEntre10(); // m
    assert.equal(escena.unidadActual, "m");
    assert.equal(escena.unidadActualIndex, 3);

    escena.dividirEntre10(); // dam (índice 2)
    escena.dividirEntre10(); // hm (índice 1)
    escena.dividirEntre10(); // km (índice 0)
    assert.equal(escena.unidadActual, "km");
    assert.equal(escena.unidadActualIndex, 0);

    // Límite izquierdo: no pasa más allá de km
    escena.dividirEntre10();
    assert.equal(escena.unidadActual, "km");
    assert.equal(escena.unidadActualIndex, 0);

    // Reiniciar al estado original del ítem
    escena.reiniciarItem();
    assert.equal(escena.valorActual, 2);
    assert.equal(escena.unidadActual, "m");
    assert.equal(escena.unidadActualIndex, 3);
  });

  it("permite seleccionar una opción directamente y evaluar el índice o valor", () => {
    const escena = new MecanicaCarrera(fixtureCarrera, "v1");

    // f1 opciones: [0.2, 20, 2], correcta = 1
    escena.seleccionarOpcion(1); // Selecciona por índice (valor 20)
    assert.equal(escena.valorActual, 20);
    assert.equal(escena.unidadActual, "dm");

    const resultado = escena.arrastrarAPuerta(20);
    assert.equal(resultado, true);
  });

  it("jugar todos los ítems emite fin automático con completado: true", () => {
    const emisor = new EmisorEventosMotor();
    const eventos: EventoMotor[] = [];
    emisor.suscribir((e) => eventos.push(e));

    const escena = new MecanicaCarrera({
      spec: fixtureCarrera,
      versionId: "v1",
      emisor
    });

    assert.equal(escena.totalItems, 9);

    // Resolver los 9 ítems con sus valores correctos
    for (let i = 0; i < 9; i++) {
      const item = escena.itemActual;
      assert.ok(item);
      const valorCorrecto = item.opciones[item.correcta];
      const acierto = escena.arrastrarAPuerta(valorCorrecto);
      assert.equal(acierto, true);
    }

    // 9 respuestas + 1 fin
    assert.equal(eventos.length, 10);
    assert.equal(escena.aciertos, 9);

    const eventoFin = eventos[9];
    assert.equal(eventoFin?.tipo, "fin");
    if (eventoFin?.tipo === "fin") {
      assert.equal(eventoFin.total, 9);
      assert.equal(eventoFin.aciertos, 9);
      assert.equal(eventoFin.completado, true);
    }
  });

  it("redondearValor previene imprecisiones decimales de punto flotante", () => {
    assert.equal(redondearValor(250 / 100), 2.5);
    assert.equal(redondearValor(1500 / 1000), 1.5);
    assert.equal(redondearValor(0.25 * 10), 2.5);
    assert.equal(redondearValor(2500 / 1000), 2.5);
  });

  it("crear e inicializar la escena en modo headless no lanza excepciones", () => {
    const escena = new MecanicaCarrera(fixtureCarrera, "v1");
    assert.doesNotThrow(() => {
      escena.create();
      escena.reiniciarItem();
      escena.feedback.mostrarAcierto("estrella");
      escena.feedback.mostrarAcierto("aplauso");
      escena.feedback.mostrarError("Pista de prueba");
    });
  });
});
