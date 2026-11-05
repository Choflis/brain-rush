export type UsoTokens = { entrada: number; salida: number };

export type RespuestaJSON = { contenido: unknown; uso: UsoTokens; modelo: string };

export interface LLMProvider {
  generarJSON(prompt: string): Promise<RespuestaJSON>;
}
