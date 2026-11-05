import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import type { GameSpec } from "@brain-rush/gamespec";
import { api, ErrorApi, type EstadoSalaNombre, type Progreso } from "../api";
import { MecanicaTienda } from "../../../../../packages/engine/src/tienda.ts";
import { EmisorEventosMotor, type EventoMotor } from "../../../../../packages/engine/src/eventos.ts";
import Phaser from "phaser";
import specTiendaDefault from "../../../../../fixtures/juegos/n1-tienda.json";

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
      <div className="centrado">
        <section className="tarjeta tarjeta-login" style={{ maxWidth: "420px", width: "100%" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="etiqueta">Sala de activación</span>
            <span className="pastilla pastilla-publicado" style={{ fontWeight: 800 }}>
              {codigo}
            </span>
          </div>

          <h1 style={{ marginTop: "0.5rem" }}>Únete al juego</h1>
          <p className="suave">
            Ingresa tu nombre o el de tu equipo para participar desde este dispositivo.
          </p>

          {errorUnirse && (
            <div className="aviso aviso-error" role="alert" style={{ margin: "1rem 0" }}>
              <strong>No se pudo ingresar:</strong>
              <p style={{ margin: "0.25rem 0 0" }}>{errorUnirse}</p>
            </div>
          )}

          <form onSubmit={manejarUnirse}>
            <div style={{ marginBottom: "1.2rem" }}>
              <label
                htmlFor="nombre-alumno"
                style={{ display: "block", fontWeight: 700, marginBottom: "0.4rem" }}
              >
                Tu nombre o apodo
              </label>
              <input
                id="nombre-alumno"
                type="text"
                value={nombreForm}
                onChange={(e) => setNombreForm(e.target.value)}
                placeholder="Ejemplo: Sofía o Equipo 3"
                maxLength={40}
                required
                autoFocus
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  fontSize: "1.05rem",
                  borderRadius: "12px",
                  border: "2px solid var(--linea)",
                  background: "var(--papel-alto)",
                  fontFamily: "inherit",
                }}
              />
            </div>

            <button
              type="submit"
              className="boton boton-primario boton-grande boton-ancho"
              disabled={uniendo || !nombreForm.trim()}
            >
              {uniendo ? "Uniéndose a la sala…" : "Entrar a la sala"}
            </button>
          </form>

          <small className="suave" style={{ display: "block", marginTop: "1rem" }}>
            La sala es colectiva: los nombres no se mostrarán en la proyección pública.
          </small>
        </section>
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
      <div className="centrado">
        <section
          className="tarjeta"
          style={{ maxWidth: "520px", width: "100%", textAlign: "center", padding: "2.5rem 1.8rem" }}
        >
          <div style={{ fontSize: "3.5rem", marginBottom: "0.5rem" }}>
            {metaLograda ? "🏆🚚" : "🎉"}
          </div>
          <span className="etiqueta">Actividad finalizada</span>
          <h1 style={{ marginTop: "0.4rem" }}>
            {metaLograda ? "¡Meta colectiva completada!" : "¡Buen trabajo en el aula!"}
          </h1>

          <p className="suave" style={{ fontSize: "1.1rem" }}>
            ¡Gracias por participar, <strong>{alumno.nombre}</strong>! La sala{" "}
            <code>{codigo}</code> ha finalizado.
          </p>

          <div
            style={{
              background: "var(--verde-claro)",
              borderRadius: "16px",
              padding: "1.4rem",
              margin: "1.5rem 0",
              textAlign: "left",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontWeight: 700,
                marginBottom: "0.4rem",
              }}
            >
              <span>🚚 Carga del camión</span>
              <span>
                {progreso.actual} / {progreso.objetivo} ({porcentaje}%)
              </span>
            </div>

            <div
              style={{
                width: "100%",
                height: "16px",
                background: "#ffffff",
                borderRadius: "999px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${porcentaje}%`,
                  height: "100%",
                  background: metaLograda ? "var(--verde)" : "var(--naranja)",
                  borderRadius: "999px",
                  transition: "width 0.4s ease",
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "1rem",
                fontSize: "0.95rem",
                color: "var(--tinta-suave)",
              }}
            >
              <span>👥 {participantes} participantes</span>
              <span>⭐ {misAciertos} aciertos tuyos</span>
            </div>
          </div>

          <button
            type="button"
            className="boton boton-primario boton-grande boton-ancho"
            onClick={manejarSalir}
          >
            Salir de la sala
          </button>
        </section>
      </div>
    );
  }

  // Vista 3: Sala esperando inicio del docente
  if (estadoSala === "esperando") {
    return (
      <div className="centrado">
        <section
          className="tarjeta"
          style={{ maxWidth: "460px", width: "100%", textAlign: "center", padding: "2.2rem 1.6rem" }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>🎒</div>
          <span className="etiqueta">Conectado a la sala</span>
          <h1 style={{ marginTop: "0.4rem" }}>¡Todo listo, {alumno.nombre}!</h1>
          <p className="suave">
            Estás conectado a la sala <strong>{codigo}</strong>. Espera a que el docente inicie la
            primera ronda en la proyección.
          </p>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "var(--verde-claro)",
              padding: "0.6rem 1.2rem",
              borderRadius: "999px",
              fontWeight: 700,
              color: "var(--verde)",
              margin: "1.2rem 0",
            }}
          >
            <span style={{ fontSize: "1.2rem" }}>👥</span>
            <span>{participantes} estudiantes en la sala</span>
          </div>

          <div style={{ marginTop: "1rem" }}>
            <button
              type="button"
              className="boton boton-fantasma"
              onClick={manejarSalir}
              style={{ fontSize: "0.9rem" }}
            >
              Cambiar nombre / Salir
            </button>
          </div>
        </section>
      </div>
    );
  }

  // Vista 4: Sala en pausa
  if (estadoSala === "pausada") {
    return (
      <div className="centrado">
        <section
          className="tarjeta"
          style={{ maxWidth: "460px", width: "100%", textAlign: "center", padding: "2.5rem 1.8rem" }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>⏸️</div>
          <span className="etiqueta">Pausa</span>
          <h1>Actividad en pausa</h1>
          <p className="suave">
            El docente ha pausado temporalmente la sala. En breve se reanudará la ronda.
          </p>
        </section>
      </div>
    );
  }

  // Vista 5: Sala jugando (Renderizado de MecanicaTienda sobre Phaser)
  const pctCamion = Math.min(
    100,
    Math.round((progreso.actual / Math.max(1, progreso.objetivo)) * 100),
  );

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0.5rem 0" }}>
      {/* Cabecera del juego del alumno */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.8rem",
          background: "var(--papel-alto)",
          padding: "0.8rem 1.2rem",
          borderRadius: "16px",
          border: "1px solid var(--linea)",
          marginBottom: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
          <span
            className="pastilla pastilla-publicado"
            style={{ fontSize: "0.95rem", padding: "0.3rem 0.8rem" }}
          >
            Ronda {ronda.indice} / {ronda.total}
          </span>
          <span style={{ fontWeight: 700, color: "var(--tinta)" }}>{alumno.nombre}</span>
        </div>

        {/* Barra de progreso colectivo del camión */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span style={{ fontSize: "1.3rem" }}>🚚</span>
          <div
            style={{
              width: "120px",
              height: "14px",
              background: "#eeeeee",
              borderRadius: "999px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${pctCamion}%`,
                height: "100%",
                background: pctCamion >= 100 ? "var(--verde)" : "var(--naranja)",
                borderRadius: "999px",
                transition: "width 0.3s ease",
              }}
            />
          </div>
          <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--tinta-suave)" }}>
            {progreso.actual}/{progreso.objetivo}
          </span>
        </div>
      </header>

      {/* Notificación cuando el alumno completa el ítem antes que el docente avance */}
      {itemCompletado && (
        <div
          className="aviso"
          style={{
            background: "#e8f5e9",
            borderColor: "#81c784",
            display: "flex",
            alignItems: "center",
            gap: "0.8rem",
            margin: "0 0 1rem",
            padding: "0.8rem 1.2rem",
          }}
        >
          <span style={{ fontSize: "1.5rem" }}>⭐</span>
          <div>
            <strong>¡Excelente trabajo! Has completado el ítem de esta ronda.</strong>
            <p style={{ margin: 0, fontSize: "0.92rem", color: "var(--tinta-suave)" }}>
              Espera a que el docente avance la sala a la siguiente ronda.
            </p>
          </div>
        </div>
      )}

      {/* Alerta de fallback si no hay canvas o falló Phaser */}
      {(sinCanvas || errorPhaser) && (
        <div className="aviso aviso-error" role="alert" style={{ marginBottom: "1rem" }}>
          <strong>No se pudo cargar el lienzo gráfico (Canvas).</strong>
          <p>
            {errorPhaser ??
              "Tu dispositivo o navegador no soporta aceleración gráfica WebGL/Canvas para mostrar el juego interactivo."}
          </p>
          <p className="suave" style={{ margin: 0, fontSize: "0.9rem" }}>
            Intenta abrir la sala desde otro navegador moderno (Chrome, Edge, Firefox, Safari) o
            activa la aceleración por hardware.
          </p>
        </div>
      )}

      {/* Contenedor del juego de Phaser */}
      <div
        ref={contenedorRef}
        style={{
          width: "100%",
          maxWidth: "800px",
          aspectRatio: "4 / 3",
          margin: "0 auto",
          background: "#ffffff",
          borderRadius: "18px",
          border: "2px solid var(--linea)",
          boxShadow: "var(--sombra)",
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
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "1rem",
          fontSize: "0.85rem",
          color: "var(--tinta-suave)",
        }}
      >
        <span>
          Sala: <strong>{codigo}</strong> · Ítem actual: <code>{ronda.itemId}</code>
        </span>
        <button
          type="button"
          className="boton boton-fantasma"
          onClick={manejarSalir}
          style={{ fontSize: "0.8rem", padding: "0.3rem 0.8rem", minHeight: "32px" }}
        >
          Salir
        </button>
      </footer>
    </div>
  );
}
