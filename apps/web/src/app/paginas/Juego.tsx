import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Phaser from "phaser";
import { MecanicaCarrera, EmisorEventosMotor, type EventoMotor } from "@brain-rush/engine";
import {
  api,
  ErrorApi,
  type IntentoEntrada,
  type ItemIntento,
  type SesionAlumno,
} from "../api";
import { useSesion } from "../sesion";
import { Icono } from "../../juego/ilustraciones";
import "../../juego/tienda.css";

const MASCOT = "/juego/tiendita/mascota.png";

function Confeti() {
  const piezas = [
    { left: "10%", delay: "0s", color: "#f26a3d", size: 10 },
    { left: "18%", delay: "0.2s", color: "#1f7a6a", size: 12 },
    { left: "25%", delay: "0.4s", color: "#ffd166", size: 8 },
    { left: "33%", delay: "0.1s", color: "#dff2ec", size: 14 },
    { left: "42%", delay: "0.5s", color: "#d94f24", size: 9 },
    { left: "50%", delay: "0.0s", color: "#1f7a6a", size: 11 },
    { left: "58%", delay: "0.3s", color: "#f26a3d", size: 13 },
    { left: "67%", delay: "0.6s", color: "#ffd166", size: 10 },
    { left: "75%", delay: "0.2s", color: "#267ea9", size: 8 },
    { left: "83%", delay: "0.4s", color: "#1f7a6a", size: 12 },
    { left: "90%", delay: "0.1s", color: "#f26a3d", size: 9 },
    { left: "14%", delay: "0.7s", color: "#ffd166", size: 11 },
    { left: "28%", delay: "0.8s", color: "#f26a3d", size: 8 },
    { left: "45%", delay: "0.6s", color: "#1f7a6a", size: 14 },
    { left: "62%", delay: "0.9s", color: "#dff2ec", size: 10 },
    { left: "79%", delay: "0.7s", color: "#d94f24", size: 12 },
  ];
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 1,
      }}
    >
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(320px) rotate(600deg); opacity: 0; }
        }
      `}</style>
      {piezas.map((p, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            top: 0,
            left: p.left,
            width: `${p.size}px`,
            height: `${p.size * 1.4}px`,
            backgroundColor: p.color,
            borderRadius: "2px",
            animation: "confetti-fall 2.4s ease-out infinite",
            animationDelay: p.delay,
          }}
        />
      ))}
    </div>
  );
}

// --- Almacenamiento Offline en IndexedDB ---

const DB_NOMBRE = "brain-rush-intentos";
const DB_VERSION = 1;
const ALMACEN_INTENTOS = "intentos";

export interface IntentoGuardado extends IntentoEntrada {
  claveIdempotencia: string;
  token: string;
  codigo: string;
  enviado: boolean;
  estado: "pendiente" | "guardado" | "duplicado" | "rechazado";
  intentoId?: string;
  motivo?: string;
  creadoEn: string;
}

function generarUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function abrirBD(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      reject(new Error("IndexedDB no está soportado en este entorno."));
      return;
    }
    const peticion = window.indexedDB.open(DB_NOMBRE, DB_VERSION);

    peticion.onupgradeneeded = () => {
      const db = peticion.result;
      if (!db.objectStoreNames.contains(ALMACEN_INTENTOS)) {
        db.createObjectStore(ALMACEN_INTENTOS, { keyPath: "claveIdempotencia" });
      }
    };

    peticion.onsuccess = () => resolve(peticion.result);
    peticion.onerror = () => reject(peticion.error);
  });
}

async function guardarIntentoOffline(intento: IntentoGuardado): Promise<void> {
  try {
    const db = await abrirBD();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(ALMACEN_INTENTOS, "readwrite");
      const store = tx.objectStore(ALMACEN_INTENTOS);
      const req = store.put(intento);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.warn("No se pudo guardar el intento en IndexedDB:", error);
  }
}

async function obtenerIntentosPendientes(token?: string): Promise<IntentoGuardado[]> {
  try {
    const db = await abrirBD();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(ALMACEN_INTENTOS, "readonly");
      const store = tx.objectStore(ALMACEN_INTENTOS);
      const req = store.getAll();
      req.onsuccess = () => {
        const todos = (req.result as IntentoGuardado[]) || [];
        const pendientes = todos.filter((i) => !i.enviado && i.estado === "pendiente");
        if (token) {
          resolve(pendientes.filter((i) => i.token === token));
        } else {
          resolve(pendientes);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

async function marcarIntentosEnviados(
  resultados: {
    claveIdempotencia: string;
    estado: "guardado" | "duplicado" | "rechazado";
    intentoId?: string;
    motivo?: string;
  }[],
): Promise<void> {
  try {
    const db = await abrirBD();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(ALMACEN_INTENTOS, "readwrite");
      const store = tx.objectStore(ALMACEN_INTENTOS);

      resultados.forEach((res) => {
        const getReq = store.get(res.claveIdempotencia);
        getReq.onsuccess = () => {
          const actual = getReq.result as IntentoGuardado | undefined;
          if (actual) {
            actual.estado = res.estado;
            if (res.estado === "guardado" || res.estado === "duplicado") {
              actual.enviado = true;
              actual.intentoId = res.intentoId;
            } else {
              actual.motivo = res.motivo;
            }
            store.put(actual);
          }
        };
      });

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.warn("Error al actualizar estado en IndexedDB:", error);
  }
}

const LOTE_MAXIMO = 50;

// Envía todos los intentos pendientes del dispositivo. Cada intento se envía con el token
// del alumno que lo jugó, así que no depende de qué sesión esté abierta en este momento.
async function sincronizarPendientes(): Promise<number> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return 0;
  }
  const pendientes = await obtenerIntentosPendientes();
  if (pendientes.length === 0) return 0;

  const porToken = new Map<string, IntentoGuardado[]>();
  for (const p of pendientes) {
    const grupo = porToken.get(p.token) ?? [];
    grupo.push(p);
    porToken.set(p.token, grupo);
  }

  let enviados = 0;
  for (const [token, grupo] of porToken) {
    for (let i = 0; i < grupo.length; i += LOTE_MAXIMO) {
      const trozo = grupo.slice(i, i + LOTE_MAXIMO);
      try {
        const lote = trozo.map((p) => ({
          claveIdempotencia: p.claveIdempotencia,
          juegoId: p.juegoId,
          versionId: p.versionId,
          fuente: p.fuente,
          iniciadoEn: p.iniciadoEn,
          duracionMs: p.duracionMs,
          items: p.items,
        }));
        const respuesta = await api.enviarLote(lote, token);
        await marcarIntentosEnviados(respuesta.resultados);
        enviados += respuesta.resultados.filter(
          (r) => r.estado === "guardado" || r.estado === "duplicado",
        ).length;
      } catch (error) {
        console.warn("Fallo en sincronización por lote:", error);
      }
    }
  }
  return enviados;
}

function soporteCanvas(): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      canvas.getContext &&
        (canvas.getContext("2d") ||
          canvas.getContext("webgl") ||
          canvas.getContext("experimental-webgl")),
    );
  } catch {
    return false;
  }
}

type Pantalla = "ingreso" | "jugando" | "resultado" | "error";

interface InfoResultado {
  aciertos: number;
  total: number;
  minimoLogro: number;
  logrado: boolean;
  enviado: boolean;
  duracionMs?: number;
}

export function Juego() {
  const { codigo = "" } = useParams<{ codigo: string }>();
  const { sesion, iniciarAlumno } = useSesion();

  const [pantalla, setPantalla] = useState<Pantalla>("ingreso");
  const [nombreAlumno, setNombreAlumno] = useState(() => {
    if (sesion?.rol === "alumno" && sesion.nombre !== "Alumno") return sesion.nombre;
    return "";
  });
  const [cargando, setCargando] = useState(false);
  const [mensajeError, setMensajeError] = useState("");
  const [sesionAlumno, setSesionAlumno] = useState<SesionAlumno | null>(null);
  const [resultado, setResultado] = useState<InfoResultado | null>(null);
  const [pendientesCount, setPendientesCount] = useState(0);
  const [esDeActivacion, setEsDeActivacion] = useState(false);
  const [estaOnline, setEstaOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  const phaserContenedorRef = useRef<HTMLDivElement | null>(null);
  const phaserJuegoRef = useRef<Phaser.Game | null>(null);
  const iniciadoEnRef = useRef<string>("");
  const itemsRef = useRef<ItemIntento[]>([]);
  const sesionAlumnoRef = useRef<SesionAlumno | null>(null);

  // Mantener referencia actualizada de sesionAlumno
  useEffect(() => {
    sesionAlumnoRef.current = sesionAlumno;
  }, [sesionAlumno]);

  // Este enlace solo sirve para complementos de carrera; las activaciones se juegan en sala.
  useEffect(() => {
    if (!codigo) return;
    api
      .obtenerJuegoPublicado(codigo)
      .then((datos) => {
        setEsDeActivacion(datos.spec.tipo !== "complemento" || datos.spec.mecanica !== "carrera");
      })
      .catch(() => {
        // Sin conexión o juego inexistente: se deja el flujo normal de ingreso.
      });
  }, [codigo]);

  // Actualizar conteo de pendientes en IndexedDB
  const refrescarPendientes = useCallback(async () => {
    const p = await obtenerIntentosPendientes();
    setPendientesCount(p.length);
  }, []);

  // Manejo de conexión y sincronización en línea/fuera de línea
  useEffect(() => {
    const handleOnline = () => {
      setEstaOnline(true);
      void sincronizarPendientes().then(() => {
        void refrescarPendientes();
        // Si estamos en la pantalla de resultado y no estaba enviado, marcarlo como enviado
        setResultado((prev) => (prev ? { ...prev, enviado: true } : null));
      });
    };

    const handleOffline = () => {
      setEstaOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Revisión inicial de pendientes
    void refrescarPendientes();

    // Intentar sincronizar cada 30 segundos si hay conexión
    const intervalo = setInterval(() => {
      if (navigator.onLine) {
        void sincronizarPendientes().then(() => {
          void refrescarPendientes();
        });
      }
    }, 30_000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(intervalo);
    };
  }, [refrescarPendientes]);

  // Procesar entrada al juego
  const manejarIngreso = async (e: React.FormEvent) => {
    e.preventDefault();
    const nombreLimpio = nombreAlumno.trim();
    if (!nombreLimpio) {
      setMensajeError("Por favor ingresa tu nombre para comenzar.");
      return;
    }

    if (!codigo) {
      setMensajeError("Código de juego no válido.");
      return;
    }

    setCargando(true);
    setMensajeError("");

    try {
      let datosSesion: SesionAlumno;

      try {
        datosSesion = await api.entrarAlJuego(codigo, nombreLimpio);
        // Persistir en localStorage como pide la especificación y contrato
        localStorage.setItem(
          "br.sesion",
          JSON.stringify({
            token: datosSesion.token,
            rol: "alumno",
            nombre: nombreLimpio,
          }),
        );
        localStorage.setItem(`br.juego.${codigo}`, JSON.stringify(datosSesion));
        iniciarAlumno(datosSesion.token);
      } catch (errApi) {
        // Modo sin conexión: intentar recuperar spec y token cacheados previamente
        const cacheJuego = localStorage.getItem(`br.juego.${codigo}`);
        if (!navigator.onLine && cacheJuego) {
          datosSesion = JSON.parse(cacheJuego) as SesionAlumno;
        } else {
          throw errApi;
        }
      }

      setSesionAlumno(datosSesion);

      // Verificar compatibilidad de canvas antes de arrancar Phaser
      if (!soporteCanvas()) {
        setMensajeError(
          "Tu navegador o dispositivo no soporta la tecnología gráfica (Canvas / WebGL) necesaria para ejecutar el juego.",
        );
        setPantalla("error");
        return;
      }

      setPantalla("jugando");
    } catch (error) {
      if (error instanceof ErrorApi) {
        if (error.codigo === "NO_ENCONTRADO") {
          setMensajeError(`El juego con código "${codigo}" no existe o aún no está publicado.`);
        } else if (error.codigo === "SIN_CONEXION") {
          setMensajeError(
            "No se pudo conectar con el servidor. Verifica tu conexión o inténtalo nuevamente.",
          );
        } else {
          setMensajeError(error.message);
        }
      } else {
        setMensajeError("Ocurrió un error inesperado al intentar ingresar al juego.");
      }
    } finally {
      setCargando(false);
    }
  };

  // Instanciar Phaser cuando la pantalla pasa a "jugando"
  useEffect(() => {
    if (pantalla !== "jugando" || !sesionAlumno) {
      return;
    }

    const contenedor = phaserContenedorRef.current;
    if (!contenedor) return;

    // Reiniciar buffers de eventos
    iniciadoEnRef.current = new Date().toISOString();
    itemsRef.current = [];

    const emisor = new EmisorEventosMotor();

    const desuscribir = emisor.suscribir((evento: EventoMotor) => {
      if (evento.tipo === "inicio") {
        iniciadoEnRef.current = evento.iniciadoEn || new Date().toISOString();
        itemsRef.current = [];
      } else if (evento.tipo === "respuesta") {
        itemsRef.current.push({
          itemId: evento.itemId,
          criterio: evento.criterio,
          correcto: evento.correcto,
          tiempoMs: evento.tiempoMs,
          intentos: evento.intentos,
        });
      } else if (evento.tipo === "fin") {
        void procesarFinDelJuego(evento, sesionAlumno);
      }
    });

    let escena: MecanicaCarrera;
    try {
      escena = new MecanicaCarrera({
        spec: sesionAlumno.spec,
        versionId: sesionAlumno.versionId,
        juegoId: sesionAlumno.juegoId,
        alumnoId: sesionAlumno.alumnoId,
        duracionTutorialMs: 2500,
        emisor,
      });
    } catch (errEscena) {
      console.error("Error al instanciar la escena del juego:", errEscena);
      setMensajeError("No se pudo inicializar la mecánica del juego.");
      setPantalla("error");
      desuscribir();
      return;
    }

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: contenedor,
      width: 800,
      height: 600,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      backgroundColor: "#fbf7ef",
      scene: [escena],
    };

    let juegoInstancia: Phaser.Game | null = null;
    try {
      juegoInstancia = new Phaser.Game(config);
      phaserJuegoRef.current = juegoInstancia;
      if (import.meta.env.DEV) {
        (window as unknown as { __brainRushJuego?: Phaser.Game }).__brainRushJuego = juegoInstancia;
      }
    } catch (errPhaser) {
      console.error("Error al iniciar Phaser:", errPhaser);
      setMensajeError(
        "No se pudo inicializar el motor de juego en este dispositivo (soporte de Canvas no disponible).",
      );
      setPantalla("error");
      desuscribir();
      return;
    }

    return () => {
      desuscribir();
      if (juegoInstancia) {
        try {
          juegoInstancia.destroy(true);
        } catch {
          // Destrucción segura sin propagar error
        }
      }
      phaserJuegoRef.current = null;
    };
  }, [pantalla, sesionAlumno]);

  // Procesar evento 'fin'
  const procesarFinDelJuego = async (
    evento: {
      tipo: "fin";
      aciertos: number;
      total: number;
      duracionMs: number;
      completado: boolean;
    },
    sesionActual: SesionAlumno,
  ) => {
    const claveIdempotencia = generarUUID();
    const minimoLogro = sesionActual.spec.evaluacion?.minimoLogro ?? 0.6;
    const logradoLocal =
      evento.total > 0 && evento.aciertos / evento.total >= minimoLogro;

    const intento: IntentoEntrada = {
      juegoId: sesionActual.juegoId,
      versionId: sesionActual.versionId,
      fuente: "digital",
      iniciadoEn: iniciadoEnRef.current || new Date().toISOString(),
      duracionMs: evento.duracionMs,
      items: [...itemsRef.current],
    };

    // 1. Persistencia offline obligatoria en IndexedDB
    const guardado: IntentoGuardado = {
      ...intento,
      claveIdempotencia,
      token: sesionActual.token,
      codigo,
      enviado: false,
      estado: "pendiente",
      creadoEn: new Date().toISOString(),
    };
    await guardarIntentoOffline(guardado);
    await refrescarPendientes();

    // 2. Si hay conexión, intentar enviar al servidor
    let enviadoConExito = false;
    let logradoFinal = logradoLocal;
    let aciertosFinal = evento.aciertos;
    let totalFinal = evento.total;
    let minimoLogroFinal = minimoLogro;

    if (navigator.onLine) {
      try {
        const respuesta = await api.enviarIntento(
          intento,
          sesionActual.token,
          claveIdempotencia,
        );
        enviadoConExito = true;
        logradoFinal = respuesta.logrado;
        aciertosFinal = respuesta.aciertos;
        totalFinal = respuesta.total;
        minimoLogroFinal = respuesta.minimoLogro;

        await marcarIntentosEnviados([
          {
            claveIdempotencia,
            estado: respuesta.duplicado ? "duplicado" : "guardado",
            intentoId: respuesta.intentoId,
          },
        ]);

        // Sincronizar otros que estuvieran en cola
        void sincronizarPendientes().then(refrescarPendientes);
      } catch (errEnvio) {
        console.warn("No se pudo enviar el intento al servidor, queda en cola:", errEnvio);
        enviadoConExito = false;
      }
    }

    setResultado({
      aciertos: aciertosFinal,
      total: totalFinal,
      minimoLogro: minimoLogroFinal,
      logrado: logradoFinal,
      enviado: enviadoConExito,
      duracionMs: evento.duracionMs,
    });

    setPantalla("resultado");
  };

  const reiniciarPartida = () => {
    setResultado(null);
    setPantalla("jugando");
  };

  const cambiarAlumno = () => {
    setResultado(null);
    setSesionAlumno(null);
    setPantalla("ingreso");
  };

  return (
    <div className="juego-contenedor">
      {/* Pantalla 1: Ingreso del alumno (Activación) */}
      {pantalla === "ingreso" && esDeActivacion && (
        <div className="shop-app is-intro">
          <header className="shop-header">
            <Link to="/" className="brand-link" aria-label="BRAIN RUSH, página principal">
              <span className="shop-brand">
                <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
                  <path d="M17 2 6 18h9l-1 12 12-18h-9z" fill="currentColor" />
                </svg>
                <span>BRAIN<b>RUSH</b></span>
              </span>
            </Link>
            <Link className="back-school" to="/">
              Volver a la escuela <Icono nombre="arrow" size={18} />
            </Link>
          </header>

          <main className="result-screen">
            <div className="result-art">
              <img src={MASCOT} alt="La mascota" />
            </div>
            <h1>Este juego se juega en el aula</h1>
            <p style={{ maxWidth: "440px", margin: "1rem auto 2rem", color: "var(--muted)", fontWeight: 700 }}>
              Es un juego de activación colectiva. Tu docente abrirá una sala y te dará su código para entrar desde tu celular.
            </p>
            <Link to="/" className="primary-button" style={{ textDecoration: "none" }}>
              Volver al inicio
            </Link>
          </main>
        </div>
      )}

      {/* Pantalla 1: Ingreso del alumno (Complemento carrera - estilo portada tiendita) */}
      {pantalla === "ingreso" && !esDeActivacion && (
        <div className="shop-app is-intro">
          <header className="shop-header">
            <Link to="/" className="brand-link" aria-label="BRAIN RUSH, página principal">
              <span className="shop-brand">
                <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
                  <path d="M17 2 6 18h9l-1 12 12-18h-9z" fill="currentColor" />
                </svg>
                <span>BRAIN<b>RUSH</b></span>
              </span>
            </Link>
            <span className="local-label">
              <span style={{ background: estaOnline ? "#1f7a6a" : "#d94f24" }} />
              {estaOnline ? "Conectado" : "Sin conexión"}
            </span>
            <Link className="back-school" to="/">
              Volver a la escuela <Icono nombre="arrow" size={18} />
            </Link>
          </header>

          <main className="shop-intro">
            <section className="intro-copy">
              <div className="age-tag">3.º y 4.º de primaria <span>·</span> Carrera de conversiones</div>
              <h1>¡A la <span>carrera!</span></h1>
              <p className="intro-description">
                Multiplica, divide.<br /> Supera cada puerta.
              </p>

              {mensajeError && (
                <div
                  className="aviso aviso-error"
                  role="alert"
                  style={{
                    borderRadius: "14px",
                    padding: "12px 16px",
                    background: "#fff3ef",
                    border: "1px solid #f0b8a7",
                    color: "#d94f24",
                    fontWeight: 700,
                    marginBottom: "1rem",
                  }}
                >
                  {mensajeError}
                </div>
              )}

              <form onSubmit={manejarIngreso} style={{ display: "grid", gap: "1rem", maxWidth: "380px" }}>
                <input
                  type="text"
                  className="input-nombre"
                  placeholder="Tu nombre aquí…"
                  value={nombreAlumno}
                  onChange={(e) => setNombreAlumno(e.target.value)}
                  maxLength={40}
                  required
                  autoFocus
                  style={{
                    padding: "16px 20px",
                    borderRadius: "var(--radius)",
                    border: "2px solid var(--line)",
                    background: "#fffdf7",
                    color: "var(--ink)",
                    fontSize: "18px",
                    fontWeight: 700,
                    outline: "none",
                    boxShadow: "0 3px 6px #4931260a",
                  }}
                />

                <button
                  type="submit"
                  disabled={cargando || !nombreAlumno.trim()}
                  className="primary-button play-button"
                  style={{ width: "100%" }}
                >
                  <Icono nombre="play" /> {cargando ? "Preparando la pista…" : "¡A jugar!"} <Icono nombre="arrow" />
                </button>
              </form>

              <div className="play-method">
                <Icono nombre="hand" size={20} />
                <span>Toca ×10 o ÷10 y arrastra a la puerta</span>
              </div>
            </section>

            <section className="intro-art" aria-label="La mascota te saluda lista para la carrera">
              <div className="art-arch">
                <div className="intro-awning" />
                <div className="shop-sign">¡META!</div>
                <div className="art-floor" />
              </div>
              <img className="intro-mascot" src={MASCOT} alt="Nuestra mascota te invita a jugar" />
              <svg className="art-star star-a" viewBox="0 0 40 40" aria-hidden="true"><path d="m20 0 5 15 15 5-15 5-5 15-5-15L0 20l15-5z" fill="currentColor" /></svg>
              <svg className="art-star star-b" viewBox="0 0 40 40" aria-hidden="true"><path d="m20 0 5 15 15 5-15 5-5 15-5-15L0 20l15-5z" fill="currentColor" /></svg>
            </section>
          </main>
        </div>
      )}

      {/* Pantalla 2: Ejecución del juego Phaser */}
      {pantalla === "jugando" && (
        <div className="shop-app" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#fbf7ef" }}>
          <header
            className="shop-header"
            style={{
              minHeight: "56px",
              padding: "10px 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "min(1280px, 100%)",
              margin: "0 auto",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <Link to="/" className="brand-link" aria-label="BRAIN RUSH, página principal">
                <span className="shop-brand" style={{ fontSize: "16px" }}>
                  <svg viewBox="0 0 32 32" fill="none" style={{ width: "22px", height: "26px" }} aria-hidden="true">
                    <path d="M17 2 6 18h9l-1 12 12-18h-9z" fill="currentColor" />
                  </svg>
                  <span>BRAIN<b>RUSH</b></span>
                </span>
              </Link>
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: 800,
                  color: "var(--ink)",
                  background: "var(--green-light)",
                  padding: "4px 12px",
                  borderRadius: "999px",
                }}
              >
                {nombreAlumno}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span className="local-label" style={{ fontSize: "12px" }}>
                <span style={{ background: estaOnline ? "#1f7a6a" : "#d94f24" }} />
                {estaOnline ? "Conectado" : "Sin conexión"}
              </span>
              {pendientesCount > 0 && (
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 800,
                    background: "#fff1d6",
                    color: "#8a5a00",
                    padding: "3px 8px",
                    borderRadius: "8px",
                  }}
                >
                  ⏳ {pendientesCount}
                </span>
              )}
            </div>
          </header>

          <main
            style={{
              flex: 1,
              width: "min(1280px, 100%)",
              margin: "0 auto",
              padding: "0 16px 16px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              ref={phaserContenedorRef}
              id="phaser-carrera-contenedor"
              style={{
                width: "100%",
                maxWidth: "860px",
                aspectRatio: "4 / 3",
                maxHeight: "calc(100vh - 84px)",
                borderRadius: "var(--radius)",
                overflow: "hidden",
                border: "2px solid var(--line)",
                boxShadow: "0 10px 30px #49312614",
                background: "#fbf7ef",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            />
          </main>
        </div>
      )}

      {/* Pantalla 3: Resultado final con aciertos/total y confeti CSS */}
      {pantalla === "resultado" && resultado && (
        <div className="shop-app" style={{ minHeight: "100vh", position: "relative" }}>
          <header className="shop-header">
            <Link to="/" className="brand-link" aria-label="BRAIN RUSH, página principal">
              <span className="shop-brand">
                <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
                  <path d="M17 2 6 18h9l-1 12 12-18h-9z" fill="currentColor" />
                </svg>
                <span>BRAIN<b>RUSH</b></span>
              </span>
            </Link>
          </header>

          <main className="result-screen" style={{ position: "relative" }}>
            <Confeti />

            <div className="result-art">
              <img src={MASCOT} alt="La mascota celebra contigo" />
              <div className="result-stars">
                {[0, 1, 2].map((n) => (
                  <Icono key={n} nombre="star" size={48} />
                ))}
              </div>
            </div>

            <h1 style={{ marginTop: "10px", marginBottom: "4px" }}>
              {resultado.logrado ? "¡Meta alcanzada!" : "¡Buen esfuerzo!"}
            </h1>

            <div
              style={{
                fontSize: "clamp(56px, 9vw, 80px)",
                fontWeight: 1000,
                lineHeight: 1,
                color: resultado.logrado ? "var(--green)" : "var(--orange)",
                margin: "10px 0 6px",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {resultado.aciertos} <span style={{ fontSize: "0.55em", color: "var(--muted)", fontWeight: 800 }}>/ {resultado.total}</span>
            </div>

            <p style={{ maxWidth: "420px", fontSize: "17px", fontWeight: 750, color: "var(--muted)", margin: "0 auto 18px", textWrap: "balance" }}>
              {resultado.logrado
                ? `¡Felicitaciones, ${nombreAlumno}! Dominaste las conversiones métricas con la mascota.`
                : `¡Gran intento, ${nombreAlumno}! Cada carrera te hace más veloz.`}
            </p>

            <div
              style={{
                fontSize: "13px",
                fontWeight: 800,
                color: resultado.enviado ? "var(--green)" : "#d94f24",
                marginBottom: "24px",
              }}
            >
              {resultado.enviado
                ? "✓ Carrera guardada y enviada al docente."
                : "💾 Guardada en este dispositivo. Se enviará al conectar."}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "min(100%, 280px)" }}>
              <button
                type="button"
                onClick={reiniciarPartida}
                className="primary-button"
                style={{ width: "100%" }}
              >
                <Icono nombre="play" /> Jugar de nuevo
              </button>
              <button
                type="button"
                onClick={cambiarAlumno}
                className="secondary-button"
                style={{ width: "100%" }}
              >
                Cambiar de estudiante
              </button>
              <Link
                to="/"
                className="text-button"
                style={{ textAlign: "center", textDecoration: "none" }}
              >
                Volver al inicio
              </Link>
            </div>
          </main>
        </div>
      )}

      {/* Pantalla 4: Error o entorno sin soporte */}
      {pantalla === "error" && (
        <div className="shop-app">
          <header className="shop-header">
            <Link to="/" className="brand-link" aria-label="BRAIN RUSH, página principal">
              <span className="shop-brand">
                <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
                  <path d="M17 2 6 18h9l-1 12 12-18h-9z" fill="currentColor" />
                </svg>
                <span>BRAIN<b>RUSH</b></span>
              </span>
            </Link>
          </header>

          <main className="result-screen">
            <div className="result-art">
              <img src={MASCOT} alt="La mascota" />
            </div>
            <h1>No pudimos abrir la pista</h1>
            <p style={{ maxWidth: "440px", margin: "1rem auto 1.5rem", color: "var(--muted)", fontWeight: 700 }}>
              {mensajeError || "El navegador no cumple con los requisitos gráficos para Phaser."}
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  setMensajeError("");
                  setPantalla("ingreso");
                }}
              >
                Reintentar
              </button>
              <Link to="/" className="secondary-button" style={{ textDecoration: "none" }}>
                Volver al inicio
              </Link>
            </div>
          </main>
        </div>
      )}
    </div>
  );
}
