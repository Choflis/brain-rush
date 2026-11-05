import { Hono } from "hono";
import { cors } from "hono/cors";
import { ErrorHttp } from "./errores.ts";
import { rutasBasicas } from "./rutas/basicas.ts";
import { rutasDev } from "./rutas/dev.ts";
import { rutasIntentos } from "./rutas/intentos.ts";
import { rutasJuegos } from "./rutas/juegos.ts";
import { rutasPanel } from "./rutas/panel.ts";
import { rutasSalas } from "./rutas/salas.ts";
import type { AppEnv } from "./tipos.ts";

const ORIGENES = /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}):(5173|4173)$/;

export const app = new Hono<AppEnv>();

app.use(
  "*",
  cors({
    origin: (origen) => (ORIGENES.test(origen) ? origen : undefined),
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "Idempotency-Key"],
    maxAge: 86400,
  }),
);

rutasBasicas(app);
rutasJuegos(app);
rutasIntentos(app);
rutasSalas(app);
rutasPanel(app);
rutasDev(app);

app.notFound((c) =>
  c.json({ error: { codigo: "NO_ENCONTRADO", mensaje: "La ruta no existe." } }, 404),
);

app.onError((error, c) => {
  if (error instanceof ErrorHttp) {
    const cuerpo = {
      error: {
        codigo: error.codigo,
        mensaje: error.message,
        ...(error.detalles !== undefined ? { detalles: error.detalles } : {}),
      },
    };
    return new Response(JSON.stringify(cuerpo), {
      status: error.estado,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }

  console.error("Error no controlado:", error);
  return c.json(
    { error: { codigo: "INTERNO", mensaje: "Ocurrió un error interno." } },
    500,
  );
});

export default app;
