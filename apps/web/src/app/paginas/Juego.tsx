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
      backgroundColor: "#f4fbf7",
      scene: [escena],
    };

    let juegoInstancia: Phaser.Game | null = null;
    try {
      juegoInstancia = new Phaser.Game(config);
      phaserJuegoRef.current = juegoInstancia;
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
      {/* Barra de estado discreta de conectividad y cola */}
      <aside
        className="juego-barra-estado"
        aria-label="Estado de conexión y sincronización"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0.5rem 0.8rem",
          background: "var(--papel-alto)",
          border: "1px solid var(--linea)",
          borderRadius: "12px",
          marginBottom: "1rem",
          fontSize: "0.85rem",
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
          <span
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: estaOnline ? "#2e7d32" : "#d94f24",
              display: "inline-block",
            }}
          />
          {estaOnline ? "Conectado" : "Modo sin conexión (offline activo)"}
        </span>
        {pendientesCount > 0 && (
          <span className="pastilla pastilla-borrador" style={{ fontSize: "0.75rem" }}>
            ⏳ {pendientesCount} intento(s) pendiente(s) por sincronizar
          </span>
        )}
      </aside>

      {/* Pantalla 1: Ingreso del alumno */}
      {pantalla === "ingreso" && esDeActivacion && (
        <div className="centrado">
          <section className="tarjeta tarjeta-login" style={{ maxWidth: "440px" }}>
            <h1>Este juego se juega en el aula</h1>
            <p className="suave">
              Es un juego de activación. Tu docente abrirá una sala y te dará su código para
              entrar desde tu celular.
            </p>
          </section>
        </div>
      )}

      {pantalla === "ingreso" && !esDeActivacion && (
        <div className="centrado">
          <section className="tarjeta tarjeta-login" style={{ maxWidth: "440px" }}>
            <p className="etiqueta">Juego de complemento</p>
            <h1>¡A la carrera! 🏁</h1>
            <p className="suave">
              Código de juego: <strong className="enlace-codigo">{codigo.toUpperCase()}</strong>
            </p>
            <p>
              Ingresa tu nombre o alias para comenzar la carrera de conversiones con Reglita.
            </p>

            {mensajeError && (
              <div className="aviso aviso-error" role="alert" style={{ marginBottom: "1rem" }}>
                {mensajeError}
              </div>
            )}

            <form onSubmit={manejarIngreso} style={{ display: "grid", gap: "1rem" }}>
              <label style={{ display: "grid", gap: "0.4rem", fontWeight: "bold" }}>
                <span>Nombre del estudiante:</span>
                <input
                  type="text"
                  className="input-nombre"
                  placeholder="Ej: Lucía, Mateo, Sofía..."
                  value={nombreAlumno}
                  onChange={(e) => setNombreAlumno(e.target.value)}
                  maxLength={40}
                  required
                  autoFocus
                  style={{
                    padding: "0.75rem 1rem",
                    borderRadius: "10px",
                    border: "1px solid var(--linea)",
                    font: "inherit",
                    fontSize: "1.05rem",
                  }}
                />
              </label>

              <button
                type="submit"
                disabled={cargando || !nombreAlumno.trim()}
                className="boton boton-primario boton-grande boton-ancho"
              >
                {cargando ? "Preparando la pista..." : "¡Comenzar a jugar! ⚡"}
              </button>
            </form>

            <small style={{ marginTop: "1rem", display: "block", color: "var(--tinta-suave)" }}>
              No se solicitan datos personales sensibles. Tu progreso se guardará en este
              dispositivo y se enviará al docente.
            </small>
          </section>
        </div>
      )}

      {/* Pantalla 2: Ejecución del juego Phaser */}
      {pantalla === "jugando" && (
        <section
          className="juego-area"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "800px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.6rem",
            }}
          >
            <span style={{ fontWeight: 700, color: "var(--tinta)" }}>
              Estudiante: <span style={{ color: "var(--naranja)" }}>{nombreAlumno}</span>
            </span>
            <span className="pastilla pastilla-publicado">Carrera métrica</span>
          </div>

          <div
            ref={phaserContenedorRef}
            id="phaser-carrera-contenedor"
            style={{
              width: "100%",
              maxWidth: "800px",
              aspectRatio: "4 / 3",
              background: "#e8f5e9",
              borderRadius: "16px",
              overflow: "hidden",
              boxShadow: "0 12px 36px rgba(0,0,0,0.12)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          />
        </section>
      )}

      {/* Pantalla 3: Resultado final con aciertos/total y mínimo de logro */}
      {pantalla === "resultado" && resultado && (
        <div className="centrado">
          <section
            className="tarjeta"
            style={{
              maxWidth: "500px",
              width: "100%",
              textAlign: "center",
              padding: "2rem",
            }}
          >
            <div style={{ fontSize: "4rem", marginBottom: "0.5rem" }}>
              {resultado.logrado ? "🏆" : "💪"}
            </div>

            <p className="etiqueta">
              {resultado.logrado ? "¡Meta alcanzada!" : "¡Buen esfuerzo!"}
            </p>

            <h1>{resultado.logrado ? "¡Excelente carrera!" : "¡Sigue practicando!"}</h1>

            <div
              style={{
                background: resultado.logrado ? "var(--verde-claro)" : "#fff1d6",
                borderRadius: "14px",
                padding: "1.2rem",
                margin: "1.2rem 0",
              }}
            >
              <div
                style={{
                  fontSize: "2.2rem",
                  fontWeight: "bold",
                  color: resultado.logrado ? "var(--verde)" : "#b25e00",
                }}
              >
                {resultado.aciertos} / {resultado.total}
              </div>
              <p
                style={{
                  margin: "0.2rem 0 0",
                  fontWeight: 600,
                  color: "var(--tinta-suave)",
                }}
              >
                Aciertos obtenidos ({Math.round((resultado.aciertos / (resultado.total || 1)) * 100)}%)
              </p>
              <p style={{ margin: "0.4rem 0 0", fontSize: "0.9rem" }}>
                Mínimo de logro esperado:{" "}
                <strong>{Math.round(resultado.minimoLogro * 100)}%</strong>
              </p>
            </div>

            <p style={{ fontSize: "1.05rem", color: "var(--tinta)", margin: "1rem 0" }}>
              {resultado.logrado
                ? `¡Felicitaciones, ${nombreAlumno}! Has superado el mínimo de logro (${Math.round(
                    resultado.minimoLogro * 100,
                  )}%) demostrando un gran dominio en conversiones de longitud.`
                : `¡Casi lo logras, ${nombreAlumno}! Obtuviste el ${Math.round(
                    (resultado.aciertos / (resultado.total || 1)) * 100,
                  )}% de aciertos. Con un poco más de práctica superarás la meta del ${Math.round(
                    resultado.minimoLogro * 100,
                  )}%.`}
            </p>

            <div
              style={{
                fontSize: "0.85rem",
                color: resultado.enviado ? "#2e7d32" : "#d94f24",
                marginBottom: "1.5rem",
                fontWeight: 600,
              }}
            >
              {resultado.enviado
                ? "✓ Intento guardado y enviado con éxito al servidor docente."
                : "💾 Intento guardado en tu dispositivo. Se enviará automáticamente cuando recuperes la conexión."}
            </div>

            <div style={{ display: "grid", gap: "0.75rem" }}>
              <button
                type="button"
                onClick={reiniciarPartida}
                className="boton boton-primario boton-grande boton-ancho"
              >
                Jugar de nuevo 🔄
              </button>
              <button
                type="button"
                onClick={cambiarAlumno}
                className="boton boton-fantasma boton-ancho"
              >
                Cambiar de estudiante / Salir
              </button>
              <Link to="/" className="nav-enlace" style={{ textAlign: "center" }}>
                Volver al inicio
              </Link>
            </div>
          </section>
        </div>
      )}

      {/* Pantalla 4: Error o entorno sin soporte */}
      {pantalla === "error" && (
        <div className="centrado">
          <section className="tarjeta" style={{ maxWidth: "480px", textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>⚠️</div>
            <h2>No se pudo iniciar el juego</h2>
            <div className="aviso aviso-error" style={{ textAlign: "left", margin: "1rem 0" }}>
              {mensajeError || "El navegador no cumple con los requisitos gráficos para Phaser."}
            </div>
            <p className="suave">
              Asegúrate de utilizar un navegador moderno como Google Chrome, Mozilla Firefox o Safari
              con aceleración por hardware habilitada.
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", marginTop: "1.5rem" }}>
              <button
                type="button"
                className="boton boton-primario"
                onClick={() => {
                  setMensajeError("");
                  setPantalla("ingreso");
                }}
              >
                Reintentar
              </button>
              <Link to="/" className="boton boton-fantasma">
                Volver al inicio
              </Link>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
