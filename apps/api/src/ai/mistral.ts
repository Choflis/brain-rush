import type { LLMProvider, RespuestaJSON } from "./provider.ts";

export type OpcionesMistral = {
  apiKey: string;
  modelo?: string;
  fetchFn?: typeof fetch;
  tiempoMs?: number;
  reintentos?: number;
};

export type MensajeChat = {
  role: "system" | "user" | "assistant";
  content: string;
};

const URL_CHAT = "https://api.mistral.ai/v1/chat/completions";
const URL_FILES = "https://api.mistral.ai/v1/files";
const URL_OCR = "https://api.mistral.ai/v1/ocr";
const MODELO_DEFECTO = "mistral-small-latest";

export class MistralProvider implements LLMProvider {
  private readonly opts: OpcionesMistral;

  constructor(opts: OpcionesMistral) {
    this.opts = opts;
  }

  async generarJSON(prompt: string): Promise<RespuestaJSON> {
    const reintentos = this.opts.reintentos ?? 1;
    let ultimo: unknown;
    for (let intento = 0; intento <= reintentos; intento++) {
      try {
        return await this.llamar(prompt);
      } catch (e) {
        ultimo = e;
        if (intento < reintentos) {
          await new Promise((r) => setTimeout(r, 600 * 2 ** intento));
        }
      }
    }
    throw new Error(`Mistral no respondió tras ${reintentos + 1} intentos: ${String(ultimo)}`);
  }

  private async llamar(prompt: string): Promise<RespuestaJSON> {
    const fetchFn = this.opts.fetchFn ?? fetch;
    const modelo = this.opts.modelo ?? MODELO_DEFECTO;
    const res = await fetchFn(URL_CHAT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.opts.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelo,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.2,
      }),
      signal: AbortSignal.timeout(this.opts.tiempoMs ?? 25_000),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      throw new Error(`Mistral HTTP ${res.status}: ${errorText || res.statusText}`);
    }

    const data = (await res.json()) as {
      model: string;
      choices: { message: { content: string } }[];
      usage: { prompt_tokens: number; completion_tokens: number };
    };

    const texto = data.choices[0]?.message?.content ?? "{}";
    const limpio = texto
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    return {
      contenido: JSON.parse(limpio),
      uso: {
        entrada: data.usage?.prompt_tokens ?? 0,
        salida: data.usage?.completion_tokens ?? 0,
      },
      modelo: data.model ?? modelo,
    };
  }

  /**
   * Conversación conversacional con Mistral (para el agente Reglita).
   */
  async chat(
    mensajes: MensajeChat[],
    opciones?: { temperatura?: number; maxTokens?: number },
  ): Promise<{ respuesta: string; modelo: string; uso: { entrada: number; salida: number } }> {
    const fetchFn = this.opts.fetchFn ?? fetch;
    const modelo = this.opts.modelo ?? MODELO_DEFECTO;
    const res = await fetchFn(URL_CHAT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.opts.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelo,
        messages: mensajes,
        temperature: opciones?.temperatura ?? 0.4,
        max_tokens: opciones?.maxTokens ?? 1024,
      }),
      signal: AbortSignal.timeout(this.opts.tiempoMs ?? 30_000),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      throw new Error(`Mistral HTTP ${res.status}: ${errorText || res.statusText}`);
    }

    const data = (await res.json()) as {
      model: string;
      choices: { message: { content: string } }[];
      usage: { prompt_tokens: number; completion_tokens: number };
    };

    return {
      respuesta: data.choices[0]?.message?.content ?? "",
      modelo: data.model ?? modelo,
      uso: {
        entrada: data.usage?.prompt_tokens ?? 0,
        salida: data.usage?.completion_tokens ?? 0,
      },
    };
  }

  /**
   * Extrae el contenido en Markdown de un archivo PDF usando la API de OCR de Mistral.
   */
  async extraerTextoOcr(archivoBytes: Uint8Array, nombreArchivo: string): Promise<string> {
    const fetchFn = this.opts.fetchFn ?? fetch;

    try {
      // 1. Subir archivo a /v1/files
      const formData = new FormData();
      formData.append(
        "file",
        new Blob([archivoBytes], { type: "application/pdf" }),
        nombreArchivo,
      );
      formData.append("purpose", "ocr");

      const fileRes = await fetchFn(URL_FILES, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.opts.apiKey}`,
        },
        body: formData,
        signal: AbortSignal.timeout(8_000),
      });

      if (!fileRes.ok) {
        throw new Error(`Error al subir archivo a Mistral: HTTP ${fileRes.status}`);
      }

      const fileData = (await fileRes.json()) as { id: string };
      const fileId = fileData.id;

      // 2. Procesar con mistral-ocr-latest
      try {
        const ocrRes = await fetchFn(URL_OCR, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.opts.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "mistral-ocr-latest",
            document: {
              type: "file_url",
              file_id: fileId,
            },
            table_format: "markdown",
          }),
          signal: AbortSignal.timeout(12_000),
        });

        if (ocrRes.ok) {
          const ocrData = (await ocrRes.json()) as {
            pages?: Array<{ markdown: string }>;
          };
          const paginas = (ocrData.pages || []).map((p) => p.markdown).join("\n\n");
          if (paginas.trim()) {
            return paginas;
          }
        }
      } finally {
        // 3. Limpiar archivo temporal en Mistral
        fetchFn(`${URL_FILES}/${fileId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${this.opts.apiKey}` },
        }).catch(() => {});
      }
    } catch {
      // Si el OCR de Mistral no está habilitado o falla, usamos el extractor de respaldo
    }

    // Extractor de respaldo directo de cadenas de texto del PDF
    return extraerCadenasTextoPDF(archivoBytes);
  }
}

/**
 * Extractor seguro de contingencia para cadenas de texto de documentos PDF
 * decodificando bloques de texto en caso de que la red externa de OCR tarde o falle.
 */
export function extraerCadenasTextoPDF(bytes: Uint8Array): string {
  const decoder = new TextDecoder("utf-8");
  const raw = decoder.decode(bytes);

  // Buscar secuencias de texto entre paréntesis en operadores Tj y TJ de PDF
  const fragmentos: string[] = [];
  const regexTj = /\(([^)]+)\)\s*Tj/g;
  let match: RegExpExecArray | null;

  while ((match = regexTj.exec(raw)) !== null) {
    if (match[1] && match[1].length > 1) {
      fragmentos.push(match[1]);
    }
  }

  if (fragmentos.length > 10) {
    return fragmentos.join(" ");
  }

  // Si no hay texto plano extraíble con Tj, limpiar caracteres imprimibles
  const limpio = raw
    .replace(/[^\x20-\x7E\xC0-\xFF\n\r\t]/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  return limpio.length > 50 ? limpio.slice(0, 8000) : "Sesión de aprendizaje en PDF.";
}
