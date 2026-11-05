import type { GameSpec } from "@brain-rush/gamespec";

/**
 * Cliente del contrato v1 (docs/especificacion/08-contrato.md).
 * No dibuja nada: solo habla con la API y devuelve datos tipados.
 */

function resolverBaseApi(): string {
  const envUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
  if (envUrl && envUrl !== "" && envUrl !== "/" && !envUrl.startsWith("/api")) {
    return envUrl.replace(/\/$/, "");
  }

  if (typeof window !== "undefined" && window.location) {
    const host = window.location.hostname;

    // Producción Cloudflare Workers (*.workers.dev o *.pages.dev)
    if (host.endsWith(".workers.dev") || host.endsWith(".pages.dev")) {
      if (host.startsWith("brain-rush-web.")) {
        return `https://${host.replace("brain-rush-web.", "brain-rush-api.")}`;
      }
      return `https://${host.replace(/-web(\.|$)/, "-api$1")}`;
    }

    // Entorno local
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host.startsWith("192.168.") ||
      host.startsWith("10.")
    ) {
      return `http://${host}:8787`;
    }
  }

  return "https://brain-rush-api.lgsc21211.workers.dev";
}

const BASE = resolverBaseApi();

export type Rol = "docente" | "alumno";
export type TipoJuego = "activacion" | "complemento";
export type Mecanica = "tienda" | "carrera";
export type Nivel = "N1" | "N2" | "N3";
export type Fuente = "digital" | "papel" | "sala";

export type CodigoError =
  | "SIN_CONEXION"
  | "NO_AUTORIZADO"
  | "SIN_PERMISO"
  | "NO_ENCONTRADO"
  | "VALIDACION"
  | "CONFLICTO"
  | "LIMITE"
  | "INTERNO";

export class ErrorApi extends Error {
  constructor(
    readonly codigo: CodigoError,
    mensaje: string,
    readonly estado = 0,
    readonly detalles?: unknown,
  ) {
    super(mensaje);
    this.name = "ErrorApi";
  }
}

export type Usuario = { id: string; rol: Rol; nombre: string };

export type JuegoResumen = {
  id: string;
  titulo: string;
  tipo: TipoJuego;
  mecanica: Mecanica;
  nivel: Nivel;
  grados: number[];
  estado: "borrador" | "publicado";
  versionActual: number;
  codigo: string;
  creadoEn: string;
};

export type OrigenGeneracion = {
  generadoPor: string;
  promptVersion: string;
  intentos?: number;
  erroresPrimerIntento?: string[];
};

export type JuegoPublicado = {
  juegoId: string;
  codigo: string;
  versionId: string;
  version: number;
  publicadoEn: string;
  spec: GameSpec;
};

export type SesionAlumno = {
  alumnoId: string;
  token: string;
  juegoId: string;
  versionId: string;
  spec: GameSpec;
};

export type ItemIntento = {
  itemId: string;
  criterio: string;
  correcto: boolean;
  tiempoMs: number;
  intentos: number;
};

export type IntentoEntrada = {
  juegoId: string;
  versionId: string;
  fuente: Fuente;
  iniciadoEn: string;
  duracionMs: number;
  items: ItemIntento[];
};

export type IntentoResultado = {
  intentoId: string;
  juegoId: string;
  aciertos: number;
  total: number;
  minimoLogro: number;
  logrado: boolean;
  duplicado: boolean;
};

export type LoteResultado = {
  resultados: {
    claveIdempotencia: string;
    estado: "guardado" | "duplicado" | "rechazado";
    intentoId?: string;
    motivo?: string;
  }[];
};

export type Progreso = { actual: number; objetivo: number };

export type MetaSala = { tipo: "camion"; objetivo: number };

export type SesionSala = {
  alumnoId: string;
  token: string;
  salaId: string;
  estado: EstadoSalaNombre;
  participantes: number;
  meta: MetaSala | null;
};

export type EstadoSalaNombre = "esperando" | "jugando" | "pausada" | "terminada";

export type EventoSala = {
  seq: number;
  tipo: "union" | "acierto" | "meta" | "ronda" | "fin";
  itemId?: string;
  actual?: number;
  objetivo?: number;
};

export type EstadoSala = {
  salaId: string;
  estado: EstadoSalaNombre;
  ronda: { indice: number; total: number; itemId: string };
  progreso: Progreso;
  participantes: number;
  seq: number;
  eventos: EventoSala[];
};

export type RespuestaSala = {
  itemId: string;
  criterio: string;
  correcto: boolean;
  tiempoMs: number;
};

