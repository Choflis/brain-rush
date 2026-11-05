import test, { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  EmisorEventosMotor,
  crearEmisorEventos,
  type EventoFin,
  type EventoInicio,
  type EventoMotor,
  type EventoRespuesta
} from "./eventos.ts";

describe("EmisorEventosMotor y EventoMotor (Contrato Sección 7)", () => {
  it("el emisor entrega los eventos a los suscriptores", () => {
    const emisor = new EmisorEventosMotor();
    const eventosRecibidos1: EventoMotor[] = [];
    const eventosRecibidos2: EventoMotor[] = [];

    emisor.suscribir((e) => eventosRecibidos1.push(e));
    emisor.suscribir((e) => eventosRecibidos2.push(e));

    const eventoPrueba: EventoInicio = {
      tipo: "inicio",
      juegoId: "juego-n1-tienda",
      versionId: "v1",
      mecanica: "tienda",
      iniciadoEn: "2026-11-04T18:30:00.000Z"
    };

    emisor.emitir(eventoPrueba);

    assert.equal(eventosRecibidos1.length, 1);
    assert.equal(eventosRecibidos2.length, 1);
    assert.deepEqual(eventosRecibidos1[0], eventoPrueba);
    assert.deepEqual(eventosRecibidos2[0], eventoPrueba);
  });

  it("un inicio, un respuesta y un fin conservan la forma del contrato", () => {
    const emisor = crearEmisorEventos();
    const eventos: EventoMotor[] = [];
    emisor.suscribir((e) => eventos.push(e));

    // 1. Evento inicio (con alumnoId y salaId opcionales)
    const inicio: EventoInicio = {
      tipo: "inicio",
      juegoId: "juego-n2-carrera",
      versionId: "v1",
      mecanica: "carrera",
      alumnoId: "alu_7f3c",
      salaId: "sala_3f9a",
      iniciadoEn: new Date().toISOString()
    };
    emisor.emitir(inicio);

    // 2. Evento respuesta
    const respuesta: EventoRespuesta = {
      tipo: "respuesta",
      itemId: "f1",
      criterio: "C3",
      correcto: true,
      tiempoMs: 8200,
      intentos: 1
    };
    emisor.emitir(respuesta);

    // 3. Evento fin
    const fin: EventoFin = {
      tipo: "fin",
      aciertos: 7,
      total: 9,
      duracionMs: 420000,
      completado: true
    };
    emisor.emitir(fin);

    assert.equal(eventos.length, 3);

    // Validar forma de inicio
    const ev0 = eventos[0];
    assert.equal(ev0?.tipo, "inicio");
    if (ev0?.tipo === "inicio") {
      assert.equal(typeof ev0.juegoId, "string");
      assert.equal(typeof ev0.versionId, "string");
      assert.ok(ev0.mecanica === "tienda" || ev0.mecanica === "carrera");
      assert.equal(typeof ev0.alumnoId, "string");
      assert.equal(typeof ev0.salaId, "string");
      assert.equal(typeof ev0.iniciadoEn, "string");
      // Debe ser ISO válido
      assert.ok(!isNaN(Date.parse(ev0.iniciadoEn)));
    }

    // Validar forma de respuesta
    const ev1 = eventos[1];
    assert.equal(ev1?.tipo, "respuesta");
    if (ev1?.tipo === "respuesta") {
      assert.equal(typeof ev1.itemId, "string");
      assert.equal(typeof ev1.criterio, "string");
      assert.equal(typeof ev1.correcto, "boolean");
      assert.equal(typeof ev1.tiempoMs, "number");
      assert.equal(typeof ev1.intentos, "number");
      assert.ok(ev1.intentos >= 1);
      assert.ok(ev1.tiempoMs >= 0);
    }

    // Validar forma de fin
    const ev2 = eventos[2];
    assert.equal(ev2?.tipo, "fin");
    if (ev2?.tipo === "fin") {
      assert.equal(typeof ev2.aciertos, "number");
      assert.equal(typeof ev2.total, "number");
      assert.equal(typeof ev2.duracionMs, "number");
      assert.equal(typeof ev2.completado, "boolean");
      assert.ok(ev2.aciertos <= ev2.total);
      assert.ok(ev2.duracionMs >= 0);
    }
  });

  it("desuscribirse deja de recibir eventos", () => {
    const emisor = new EmisorEventosMotor();
    const recibidosA: string[] = [];
    const recibidosB: string[] = [];

    const desuscribirA = emisor.suscribir((e) => recibidosA.push(e.tipo));
    const manejadorB = (e: EventoMotor) => recibidosB.push(e.tipo);
    emisor.suscribir(manejadorB);

    assert.equal(emisor.cantidadSuscriptores, 2);

    emisor.emitir({
      tipo: "inicio",
      juegoId: "j1",
      versionId: "v1",
      mecanica: "tienda",
      iniciadoEn: "2026-11-04T18:00:00.000Z"
    });

    assert.deepEqual(recibidosA, ["inicio"]);
    assert.deepEqual(recibidosB, ["inicio"]);

    // Desuscribir A mediante la función de retorno
    desuscribirA();
    assert.equal(emisor.cantidadSuscriptores, 1);

    emisor.emitir({
      tipo: "respuesta",
      itemId: "item1",
      criterio: "C1",
      correcto: true,
      tiempoMs: 1500,
      intentos: 1
    });

    // A ya no recibe el nuevo evento, B sí
    assert.deepEqual(recibidosA, ["inicio"]);
    assert.deepEqual(recibidosB, ["inicio", "respuesta"]);

    // Desuscribir B mediante método explícito
    emisor.desuscribir(manejadorB);
    assert.equal(emisor.cantidadSuscriptores, 0);

    emisor.emitir({
      tipo: "fin",
      aciertos: 1,
      total: 1,
      duracionMs: 1500,
      completado: true
    });

    assert.deepEqual(recibidosA, ["inicio"]);
    assert.deepEqual(recibidosB, ["inicio", "respuesta"]);
  });
});
