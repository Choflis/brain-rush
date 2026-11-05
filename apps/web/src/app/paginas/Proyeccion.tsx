import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  api,
  ErrorApi,
  type EstadoSalaNombre,
  type EventoSala,
  type Progreso,
} from "../api";
import { useSesion } from "../sesion";

export function Proyeccion() {
  const params = useParams<{ codigo: string }>();
  const codigo = (params.codigo ?? "").toUpperCase();

  const { sesion, iniciarDocente } = useSesion();
  const esDocente = Boolean(sesion && (sesion.rol === "docente" || sesion.token === "demo-docente"));

  // Estado de la sala
  const [estadoSala, setEstadoSala] = useState<EstadoSalaNombre>("esperando");
  const [ronda, setRonda] = useState<{ indice: number; total: number; itemId: string }>({
    indice: 1,
    total: 12,
    itemId: "f1",
  });
  const [progreso, setProgreso] = useState<Progreso>({ actual: 0, objetivo: 12 });
  const [participantes, setParticipantes] = useState(0);
  const [eventos, setEventos] = useState<EventoSala[]>([]);

  // Estados de control docente
  const [accionEnCurso, setAccionEnCurso] = useState<string | null>(null);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  const ultimoSeqRef = useRef<number>(0);

  // Polling del estado cada 1,5 segundos
  useEffect(() => {
    if (!codigo) return;
    if (!esDocente || !sesion) return;
    if (estadoSala === "terminada") return;

    let activo = true;

    const consultar = async () => {
      try {
        const datos = await api.estadoSala(codigo, ultimoSeqRef.current, sesion.token);
        if (!activo) return;

        setErrorCarga(null);
        setEstadoSala(datos.estado);
        setRonda(datos.ronda);
        setProgreso(datos.progreso);
        setParticipantes(datos.participantes);
        ultimoSeqRef.current = datos.seq;

        if (datos.eventos && datos.eventos.length > 0) {
          setEventos((prev) => {
            const nuevos = datos.eventos.filter((ne) => !prev.some((pe) => pe.seq === ne.seq));
            // Mantener hasta los 25 eventos más recientes
            return [...nuevos, ...prev].slice(0, 25);
          });
        }
      } catch (err) {
        if (!activo) return;
        if (err instanceof ErrorApi) {
          if (err.estado === 404) {
            setErrorCarga("La sala no existe o el código es incorrecto.");
          } else if (err.estado === 401 || err.estado === 403) {
            setErrorCarga("No autorizado para consultar la sala. Inicia sesión como docente.");
          }
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
  }, [codigo, esDocente, sesion, estadoSala]);

  // Acciones del docente
  const manejarAvanzar = async (siguienteRonda: number) => {
    if (!sesion) return;
    setAccionEnCurso("avanzando");
    setErrorAccion(null);
    try {
      const res = await api.avanzarSala(codigo, siguienteRonda, sesion.token);
      setEstadoSala(res.estado);
      setRonda(res.ronda);
      ultimoSeqRef.current = res.seq;
    } catch (err) {
      setErrorAccion(
        err instanceof ErrorApi ? err.message : "No se pudo avanzar a la ronda solicitada.",
      );
    } finally {
      setAccionEnCurso(null);
    }
  };

  const manejarCerrar = async () => {
    if (!sesion) return;
    const seguro = window.confirm(
      "¿Estás seguro de que deseas cerrar la sala? Los alumnos verán la pantalla de resultados finales.",
    );
    if (!seguro) return;

    setAccionEnCurso("cerrando");
    setErrorAccion(null);
    try {
      const res = await api.cerrarSala(codigo, sesion.token);
      setEstadoSala(res.estado);
      setParticipantes(res.participantes);
      ultimoSeqRef.current = res.seq;
    } catch (err) {
      setErrorAccion(err instanceof ErrorApi ? err.message : "No se pudo cerrar la sala.");
    } finally {
      setAccionEnCurso(null);
    }
  };

  const porcentaje = Math.min(
    100,
    Math.round((progreso.actual / Math.max(1, progreso.objetivo)) * 100),
  );
  const metaCumplida = progreso.actual >= progreso.objetivo;

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "1rem 0 3rem",
      }}
    >
      {/* Banner de inicio de sesión si no hay sesión docente */}
      {!esDocente && (
        <div
          className="aviso"
          style={{
            background: "#fff9e6",
            borderColor: "#ffe082",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
            marginBottom: "1.5rem",
          }}
        >
          <div>
            <strong>Pantalla de proyección para el aula</strong>
            <p style={{ margin: 0, fontSize: "0.95rem", color: "var(--tinta-suave)" }}>
              Para proyectar en vivo y usar los controles del docente, inicia sesión con el usuario
              demo.
            </p>
          </div>
          <button
            type="button"
            className="boton boton-primario"
            onClick={() => iniciarDocente()}
            style={{ fontWeight: 800 }}
          >
            Entrar como docente
          </button>
        </div>
      )}

      {errorCarga && (
        <div className="aviso aviso-error" role="alert" style={{ marginBottom: "1.5rem" }}>
          <strong>Error en la proyección:</strong>
          <p style={{ margin: "0.25rem 0 0" }}>{errorCarga}</p>
        </div>
      )}

      {/* Tarjeta principal de proyección */}
      <section
        className="tarjeta"
        style={{
          padding: "clamp(1.5rem, 4vw, 2.5rem)",
          background: "var(--papel-alto)",
          boxShadow: "var(--sombra)",
          borderRadius: "24px",
          border: "2px solid var(--linea)",
        }}
      >
        {/* Fila superior: Código de sala y enlace de unión */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "1.5rem",
            borderBottom: "2px solid var(--linea)",
            paddingBottom: "1.5rem",
          }}
        >
          <div>
            <span className="etiqueta" style={{ fontSize: "0.85rem", letterSpacing: "0.1em" }}>
              Activación en el aula · Proyección
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "1rem", flexWrap: "wrap" }}>
              <h1
                style={{
                  fontSize: "clamp(2.5rem, 6vw, 4.2rem)",
                  letterSpacing: "0.08em",
                  margin: "0.2rem 0",
                  color: "var(--naranja)",
                }}
              >
                {codigo}
              </h1>
              <span
                className={`pastilla pastilla-${estadoSala === "jugando" ? "publicado" : "borrador"}`}
                style={{ fontSize: "1.05rem", padding: "0.4rem 1rem", textTransform: "uppercase" }}
              >
                {estadoSala === "esperando"
                  ? "Esperando alumnos"
                  : estadoSala === "jugando"
                    ? "En curso"
                    : estadoSala === "pausada"
                      ? "Pausada"
                      : "Terminada"}
              </span>
            </div>
            <p
              style={{
                fontSize: "clamp(1.1rem, 2.2vw, 1.4rem)",
                fontWeight: 600,
                color: "var(--tinta-suave)",
                margin: "0.4rem 0 0",
              }}
            >
              Únete desde tu celular entrando a:{" "}
              <strong style={{ color: "var(--verde)" }}>
                /s/{codigo}
              </strong>
            </p>
          </div>

          <div style={{ textAlign: "right", minWidth: "160px" }}>
            <div style={{ fontSize: "2.4rem", fontWeight: 800, color: "var(--tinta)" }}>
              👥 {participantes}
            </div>
            <div style={{ color: "var(--tinta-suave)", fontSize: "0.95rem", fontWeight: 600 }}>
              {participantes === 1 ? "alumno conectado" : "alumnos conectados"}
            </div>
          </div>
        </div>

        {/* Fila intermedia: Meta Colectiva del Camión de la tiendita */}
        <div style={{ margin: "2rem 0" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "0.5rem",
              marginBottom: "0.8rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
              <span style={{ fontSize: "2.5rem" }}>🚚</span>
              <div>
                <h2 style={{ margin: 0, fontSize: "clamp(1.4rem, 3vw, 1.9rem)" }}>
                  Meta colectiva: El camión de la tiendita
                </h2>
                <span className="suave" style={{ fontSize: "0.95rem" }}>
                  Progreso conjunto de todas las respuestas del aula
                </span>
              </div>
            </div>

            <div style={{ fontSize: "1.4rem", fontWeight: 800 }}>
              <span style={{ color: metaCumplida ? "var(--verde)" : "var(--naranja)" }}>
                {progreso.actual}
              </span>
              <span style={{ color: "var(--tinta-suave)" }}> / {progreso.objetivo}</span>
              <span style={{ fontSize: "1.1rem", color: "var(--tinta-suave)", marginLeft: "0.4rem" }}>
                ({porcentaje}%)
              </span>
            </div>
          </div>

          {/* Barra de progreso gigante para proyección */}
          <div
            style={{
              width: "100%",
              height: "36px",
              background: "#ede7d9",
              borderRadius: "999px",
              padding: "4px",
              overflow: "hidden",
              boxShadow: "inset 0 2px 4px rgba(0,0,0,0.08)",
            }}
          >
            <div
              style={{
                width: `${porcentaje}%`,
                height: "100%",
                background: metaCumplida
                  ? "linear-gradient(90deg, #2e7d32, #4caf50)"
                  : "linear-gradient(90deg, #f26a3d, #ffa726)",
                borderRadius: "999px",
                transition: "width 0.4s ease-out",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                paddingRight: "8px",
              }}
            >
              {porcentaje > 12 && (
                <span
                  style={{
                    color: "#ffffff",
                    fontWeight: 800,
                    fontSize: "0.85rem",
                    textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                  }}
                >
                  {porcentaje}%
                </span>
              )}
            </div>
          </div>

          {metaCumplida && (
            <div
              style={{
                marginTop: "1rem",
                padding: "0.8rem 1.4rem",
                background: "#e8f5e9",
                border: "2px solid #81c784",
                borderRadius: "14px",
                color: "#1b5e20",
                fontWeight: 700,
                fontSize: "1.15rem",
                textAlign: "center",
              }}
            >
              🎉 ¡Excelente! ¡El camión ha alcanzado la meta colectiva de la clase! 🚚
            </div>
          )}
        </div>

        {/* Fila inferior dividida: Ronda actual y Registro de eventos en vivo */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "1.5rem",
            marginTop: "2rem",
            paddingTop: "1.5rem",
            borderTop: "2px solid var(--linea)",
          }}
        >
          {/* Tarjeta de Ronda Actual */}
          <div
            style={{
              background: "var(--papel)",
              padding: "1.5rem",
              borderRadius: "18px",
              border: "1px solid var(--linea)",
            }}
          >
            <span className="etiqueta" style={{ marginBottom: "0.4rem" }}>
              Estado del juego
            </span>
            <h3 style={{ fontSize: "1.6rem", margin: "0.2rem 0" }}>
              {estadoSala === "esperando"
                ? "Por iniciar"
                : estadoSala === "terminada"
                  ? "Actividad completada"
                  : `Ronda ${ronda.indice} de ${ronda.total}`}
            </h3>
            <p className="suave" style={{ margin: "0.4rem 0 1rem" }}>
              Ítem activo en dispositivos: <code>{ronda.itemId || "—"}</code>
            </p>

            <div style={{ fontSize: "0.95rem", color: "var(--tinta-suave)" }}>
              {estadoSala === "esperando" && (
                <p style={{ margin: 0 }}>
                  Los estudiantes están entrando a la sala. Haz clic en "Iniciar actividad" para
                  comenzar la primera ronda.
                </p>
              )}
              {estadoSala === "jugando" && (
                <p style={{ margin: 0 }}>
                  Todos los alumnos están resolviendo el ítem de la ronda {ronda.indice}. Avanza de
                  ronda cuando la mayoría haya completado su intento.
                </p>
              )}
              {estadoSala === "terminada" && (
                <p style={{ margin: 0 }}>
                  La sala ha concluido. Los intentos individuales han quedado guardados y listos en
                  el panel docente.
                </p>
              )}
            </div>
          </div>

          {/* Tarjeta de Eventos Recientes (sin datos personales) */}
          <div
            style={{
              background: "var(--papel)",
              padding: "1.5rem",
              borderRadius: "18px",
              border: "1px solid var(--linea)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.8rem",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "1.2rem" }}>Eventos recientes</h3>
              <span className="pastilla" style={{ fontSize: "0.78rem" }}>
                En vivo · Anónimo
              </span>
            </div>

            <div
              style={{
                flex: 1,
                maxHeight: "220px",
                overflowY: "auto",
                display: "grid",
                gap: "0.5rem",
                paddingRight: "0.4rem",
              }}
            >
              {eventos.length === 0 ? (
                <p className="suave" style={{ fontSize: "0.92rem", margin: "auto 0" }}>
                  Esperando actividad en la sala…
                </p>
              ) : (
                eventos.map((e) => (
                  <div
                    key={e.seq}
                    style={{
                      background: "var(--papel-alto)",
                      padding: "0.55rem 0.85rem",
                      borderRadius: "10px",
                      fontSize: "0.9rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.6rem",
                      border: "1px solid var(--linea)",
                    }}
                  >
                    <span>
                      {e.tipo === "union" && "👥"}
                      {e.tipo === "acierto" && "⭐"}
                      {e.tipo === "meta" && "🚚"}
                      {e.tipo === "ronda" && "➡️"}
                      {e.tipo === "fin" && "🏁"}
                    </span>
                    <span style={{ flex: 1 }}>
                      {e.tipo === "union" && "Un estudiante se unió a la sala"}
                      {e.tipo === "acierto" &&
                        `Acierto en ítem "${e.itemId ?? ""}" (+1 al camión)`}
                      {e.tipo === "meta" && "¡Meta colectiva alcanzada por el aula!"}
                      {e.tipo === "ronda" && `Avanzó a la ronda ${e.actual ?? ""}`}
                      {e.tipo === "fin" && "La sala ha sido cerrada"}
                    </span>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--tinta-suave)",
                        fontFamily: "monospace",
                      }}
                    >
                      #{e.seq}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Panel de control del docente */}
        {esDocente && (
          <div
            style={{
              marginTop: "2rem",
              paddingTop: "1.5rem",
              borderTop: "2px solid var(--linea)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "1rem",
              }}
            >
              <div>
                <h4 style={{ margin: 0, fontSize: "1.1rem" }}>Controles del docente</h4>
                <p className="suave" style={{ margin: "0.2rem 0 0", fontSize: "0.9rem" }}>
                  Gestiona el flujo del aula en tiempo real.
                </p>
              </div>

              <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
                {estadoSala === "esperando" && (
                  <button
                    type="button"
                    className="boton boton-primario boton-grande"
                    onClick={() => void manejarAvanzar(1)}
                    disabled={accionEnCurso !== null}
                  >
                    {accionEnCurso === "avanzando" ? "Iniciando…" : "🚀 Iniciar actividad (Ronda 1)"}
                  </button>
                )}

                {estadoSala === "jugando" && (
                  <>
                    <button
                      type="button"
                      className="boton boton-primario boton-grande"
                      onClick={() => void manejarAvanzar(ronda.indice + 1)}
                      disabled={accionEnCurso !== null || ronda.indice >= ronda.total}
                    >
                      {accionEnCurso === "avanzando"
                        ? "Avanzando…"
                        : ronda.indice >= ronda.total
                          ? "Última ronda alcanzada"
                          : `Avanzar a ronda ${ronda.indice + 1}`}
                    </button>

                    <button
                      type="button"
                      className="boton boton-fantasma"
                      onClick={() => void manejarCerrar()}
                      disabled={accionEnCurso !== null}
                      style={{ color: "#d32f2f", borderColor: "#ffcdd2" }}
                    >
                      {accionEnCurso === "cerrando" ? "Cerrando…" : "Cerrar sala"}
                    </button>
                  </>
                )}

                {estadoSala === "terminada" && (
                  <Link to="/docente" className="boton boton-primario">
                    Ver resultados en panel docente
                  </Link>
                )}
              </div>
            </div>

            {errorAccion && (
              <div
                className="aviso aviso-error"
                role="alert"
                style={{ marginTop: "1rem", marginBottom: 0 }}
              >
                {errorAccion}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
