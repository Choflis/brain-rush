// Carga las sesiones y los juegos de fixtures/ en la API local.
// Uso: npm run dev:api (en otra terminal) y luego npm run semilla -w apps/api

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const API = process.env.API_URL ?? "http://localhost:8787";

const sesiones = [
  { id: "ses-n1-productos", archivo: "fixtures/sesiones/n1-tienda.json" },
  { id: "ses-n2-longitud", archivo: "fixtures/sesiones/n2-unidades-longitud.json" },
].map(({ id, archivo }) => ({
  id,
  ...JSON.parse(readFileSync(join(RAIZ, archivo), "utf8")),
}));

const juegos = [
  {
    id: "juego-n1-tienda",
    codigo: "TIENDA",
    sessionId: "ses-n1-productos",
    archivo: "fixtures/juegos/n1-tienda.json",
    origenGeneracion: {
      generadoPor: "subagente",
      promptVersion: "generacion/v2",
      intentos: 4,
    },
  },
  {
    id: "juego-n2-carrera",
    codigo: "CARRERA",
    sessionId: "ses-n2-longitud",
    archivo: "fixtures/juegos/n2-carrera-unidades-longitud.json",
    origenGeneracion: {
      generadoPor: "subagente",
      promptVersion: "generacion/v2",
      intentos: 1,
    },
  },
].map(({ archivo, ...juego }) => ({
  ...juego,
  spec: JSON.parse(readFileSync(join(RAIZ, archivo), "utf8")),
}));

const respuesta = await fetch(`${API}/api/dev/semilla`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer demo-docente",
  },
  body: JSON.stringify({ sesiones, juegos }),
});

const texto = await respuesta.text();
if (!respuesta.ok) {
  console.error(`Error ${respuesta.status}: ${texto}`);
  process.exit(1);
}

console.log(`Semilla cargada en ${API}`);
console.log(texto);
