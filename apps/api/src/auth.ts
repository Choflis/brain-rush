import { createMiddleware } from "hono/factory";
import { ErrorHttp } from "./errores.ts";
import type { AppEnv, Usuario } from "./tipos.ts";

export const TOKEN_DOCENTE = "demo-docente";
const PREFIJO_ALUMNO = "demo-alumno-";

export function tokenDe(cabecera: string | undefined): string | null {
  if (!cabecera?.startsWith("Bearer ")) return null;
  const token = cabecera.slice("Bearer ".length).trim();
  return token.length > 0 ? token : null;
}

function usuarioDocente(): Usuario {
  return { id: "u-demo-docente", rol: "docente", nombre: "Docente demo" };
}

function alumnoDesdeToken(token: string): Usuario | null {
  if (!token.startsWith(PREFIJO_ALUMNO)) return null;
  const id = token.slice(PREFIJO_ALUMNO.length);
  if (!/^[a-zA-Z0-9-]{4,64}$/.test(id)) return null;
  return { id, rol: "alumno", nombre: "Alumno" };
}

export const soloDocente = createMiddleware<AppEnv>(async (c, next) => {
  const token = tokenDe(c.req.header("Authorization"));
  if (token !== TOKEN_DOCENTE) {
    throw new ErrorHttp(401, "NO_AUTORIZADO", "Falta el token de docente o no es válido.");
  }
  c.set("usuario", usuarioDocente());
  await next();
});

export const soloAlumno = createMiddleware<AppEnv>(async (c, next) => {
  const token = tokenDe(c.req.header("Authorization"));
  const alumno = token ? alumnoDesdeToken(token) : null;
  if (!alumno) {
    throw new ErrorHttp(401, "NO_AUTORIZADO", "Falta el token de alumno o no es válido.");
  }
  c.set("usuario", alumno);
  await next();
});

export const docenteOAlumno = createMiddleware<AppEnv>(async (c, next) => {
  const token = tokenDe(c.req.header("Authorization"));
  if (token === TOKEN_DOCENTE) {
    c.set("usuario", usuarioDocente());
  } else {
    const alumno = token ? alumnoDesdeToken(token) : null;
    if (!alumno) {
      throw new ErrorHttp(401, "NO_AUTORIZADO", "Falta el token o no es válido.");
    }
    c.set("usuario", alumno);
  }
  await next();
});

export function alumnoActual(c: { get: (clave: "usuario") => Usuario }): string {
  const usuario = c.get("usuario");
  if (usuario.rol !== "alumno") {
    throw new ErrorHttp(403, "SIN_PERMISO", "Esta ruta es solo para alumnos.");
  }
  return usuario.id;
}