export type RespuestaAceptada = { aceptada: boolean; seq: number; progreso: Progreso };

export type PanelJuego = {
  juego: JuegoResumen & { origenGeneracion?: OrigenGeneracion };
  participacion: { intentos: number; alumnos: number; completados: number };
  porCriterio: {
    criterio: string;
    texto: string;
    aciertos: number;
    total: number;
    porcentaje: number;
  }[];
  riesgo: {
    alumnoId: string;
    nombre: string;
    aciertos: number;
    total: number;
    criteriosBajos: string[];
  }[];
  generadoEn: string;
};

type OpcionesPeticion = {
  metodo?: "GET" | "POST";
  cuerpo?: unknown;
  token?: string | null;
  claveIdempotencia?: string;
};

function resolverTokenDocente(token?: string | null): string | null {
  if (token !== undefined) return token;
  try {
    const s = localStorage.getItem("br.sesion");
    if (s) {
      const parsed = JSON.parse(s);
      if (parsed?.token) return parsed.token;
    }
  } catch {}
  return "demo-docente";
}

async function pedir<T>(ruta: string, opciones: OpcionesPeticion = {}): Promise<T> {
  const cabeceras: Record<string, string> = { Accept: "application/json" };
  if (opciones.cuerpo !== undefined) cabeceras["Content-Type"] = "application/json";
  const tokenFinal = resolverTokenDocente(opciones.token);
  if (tokenFinal) cabeceras.Authorization = `Bearer ${tokenFinal}`;
  if (opciones.claveIdempotencia) cabeceras["Idempotency-Key"] = opciones.claveIdempotencia;

  let respuesta: Response;
  try {
    respuesta = await fetch(`${BASE}${ruta}`, {
      method: opciones.metodo ?? "GET",
      headers: cabeceras,
      body: opciones.cuerpo === undefined ? undefined : JSON.stringify(opciones.cuerpo),
      signal: AbortSignal.timeout(60_000),
    });
  } catch (e) {
    console.error(`Error de red al llamar ${BASE}${ruta}:`, e);
    throw new ErrorApi(
      "SIN_CONEXION",
      "No se pudo conectar con el servidor.",
    );
  }

  const texto = await respuesta.text();
  const datos = texto ? (JSON.parse(texto) as unknown) : null;

  if (!respuesta.ok) {
    const error = (datos as { error?: { codigo?: CodigoError; mensaje?: string; detalles?: unknown } })
      ?.error;
    throw new ErrorApi(
      error?.codigo ?? "INTERNO",
      error?.mensaje ?? `Error ${respuesta.status}`,
      respuesta.status,
      error?.detalles,
    );
  }

  return datos as T;
}

async function pedirMultipart<T>(ruta: string, formData: FormData, token?: string | null): Promise<T> {
  const cabeceras: Record<string, string> = { Accept: "application/json" };
  const tokenFinal = resolverTokenDocente(token);
  if (tokenFinal) cabeceras.Authorization = `Bearer ${tokenFinal}`;

  let respuesta: Response;
  try {
    respuesta = await fetch(`${BASE}${ruta}`, {
      method: "POST",
      headers: cabeceras,
      body: formData,
      signal: AbortSignal.timeout(90_000),
    });
  } catch (e) {
    console.error(`Error de red multipart al llamar ${BASE}${ruta}:`, e);
    throw new ErrorApi(
      "SIN_CONEXION",
      "No se pudo conectar con el servidor o la operación de IA tardó demasiado.",
    );
  }

  const texto = await respuesta.text();
  const datos = texto ? (JSON.parse(texto) as unknown) : null;

  if (!respuesta.ok) {
    const error = (datos as { error?: { codigo?: CodigoError; mensaje?: string; detalles?: unknown } })
      ?.error;
    throw new ErrorApi(
      error?.codigo ?? "INTERNO",
      error?.mensaje ?? `Error ${respuesta.status}`,
      respuesta.status,
      error?.detalles,
    );
  }

  return datos as T;
}

