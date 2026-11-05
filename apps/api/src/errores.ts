import type { Context } from "hono";
import type { ZodType } from "zod";
import type { AppEnv, CodigoError } from "./tipos.ts";

export class ErrorHttp extends Error {
  constructor(
    readonly estado: number,
    readonly codigo: CodigoError,
    mensaje: string,
    readonly detalles?: unknown,
  ) {
    super(mensaje);
    this.name = "ErrorHttp";
  }
}

export function noEncontrado(mensaje: string, detalles?: unknown): never {
  throw new ErrorHttp(404, "NO_ENCONTRADO", mensaje, detalles);
}

export function conflicto(mensaje: string, detalles?: unknown): never {
  throw new ErrorHttp(409, "CONFLICTO", mensaje, detalles);
}

export function validacion(mensaje: string, detalles?: unknown): never {
  throw new ErrorHttp(400, "VALIDACION", mensaje, detalles);
}

export async function leerCuerpo<T>(c: Context<AppEnv>, esquema: ZodType<T>): Promise<T> {
  let datos: unknown;
  try {
    datos = await c.req.json();
  } catch {
    validacion("El cuerpo debe ser JSON válido.");
  }
  const resultado = esquema.safeParse(datos);
  if (!resultado.success) {
    validacion(
      "El cuerpo no cumple el contrato.",
      resultado.error.issues.map((i) => `${i.path.join(".") || "(raíz)"}: ${i.message}`),
    );
  }
  return resultado.data;
}
