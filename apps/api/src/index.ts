import { Hono } from "hono";
import { cors } from "hono/cors";
import { ErrorHttp } from "./errores.ts";
import { rutasBasicas } from "./rutas/basicas.ts";
import { rutasChat } from "./rutas/chat.ts";
import { rutasDev } from "./rutas/dev.ts";
import { rutasIA } from "./rutas/ia.ts";
import { rutasIntentos } from "./rutas/intentos.ts";
import { rutasJuegos } from "./rutas/juegos.ts";
import { rutasPanel } from "./rutas/panel.ts";
import { rutasSalas } from "./rutas/salas.ts";
import type { AppEnv } from "./tipos.ts";

const ORIGENES_LOCALES = /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}):(5173|4173)$/;
const ORIGENES_CLOUDFLARE = /^https:\/\/([a-zA-Z0-9-]+\.)*(workers\.dev|pages\.dev)$/;

export const app = new Hono<AppEnv>();

app.use(
  "*",
  async (c, next) => {
    const middlewareCors = cors({
      origin: (origen) => {
        if (!origen) return undefined;
        if (ORIGENES_LOCALES.test(origen)) return origen;
        if (ORIGENES_CLOUDFLARE.test(origen)) return origen;
        if (c.env.ALLOWED_ORIGIN && (c.env.ALLOWED_ORIGIN === "*" || c.env.ALLOWED_ORIGIN === origen)) {
          return origen;
        }
        return undefined;
      },
      allowMethods: ["GET", "POST", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization", "Idempotency-Key"],
      maxAge: 86400,
    });
    return middlewareCors(c, next);
  },
);

rutasBasicas(app);
rutasJuegos(app);
rutasIA(app);
rutasChat(app);
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
