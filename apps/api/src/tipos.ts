export type Env = {
  DB: D1Database;
  FILES: R2Bucket;
  ENVIRONMENT: string;
  MISTRAL_API_KEY?: string;
};

export type Rol = "admin" | "docente" | "alumno";

export type Usuario = {
  id: string;
  rol: Rol;
  nombre: string;
};

export type AppEnv = {
  Bindings: Env;
  Variables: { usuario: Usuario };
};

export type CodigoError =
  | "NO_AUTORIZADO"
  | "SIN_PERMISO"
  | "NO_ENCONTRADO"
  | "VALIDACION"
  | "CONFLICTO"
  | "LIMITE"
  | "INTERNO";
