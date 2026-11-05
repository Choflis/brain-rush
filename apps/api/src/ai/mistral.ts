import type { LLMProvider, RespuestaJSON } from "./provider.ts";

type Opciones = {
  apiKey: string;
  modelo: string;
  fetchFn?: typeof fetch;
  tiempoMs?: number;
  reintentos?: number;
};

const URL_CHAT = "https://api.mistral.ai/v1/chat/completions";

export class MistralProvider implements LLMProvider {
  constructor(private readonly opts: Opciones) {}

  async generarJSON(prompt: string): Promise<RespuestaJSON> {
    const reintentos = this.opts.reintentos ?? 2;
    let ultimo: unknown;
    for (let intento = 0; intento <= reintentos; intento++) {
      try {
        return await this.llamar(prompt);
      } catch (e) {
        ultimo = e;
        await new Promise((r) => setTimeout(r, 1000 * 2 ** intento));
      }
    }
    throw new Error(`Mistral no respondió tras ${reintentos + 1} intentos: ${String(ultimo)}`);
  }

  private async llamar(prompt: string): Promise<RespuestaJSON> {
    const fetchFn = this.opts.fetchFn ?? fetch;
    const res = await fetchFn(URL_CHAT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.opts.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.opts.modelo,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(this.opts.tiempoMs ?? 30_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as {
      model: string;
      choices: { message: { content: string } }[];
      usage: { prompt_tokens: number; completion_tokens: number };
    };
    return {
      contenido: JSON.parse(data.choices[0]!.message.content),
      uso: { entrada: data.usage.prompt_tokens, salida: data.usage.completion_tokens },
      modelo: data.model,
    };
  }
}