export const api = {
  salud: () => pedir<{ ok: boolean; version: string }>("/api/salud"),

  authDemo: (rol: Rol) =>
    pedir<{ token: string; usuario: Usuario }>("/api/auth/demo", {
      metodo: "POST",
      cuerpo: { rol },
    }),

  listarJuegos: (token: string) => pedir<{ juegos: JuegoResumen[] }>("/api/juegos", { token }),

  obtenerJuego: (id: string, token: string) =>
    pedir<JuegoResumen & { sesionId: string; origenGeneracion?: OrigenGeneracion }>(
      `/api/juegos/${encodeURIComponent(id)}`,
      { token },
    ),

  obtenerJuegoPublicado: (codigo: string) =>
    pedir<JuegoPublicado>(`/api/j/${encodeURIComponent(codigo)}`),

  entrarAlJuego: (codigo: string, nombre: string) =>
    pedir<SesionAlumno>(`/api/j/${encodeURIComponent(codigo)}/entrar`, {
      metodo: "POST",
      cuerpo: { nombre },
    }),

  enviarIntento: (intento: IntentoEntrada, token: string, claveIdempotencia: string) =>
    pedir<IntentoResultado>("/api/intentos", {
      metodo: "POST",
      cuerpo: intento,
      token,
      claveIdempotencia,
    }),

  enviarLote: (intentos: (IntentoEntrada & { claveIdempotencia: string })[], token: string) =>
    pedir<LoteResultado>("/api/intentos/lote", {
      metodo: "POST",
      cuerpo: { intentos },
      token,
    }),

  unirseASala: (codigo: string, nombre: string) =>
    pedir<SesionSala>(`/api/salas/${encodeURIComponent(codigo)}/unirse`, {
      metodo: "POST",
      cuerpo: { nombre },
    }),

  estadoSala: (codigo: string, desde: number, token: string) =>
    pedir<EstadoSala>(`/api/salas/${encodeURIComponent(codigo)}/estado?desde=${desde}`, { token }),

  responderSala: (codigo: string, respuesta: RespuestaSala, token: string) =>
    pedir<RespuestaAceptada>(`/api/salas/${encodeURIComponent(codigo)}/respuesta`, {
      metodo: "POST",
      cuerpo: respuesta,
      token,
    }),

  crearSala: (juegoId: string, token: string, maxAlumnos = 40) =>
    pedir<{
      salaId: string;
      codigo: string;
      estado: EstadoSalaNombre;
      juegoId: string;
      versionId: string;
      meta: MetaSala | null;
      creadaEn: string;
    }>("/api/salas", { metodo: "POST", cuerpo: { juegoId, maxAlumnos }, token }),

  avanzarSala: (codigo: string, ronda: number, token: string) =>
    pedir<{ salaId: string; estado: EstadoSalaNombre; ronda: EstadoSala["ronda"]; seq: number }>(
      `/api/salas/${encodeURIComponent(codigo)}/avanzar`,
      { metodo: "POST", cuerpo: { ronda }, token },
    ),

  cerrarSala: (codigo: string, token: string) =>
    pedir<{ salaId: string; estado: EstadoSalaNombre; seq: number; participantes: number }>(
      `/api/salas/${encodeURIComponent(codigo)}/cerrar`,
      { metodo: "POST", token },
    ),

  panel: (juegoId: string, token: string) =>
    pedir<PanelJuego>(`/api/panel/${encodeURIComponent(juegoId)}`, { token }),

  chat: (mensaje: string, historial?: Array<{ remitente: string; texto: string }>, contexto?: Record<string, unknown>) =>
    pedir<{ ok: boolean; respuesta: string; modelo?: string }>("/api/chat", {
      metodo: "POST",
      cuerpo: { mensaje, historial, contexto },
    }),

  extraerPdf: (archivo: File, token?: string) => {
    const fd = new FormData();
    fd.append("archivo", archivo);
    return pedirMultipart<{ ok: boolean; sesion: any; textoExtraido: string }>("/api/ia/extraer-pdf", fd, token);
  },

  generarDesdeSesion: (sesion: any, enfoqueDocente?: string, token?: string) =>
    pedir<{ ok: boolean; juegoId: string; versionId: string; codigo: string; spec: GameSpec; mensaje: string }>(
      "/api/ia/generar-desde-sesion",
      { metodo: "POST", cuerpo: { sesion, enfoqueDocente }, token },
    ),

  generarDesdePdf: (archivo: File, enfoqueDocente?: string, token?: string) => {
    const fd = new FormData();
    fd.append("archivo", archivo);
    if (enfoqueDocente) fd.append("enfoqueDocente", enfoqueDocente);
    return pedirMultipart<{
      ok: boolean;
      juegoId: string;
      sesionId: string;
      versionId: string;
      codigo: string;
      spec: GameSpec;
      sesion: any;
    }>("/api/ia/generar-desde-pdf", fd, token);
  },

  refinarJuegoConIA: (juegoId: string, instruccion: string, token?: string) =>
    pedir<{ ok: boolean; version: number; spec: GameSpec; respuestaIA: string }>("/api/ia/refinar-juego", {
      metodo: "POST",
      cuerpo: { juegoId, instruccion },
      token,
    }),
};

export { BASE as API_URL };
