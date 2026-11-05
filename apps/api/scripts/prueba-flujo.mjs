const API = "http://localhost:8787";
const DOC = { Authorization: "Bearer demo-docente" };

async function pedir(ruta, opciones = {}) {
  const r = await fetch(`${API}${ruta}`, {
    headers: { "Content-Type": "application/json", ...(opciones.headers ?? {}) },
    method: opciones.method ?? "GET",
    body: opciones.body ? JSON.stringify(opciones.body) : undefined,
  });
  const texto = await r.text();
  let datos;
  try {
    datos = JSON.parse(texto);
  } catch {
    datos = texto;
  }
  if (!r.ok) throw new Error(`${ruta} → ${r.status}: ${texto}`);
  return datos;
}

function afirmar(condicion, mensaje) {
  if (!condicion) throw new Error(`FALLO: ${mensaje}`);
  console.log(`OK · ${mensaje}`);
}

const juegos = await pedir("/api/juegos", { headers: DOC });
afirmar(juegos.juegos.length === 2, "el docente ve los dos juegos");

const tienda = await pedir("/api/j/TIENDA");
const carrera = await pedir("/api/j/CARRERA");
afirmar(tienda.spec.mecanica === "tienda", "el juego TIENDA está publicado");
afirmar(carrera.spec.mecanica === "carrera", "el juego CARRERA está publicado");

// Intento de complemento: 7 de 9 correctos.
const entrada = await pedir("/api/j/CARRERA/entrar", {
  method: "POST",
  body: { nombre: "Ana" },
});
const itemsCarrera = carrera.spec.niveles.flatMap((n) => n.items);
const intento = await pedir("/api/intentos", {
  method: "POST",
  headers: { Authorization: `Bearer ${entrada.token}`, "Idempotency-Key": "prueba-carrera-1" },
  body: {
    juegoId: entrada.juegoId,
    versionId: entrada.versionId,
    fuente: "digital",
    iniciadoEn: new Date().toISOString(),
    duracionMs: 300000,
    items: itemsCarrera.map((item, i) => ({
      itemId: item.id,
      criterio: item.criterio,
      correcto: i < 7,
      tiempoMs: 5000 + i * 100,
      intentos: 1,
    })),
  },
});
afirmar(intento.aciertos === 7 && intento.total === 9, "el intento guarda 7 de 9 aciertos");
afirmar(intento.logrado === true, "el intento alcanza el mínimo de logro");

const repetido = await pedir("/api/intentos", {
  method: "POST",
  headers: { Authorization: `Bearer ${entrada.token}`, "Idempotency-Key": "prueba-carrera-1" },
  body: {
    juegoId: entrada.juegoId,
    versionId: entrada.versionId,
    fuente: "digital",
    iniciadoEn: new Date().toISOString(),
    duracionMs: 1,
    items: [{ itemId: itemsCarrera[0].id, criterio: itemsCarrera[0].criterio, correcto: true, tiempoMs: 1, intentos: 1 }],
  },
});
afirmar(repetido.duplicado === true && repetido.intentoId === intento.intentoId, "la clave de idempotencia evita duplicados");

const panelAntes = await pedir("/api/panel/juego-n1-tienda", { headers: DOC });
const intentosAntes = panelAntes.participacion.intentos;
const c1Antes = panelAntes.porCriterio.find((c) => c.criterio === "C1")?.aciertos ?? 0;

const sala = await pedir("/api/salas", {
  method: "POST",
  headers: DOC,
  body: { juegoId: "juego-n1-tienda", maxAlumnos: 10 },
});
afirmar(/^[A-Z2-9]{6}$/.test(sala.codigo), "la sala tiene un código legible de 6 caracteres");

const uno = await pedir(`/api/salas/${sala.codigo}/unirse`, { method: "POST", body: { nombre: "Equipo 1" } });
const dos = await pedir(`/api/salas/${sala.codigo}/unirse`, { method: "POST", body: { nombre: "Equipo 2" } });
afirmar(uno.alumnoId !== dos.alumnoId, "dos alumnos entran a la misma sala");

const avance = await pedir(`/api/salas/${sala.codigo}/avanzar`, {
  method: "POST",
  headers: DOC,
  body: { ronda: 1 },
});
const itemActual = avance.ronda.itemId;

for (const alumno of [uno, dos]) {
  const respuesta = await pedir(`/api/salas/${sala.codigo}/respuesta`, {
    method: "POST",
    headers: { Authorization: `Bearer ${alumno.token}` },
    body: { itemId: itemActual, criterio: "C1", correcto: true, tiempoMs: 2500 },
  });
  afirmar(respuesta.aceptada === true, `respuesta aceptada para ${alumno.alumnoId.slice(0, 6)}`);
}

const estado = await pedir(`/api/salas/${sala.codigo}/estado?desde=0`, {
  headers: DOC,
});
afirmar(estado.progreso.actual === 2, "la meta colectiva suma los dos aciertos");
afirmar(estado.eventos.some((e) => e.tipo === "union"), "el estado reporta la unión de alumnos");

const cierre = await pedir(`/api/salas/${sala.codigo}/cerrar`, {
  method: "POST",
  headers: DOC,
});
afirmar(cierre.estado === "terminada", "la sala se cierra");

const panelTienda = await pedir("/api/panel/juego-n1-tienda", { headers: DOC });
afirmar(panelTienda.participacion.intentos - intentosAntes === 2, "el panel cuenta los intentos de la sala");
const c1Ahora = panelTienda.porCriterio.find((c) => c.criterio === "C1")?.aciertos ?? 0;
afirmar(c1Ahora - c1Antes === 2, "el panel agrega aciertos por criterio");

const panelCarrera = await pedir("/api/panel/juego-n2-carrera", { headers: DOC });
afirmar(panelCarrera.participacion.intentos === 1, "el panel del complemento ve el intento digital");

const csvRespuesta = await fetch(`${API}/api/panel/juego-n2-carrera.csv`, { headers: DOC });
const csv = await csvRespuesta.text();
afirmar(csvRespuesta.headers.get("content-type")?.includes("text/csv"), "el CSV se sirve como text/csv");
afirmar(csv.startsWith("alumno_id,nombre,intento_id"), "el CSV tiene la cabecera del contrato");
afirmar(csv.includes("Ana"), "el CSV incluye el nombre del alumno");

const errores = await fetch(`${API}/api/j/NOEXISTE`);
afirmar(errores.status === 404, "un código inexistente responde 404");

const sinToken = await fetch(`${API}/api/juegos`);
afirmar(sinToken.status === 401, "las rutas de docente exigen token");

console.log("\nTodo el flujo de la API pasó.");
