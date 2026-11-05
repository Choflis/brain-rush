import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { GameSpec } from "@brain-rush/gamespec";
import { api, ErrorApi, type EstadoSalaNombre, type Progreso } from "../api";
import { MecanicaTienda } from "../../../../../packages/engine/src/tienda.ts";
import { EmisorEventosMotor, type EventoMotor } from "../../../../../packages/engine/src/eventos.ts";
import Phaser from "phaser";
import specTiendaDefault from "../../../../../fixtures/juegos/n1-tienda.json";
import { Camion, Icono } from "../../juego/ilustraciones";
import "../../juego/tienda.css";

const MASCOT = "/juego/tiendita/mascota.png";

/**
 * Subclase de MecanicaTienda para sala sincronizada.
 * No avanza al siguiente ítem de forma autónoma cuando se clasifica todo;
 * en su lugar, notifica que el ítem actual fue completado y espera a que
 * el docente avance la ronda en la sala.
 */
class MecanicaTiendaSala extends MecanicaTienda {
  public itemCompletado: boolean = false;
  public onCompletadoRonda?: () => void;

  public override avanzarSiguienteItem(): void {
    this.itemCompletado = true;
    if (this.onCompletadoRonda) {
      this.onCompletadoRonda();
    }
  }
}

type AlumnoSesionSala = {
  alumnoId: string;
  token: string;
  nombre: string;
};

function comprobarSoporteCanvas(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl") ||
          canvas.getContext("experimental-webgl") ||
          canvas.getContext("2d")),
    );
  } catch {
    return false;
  }
}

