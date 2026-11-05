import { validarGameSpec, type GameSpec, type OpcionesValidacion } from "@brain-rush/gamespec";
import type { LLMProvider, UsoTokens } from "./provider.ts";

export type PedidoGeneracion = {
  promptRenderizado: string;
  opciones?: OpcionesValidacion;
  // Reproduce el prompt con el error para que el modelo corrija.
  reconstruir: (errores: string[]) => string;
};

export type ResultadoGeneracion =
  | { ok: true; spec: GameSpec; uso: UsoTokens[] }
  | { ok: false; errores: string[]; uso: UsoTokens[] };

export async function generarJuego(provider: LLMProvider, pedido: PedidoGeneracion): Promise<ResultadoGeneracion> {
  const usos: UsoTokens[] = [];
  let prompt = pedido.promptRenderizado;
  let errores: string[] = [];
  for (let intento = 0; intento < 2; intento++) {
    const r = await provider.generarJSON(prompt);
    usos.push(r.uso);
    const v = validarGameSpec(r.contenido, pedido.opciones);
    if (v.ok) return { ok: true, spec: v.spec, uso: usos };
    errores = v.errores;
    prompt = pedido.reconstruir(errores);
  }
  return { ok: false, errores, uso: usos };
}