export function Sala() {
  const params = useParams<{ codigo: string }>();
  const codigo = (params.codigo ?? "").toUpperCase();

  // Estado del alumno
  const claveSesion = `br.sala.${codigo}`;
  const [alumno, setAlumno] = useState<AlumnoSesionSala | null>(() => {
    try {
      const guardado = localStorage.getItem(claveSesion);
      if (guardado) return JSON.parse(guardado) as AlumnoSesionSala;
    } catch {
      // Ignorar
    }
    return null;
  });

  const [nombreForm, setNombreForm] = useState("");
  const [uniendo, setUniendo] = useState(false);
  const [errorUnirse, setErrorUnirse] = useState<string | null>(null);

  // Estado de la sala recibido por polling
  const [estadoSala, setEstadoSala] = useState<EstadoSalaNombre>("esperando");
  const [ronda, setRonda] = useState<{ indice: number; total: number; itemId: string }>({
    indice: 1,
    total: 12,
    itemId: "f1",
  });
  const [progreso, setProgreso] = useState<Progreso>({ actual: 0, objetivo: 12 });
  const [participantes, setParticipantes] = useState(1);
  const [itemCompletado, setItemCompletado] = useState(false);
  const [misAciertos, setMisAciertos] = useState(0);

  // Phaser y canvas
  const contenedorRef = useRef<HTMLDivElement | null>(null);
  const juegoRef = useRef<Phaser.Game | null>(null);
  const escenaRef = useRef<MecanicaTiendaSala | null>(null);
  const emisorRef = useRef<EmisorEventosMotor | null>(null);
  const [sinCanvas, setSinCanvas] = useState(false);
  const [errorPhaser, setErrorPhaser] = useState<string | null>(null);

  const ultimoSeqRef = useRef<number>(0);
  const rondaRef = useRef(ronda.indice);
  rondaRef.current = ronda.indice;

  // Unirse a la sala
  const manejarUnirse = async (e: React.FormEvent) => {
    e.preventDefault();
    const limpio = nombreForm.trim();
    if (!limpio) return;

    setUniendo(true);
    setErrorUnirse(null);
    try {
      const res = await api.unirseASala(codigo, limpio);
      const nuevaSesion: AlumnoSesionSala = {
        alumnoId: res.alumnoId,
        token: res.token,
        nombre: limpio,
      };
      setAlumno(nuevaSesion);
      try {
        localStorage.setItem(claveSesion, JSON.stringify(nuevaSesion));
      } catch {
        // Ignorar
      }
      setEstadoSala(res.estado);
      setParticipantes(res.participantes);
      if (res.meta) {
        setProgreso((prev) => ({ ...prev, objetivo: res.meta?.objetivo ?? prev.objetivo }));
      }
    } catch (err) {
      setErrorUnirse(
        err instanceof ErrorApi
          ? err.message
          : "No se pudo unir a la sala. Comprueba el código o tu conexión.",
      );
    } finally {
      setUniendo(false);
    }
  };

  // Salir de la sala
  const manejarSalir = () => {
    try {
      localStorage.removeItem(claveSesion);
    } catch {
      // Ignorar
    }
    setAlumno(null);
    setEstadoSala("esperando");
    if (juegoRef.current) {
      try {
        juegoRef.current.destroy(true);
      } catch {
        // Ignorar
      }
      juegoRef.current = null;
      escenaRef.current = null;
    }
  };

  // Polling del estado de la sala cada 1,5 segundos
  useEffect(() => {
    if (!alumno || !codigo) return;
    if (estadoSala === "terminada") return;

    let activo = true;

    const consultar = async () => {
      try {
        const datos = await api.estadoSala(codigo, ultimoSeqRef.current, alumno.token);
        if (!activo) return;

        setEstadoSala(datos.estado);
        setParticipantes(datos.participantes);
        setProgreso(datos.progreso);
        ultimoSeqRef.current = datos.seq;

        // Si cambió la ronda
        if (datos.ronda && datos.ronda.indice !== rondaRef.current) {
          setRonda(datos.ronda);
          setItemCompletado(false);
          // Sincronizar el ítem en la escena de Phaser si existe
          if (escenaRef.current) {
            escenaRef.current.itemCompletado = false;
            escenaRef.current.cargarItem(datos.ronda.indice - 1);
          }
        }
      } catch (err) {
        // Si la sala no existe o el alumno fue expulsado
        if (err instanceof ErrorApi && err.estado === 404) {
          setErrorUnirse("La sala ha dejado de existir.");
        }
      }
    };

    void consultar();
    const intervalo = setInterval(() => {
      void consultar();
    }, 1500);

    return () => {
      activo = false;
      clearInterval(intervalo);
    };
  }, [alumno, codigo, estadoSala]);

  // Inicializar Phaser cuando la sala esté en estado "jugando"
  useEffect(() => {
    if (!alumno || estadoSala !== "jugando") return;
    if (!contenedorRef.current) return;

    if (!comprobarSoporteCanvas()) {
      setSinCanvas(true);
      return;
    }

    if (juegoRef.current) return;

    setErrorPhaser(null);

    const emisor = new EmisorEventosMotor();
    emisorRef.current = emisor;

    // Escuchar respuestas emitidas por MecanicaTienda
    const desuscribir = emisor.suscribir((evento: EventoMotor) => {
      if (evento.tipo === "respuesta") {
        if (evento.correcto) {
          setMisAciertos((prev) => prev + 1);
        }
        api
          .responderSala(
            codigo,
            {
              itemId: evento.itemId,
              criterio: evento.criterio,
              correcto: evento.correcto,
              tiempoMs: evento.tiempoMs,
            },
            alumno.token,
          )
          .then((res) => {
            setProgreso(res.progreso);
            if (escenaRef.current) {
              escenaRef.current.progresoCamion = res.progreso.actual;
              // @ts-expect-error invocar método de actualización visual
              escenaRef.current.actualizarMetaCamion?.();
            }
          })
          .catch((err) => {
            console.warn("Error registrando respuesta en sala:", err);
          });
      }
    });

    try {
      const spec: GameSpec = specTiendaDefault as unknown as GameSpec;
      const escena = new MecanicaTiendaSala({
        spec,
        versionId: "v1",
        alumnoId: alumno.alumnoId,
        salaId: codigo,
        emisor,
        duracionTutorialMs: 1000,
      });

      escena.onCompletadoRonda = () => {
        setItemCompletado(true);
      };

      escenaRef.current = escena;

      const juego = new Phaser.Game({
        type: Phaser.AUTO,
        parent: contenedorRef.current,
        width: 800,
        height: 600,
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        scene: [escena],
        transparent: true,
      });

      juegoRef.current = juego;

      // Verificar que se haya insertado el elemento canvas
      const timer = setTimeout(() => {
        const canvas = contenedorRef.current?.querySelector("canvas");
        if (!canvas) {
          setSinCanvas(true);
        } else {
          setSinCanvas(false);
          // Cargar el ítem correspondiente a la ronda actual
          escena.cargarItem(Math.max(0, rondaRef.current - 1));
        }
      }, 400);

      return () => {
        clearTimeout(timer);
        desuscribir();
        try {
          juego.destroy(true);
        } catch {
          // Ignorar
        }
        juegoRef.current = null;
        escenaRef.current = null;
      };
    } catch (e) {
      console.error("Error al instanciar Phaser:", e);
      setErrorPhaser("No se pudo iniciar el motor gráfico de Phaser.");
    }
  }, [alumno, estadoSala, codigo]);

  // Vista 1: Formulario para ingresar nombre y unirse a la sala
  if (!alumno) {
    return (
      <div className="shop-app is-intro" style={{ minHeight: "100vh" }}>
        <header className="shop-header">
          <Link to="/" className="brand-link" aria-label="BRAIN RUSH, página principal">
            <span className="shop-brand">
              <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
                <path d="M17 2 6 18h9l-1 12 12-18h-9z" fill="currentColor" />
              </svg>
              <span>BRAIN<b>RUSH</b></span>
            </span>
          </Link>
          <span
            style={{
              marginLeft: "auto",
              fontSize: "14px",
              fontWeight: 800,
              background: "var(--green-light)",
              color: "var(--green)",
              padding: "4px 14px",
              borderRadius: "999px",
            }}
          >
            Sala {codigo}
          </span>
        </header>

        <main className="shop-intro" style={{ maxWidth: "480px", margin: "auto", padding: "20px" }}>
          <section
            style={{
              width: "100%",
              background: "#fffcf6",
              border: "1px solid var(--line)",
              borderRadius: "var(--radius)",
              padding: "32px 28px",
              boxShadow: "0 10px 30px #49312610",
              textAlign: "center",
            }}
          >
            <img
              src={MASCOT}
              alt=""
              style={{ width: "90px", height: "100px", objectFit: "contain", marginBottom: "8px" }}
            />
            <div className="age-tag" style={{ justifyContent: "center", marginBottom: "8px" }}>
              Sala de activación colectiva
            </div>
            <h1 style={{ fontSize: "32px", fontWeight: 1000, color: "var(--ink)", margin: "0 0 8px" }}>
              ¡A jugar en equipo!
            </h1>
            <p style={{ color: "var(--muted)", fontSize: "15px", fontWeight: 650, margin: "0 0 20px" }}>
              Ingresa tu nombre o el de tu equipo para ayudar a llenar el camión.
            </p>

            {errorUnirse && (
              <div
                className="aviso aviso-error"
                role="alert"
                style={{
                  borderRadius: "14px",
                  padding: "10px 14px",
                  background: "#fff3ef",
                  border: "1px solid #f0b8a7",
                  color: "#d94f24",
                  fontWeight: 700,
                  fontSize: "14px",
                  marginBottom: "16px",
                  textAlign: "left",
                }}
              >
                {errorUnirse}
              </div>
            )}

            <form onSubmit={manejarUnirse} style={{ display: "grid", gap: "14px" }}>
              <input
                id="nombre-alumno"
                type="text"
                value={nombreForm}
                onChange={(e) => setNombreForm(e.target.value)}
                placeholder="Tu nombre o equipo..."
                maxLength={40}
                required
                autoFocus
                style={{
                  width: "100%",
                  padding: "14px 18px",
                  fontSize: "17px",
                  fontWeight: 700,
                  borderRadius: "var(--radius)",
                  border: "2px solid var(--line)",
                  background: "#fffdf7",
                  color: "var(--ink)",
                  outline: "none",
                }}
              />

              <button
                type="submit"
                className="primary-button play-button"
                disabled={uniendo || !nombreForm.trim()}
                style={{ width: "100%" }}
              >
                <Icono nombre="play" /> {uniendo ? "Uniéndose a la sala…" : "¡Entrar a la sala!"}
              </button>
            </form>

            <span style={{ display: "block", marginTop: "14px", fontSize: "12px", color: "var(--muted)", fontWeight: 600 }}>
              Meta colectiva: entre todos llenamos el camión de reparto.
            </span>
          </section>
        </main>
      </div>
    );
  }

  // Vista 2: Sala terminada (Resultados colectivos e individuales)
  if (estadoSala === "terminada") {
    const porcentaje = Math.min(
      100,
      Math.round((progreso.actual / Math.max(1, progreso.objetivo)) * 100),
    );
    const metaLograda = progreso.actual >= progreso.objetivo;

    return (
      <div className="shop-app" style={{ minHeight: "100vh" }}>
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
            <img src={MASCOT} alt="La mascota celebra contigo" />
            <div className="result-stars">
              {[0, 1, 2].map((n) => (
                <Icono key={n} nombre="star" size={48} />
              ))}
            </div>
          </div>

          <h1 style={{ marginTop: "10px", marginBottom: "6px" }}>
            {metaLograda ? "¡Reparto completado!" : "¡Buen trabajo en el aula!"}
          </h1>

          <p style={{ maxWidth: "440px", fontSize: "16px", fontWeight: 700, color: "var(--muted)", margin: "0 auto 18px", textWrap: "balance" }}>
            ¡Gracias por participar, <strong>{alumno.nombre}</strong>! La sala <code>{codigo}</code> ha finalizado.
          </p>

          <div
            style={{
              background: "#fffcf6",
              border: "1px solid var(--line)",
              borderRadius: "var(--radius)",
              padding: "20px 24px",
              margin: "0 auto 24px",
              maxWidth: "400px",
              width: "100%",
              boxShadow: "0 6px 18px #4931260a",
            }}
          >
            <div className="truck-progress" style={{ margin: "0 auto 12px" }}>
              <Camion lleno={metaLograda} />
              <div>
                <span>Nuestro reparto colectivo</span>
                <strong>
                  {progreso.actual}
                  <small> / {progreso.objetivo}</small>
                </strong>
                <div
                  className="progress-track"
                  role="progressbar"
                  aria-label="Avance del reparto"
                  aria-valuemin={0}
                  aria-valuemax={progreso.objetivo}
                  aria-valuenow={progreso.actual}
                >
                  <i style={{ width: `${porcentaje}%` }} />
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "12px",
                fontSize: "13px",
                fontWeight: 750,
                color: "var(--muted)",
                borderTop: "1px solid var(--line)",
                paddingTop: "10px",
              }}
            >
              <span>👥 {participantes} participantes</span>
              <span>⭐ {misAciertos} aciertos tuyos</span>
            </div>
          </div>

          <button
            type="button"
            className="primary-button"
            onClick={manejarSalir}
            style={{ minWidth: "220px" }}
          >
            Salir de la sala
          </button>
        </main>
      </div>
    );
  }

  // Vista 3: Sala esperando inicio del docente
  if (estadoSala === "esperando") {
    return (
      <div className="shop-app" style={{ minHeight: "100vh" }}>
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
            <img src={MASCOT} alt="La mascota te espera" />
          </div>

          <div
            style={{
              fontSize: "13px",
              fontWeight: 800,
              background: "var(--green-light)",
              color: "var(--green)",
              padding: "4px 12px",
              borderRadius: "999px",
              margin: "8px 0",
            }}
          >
            Conectado a la sala {codigo}
          </div>

          <h1>¡Todo listo, {alumno.nombre}!</h1>
          <p style={{ maxWidth: "420px", color: "var(--muted)", fontWeight: 700, margin: "0 auto 16px" }}>
            Espera a que tu docente inicie la ronda en la pantalla grande.
          </p>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "#fffcf6",
              border: "1px solid var(--line)",
              padding: "8px 18px",
              borderRadius: "999px",
              fontWeight: 750,
              color: "var(--green)",
              marginBottom: "20px",
            }}
          >
            <span>👥</span>
            <span>{participantes} estudiantes en la sala</span>
          </div>

          <button
            type="button"
            className="text-button"
            onClick={manejarSalir}
          >
            Cambiar nombre / Salir
          </button>
        </main>
      </div>
    );
  }

  // Vista 4: Sala en pausa
  if (estadoSala === "pausada") {
    return (
      <div className="shop-app" style={{ minHeight: "100vh" }}>
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
            <img src={MASCOT} alt="" />
          </div>
          <h1>Una pequeña pausa</h1>
          <p style={{ maxWidth: "420px", color: "var(--muted)", fontWeight: 700, margin: "0 auto" }}>
            El docente ha pausado temporalmente la sala. En breve se reanudará la ronda.
          </p>
        </main>
      </div>
    );
  }

  // Vista 5: Sala jugando (Renderizado de MecanicaTienda sobre Phaser)
  return (
    <div className="shop-app" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#fbf7ef" }}>
      {/* Cabecera del juego del alumno con camión estilo tiendita */}
      <header
        className="shop-header"
        style={{
          minHeight: "64px",
          padding: "10px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          width: "min(1280px, 100%)",
          margin: "0 auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span
            style={{
              fontSize: "13px",
              fontWeight: 800,
              background: "var(--green-light)",
              color: "var(--green)",
              padding: "4px 12px",
              borderRadius: "999px",
            }}
          >
            Ronda {ronda.indice} / {ronda.total}
          </span>
          <span style={{ fontWeight: 800, fontSize: "15px", color: "var(--ink)" }}>{alumno.nombre}</span>
        </div>

        {/* Barra de progreso colectivo del camión estilo tiendita */}
        <div className={`truck-progress ${itemCompletado ? "box-loaded" : ""}`} style={{ minWidth: "180px" }}>
          <Camion lleno={progreso.actual > 0} />
          <div>
            <span>Reparto colectivo</span>
            <strong>
              {progreso.actual}
              <small> / {progreso.objetivo}</small>
            </strong>
            <div
              className="progress-track"
              role="progressbar"
              aria-label="Avance del reparto colectivo"
              aria-valuemin={0}
              aria-valuemax={progreso.objetivo}
              aria-valuenow={progreso.actual}
            >
              <i
                style={{
                  width: `${Math.min(progreso.actual / Math.max(1, progreso.objetivo), 1) * 100}%`,
                }}
              />
            </div>
          </div>
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
        }}
      >
        {/* Notificación cuando el alumno completa el ítem antes que el docente avance */}
        {itemCompletado && (
          <div
            style={{
              width: "100%",
              maxWidth: "860px",
              background: "var(--green-light)",
              border: "1px solid #92b8ac",
              borderRadius: "var(--radius)",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              margin: "0 0 12px",
              padding: "12px 18px",
              color: "var(--green)",
            }}
          >
            <span style={{ fontSize: "24px" }}>⭐</span>
            <div>
              <strong style={{ display: "block", fontSize: "15px" }}>¡Excelente trabajo! Has completado el ítem de esta ronda.</strong>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)" }}>
                Espera a que el docente avance la sala a la siguiente ronda.
              </p>
            </div>
          </div>
        )}

        {/* Alerta de fallback si no hay canvas o falló Phaser */}
        {(sinCanvas || errorPhaser) && (
          <div
            className="aviso aviso-error"
            role="alert"
            style={{
              width: "100%",
              maxWidth: "860px",
              borderRadius: "14px",
              padding: "16px",
              background: "#fff3ef",
              border: "1px solid #f0b8a7",
              marginBottom: "12px",
            }}
          >
            <strong>No se pudo cargar el lienzo gráfico (Canvas).</strong>
            <p style={{ margin: "4px 0" }}>
              {errorPhaser ??
                "Tu dispositivo o navegador no soporta aceleración gráfica WebGL/Canvas para mostrar el juego interactivo."}
            </p>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)" }}>
              Intenta abrir la sala desde otro navegador moderno (Chrome, Edge, Firefox, Safari).
            </p>
          </div>
        )}

        {/* Contenedor del juego de Phaser */}
        <div
          ref={contenedorRef}
          style={{
            width: "100%",
            maxWidth: "860px",
            aspectRatio: "4 / 3",
            margin: "0 auto",
            background: "#fbf7ef",
            borderRadius: "var(--radius)",
            border: "2px solid var(--line)",
            boxShadow: "0 10px 30px #49312614",
            overflow: "hidden",
            position: "relative",
            display: sinCanvas || errorPhaser ? "none" : "block",
          }}
        >
          <style>{`
            div[ref] canvas,
            canvas {
              width: 100% !important;
              height: 100% !important;
              display: block;
              touch-action: none;
            }
          `}</style>
        </div>

        <footer
          style={{
            width: "100%",
            maxWidth: "860px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "12px",
            fontSize: "12px",
            color: "var(--muted)",
            fontWeight: 750,
          }}
        >
          <span>
            Sala: <strong>{codigo}</strong> · Ronda actual: <code>{ronda.itemId}</code>
          </span>
          <button
            type="button"
            className="text-button"
            onClick={manejarSalir}
            style={{ minHeight: "36px", padding: "6px 12px" }}
          >
            Salir de la sala
          </button>
        </footer>
      </main>
    </div>
  );
}
