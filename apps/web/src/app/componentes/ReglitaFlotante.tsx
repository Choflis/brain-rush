import { useDialogo } from "../hooks/useDialogo";
import { useState, useRef, useEffect } from "react";
import { AvatarReglita } from "./AvatarReglita";
import { api } from "../api";

interface MensajeFlotante {
  id: string;
  remitente: "docente" | "reglita";
  texto: string;
  hora: string;
}

export function ReglitaFlotante() {
  const [abierto, setAbierto] = useState(false);
  const dialogo = useDialogo(abierto, () => setAbierto(false), false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const [mensajeInput, setMensajeInput] = useState("");
  const [escribiendo, setEscribiendo] = useState(false);
  const [mensajes, setMensajes] = useState<MensajeFlotante[]>([
    {
      id: "m-0",
      remitente: "reglita",
      texto:
        "¡Hola, profe! Soy Reglita. Estoy aquí para acompañarte en tu aula: sugerirte dinámicas de inicio, calibrar la dificultad de los juegos o darte pautas de refuerzo para tus estudiantes. ¿En qué te apoyo hoy?",
      hora: "Ahora",
    },
  ]);

  const contenedorMensajesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (abierto && contenedorMensajesRef.current) {
      contenedorMensajesRef.current.scrollTop = contenedorMensajesRef.current.scrollHeight;
    }
  }, [abierto, mensajes, escribiendo]);

  const sugerencias = [
    "¿Cómo inicio la clase con el juego de proyección?",
    "¿Qué dinámica rápida sugieres para cálculo mental?",
    "¿Cómo trabajar con estudiantes que van a su propio ritmo?",
    "Sugiéreme una pregunta de cierre para la sesión",
  ];

  const responderPregunta = (pregunta: string) => {
    const texto = pregunta.trim();
    if (!texto || escribiendo) return;

    const ahora = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const nuevoDocente: MensajeFlotante = {
      id: `doc-${Date.now()}`,
      remitente: "docente",
      texto,
      hora: ahora,
    };

    setMensajes((prev) => [...prev, nuevoDocente]);
    setMensajeInput("");
    setEscribiendo(true);

    const historialEnvio = mensajes.map((m) => ({
      remitente: m.remitente,
      texto: m.texto,
    }));

    api
      .chat(texto, historialEnvio)
      .then((res) => {
        const nuevaRespuesta: MensajeFlotante = {
          id: `reg-${Date.now()}`,
          remitente: "reglita",
          texto: res.respuesta,
          hora: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMensajes((prev) => [...prev, nuevaRespuesta]);
      })
      .catch(() => {
        // Fallback heurístico en caso de desconexión
        let respuesta = "";
        const lower = texto.toLowerCase();

        if (lower.includes("inicio") || lower.includes("proyección") || lower.includes("activación")) {
          respuesta =
            "Para los primeros 15 minutos, proyecta «La Tiendita» en la pizarra. Pide a 2 estudiantes voluntarios que salgan a la pantalla y al resto que indique con las manos cuántos productos faltan para llenar el camión. ¡Despierta la atención de inmediato y crea espíritu de equipo!";
        } else if (lower.includes("cálculo") || lower.includes("sumar") || lower.includes("números")) {
          respuesta =
            "Te sugiero la dinámica «Carrera relámpago»: antes de iniciar el juego en tablets, lanza un reto oral en la pizarra como: '¿Cuántos centímetros hay en 2 metros?'. El estudiante que responda elige la velocidad del corredor en el simulador.";
        } else if (lower.includes("ritmo") || lower.includes("apoyo") || lower.includes("refuerzo")) {
          respuesta =
            "En juegos individuales de complemento, activa 'Pistas visuales automáticas' tras el primer error. Así el estudiante no se frustra y asocia la cantidad con colores antes de pasar al siguiente nivel.";
        } else if (lower.includes("cierre") || lower.includes("pregunt")) {
          respuesta =
            "Una excelente pregunta metacognitiva de cierre: «¿Qué estrategia usaron para no equivocarse al clasificar los productos? ¿Qué aprendimos que podamos usar en el mercado de verdad?». Con 3 participaciones cierras la sesión con broche de oro.";
        } else {
          respuesta =
            `¡Excelente consulta, profe! Para «${texto}», te recomiendo vincularlo directamente con la evidencia de aprendizaje de tu sesión. Puedes usar la actividad en proyector como motivación inicial y dejar el juego individual para afianzar en parejas.`;
        }

        const nuevaRespuesta: MensajeFlotante = {
          id: `reg-${Date.now()}`,
          remitente: "reglita",
          texto: respuesta,
          hora: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMensajes((prev) => [...prev, nuevaRespuesta]);
      })
      .finally(() => {
        setEscribiendo(false);
      });
  };

  return (
    <div className="reglita-flotante-ancla">
      {/* Ventana de chat desplegable */}
      {abierto && (
        <div ref={dialogo} id="ayuda-reglita" className="reglita-tarjeta-flotante" role="dialog" aria-label="Asistente pedagógica Reglita">
          <header className="reglita-flotante-cabecera">
            <div className="reglita-cabecera-info">
              <AvatarReglita tamano={38} pensando={escribiendo} conBurbujaEstado={true} />
              <div>
                <strong>Reglita · Asistente Pedagógica</strong>
                <span className="estado-texto-online">Guía de aula · sugerencias de demostración</span>
              </div>
            </div>
            <button
              type="button"
              className="boton-cerrar-flotante"
              onClick={() => setAbierto(false)}
              aria-label="Cerrar asistente"
            >
              ✕
            </button>
          </header>

          <div className="reglita-flotante-cuerpo" ref={contenedorMensajesRef}>
            {mensajes.map((m) => (
              <div key={m.id} className={`flotante-burbuja flotante-burbuja-${m.remitente}`}>
                {m.remitente === "reglita" && <AvatarReglita tamano={22} />}
                <div className="flotante-texto-bloque">
                  <p>{m.texto}</p>
                  <span className="flotante-hora">{m.hora}</span>
                </div>
              </div>
            ))}

            {escribiendo && (
              <div className="flotante-burbuja flotante-burbuja-reglita">
                <AvatarReglita tamano={22} pensando={true} />
                <div className="flotante-texto-bloque">
                  <p className="escribiendo">
                    <span>.</span>
                    <span>.</span>
                    <span>.</span> Reglita está pensando...
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="reglita-flotante-sugerencias">
            <span className="sugerencias-rotulo">Consultas rápidas:</span>
            <div className="sugerencias-chips-flotante">
              {sugerencias.map((sug, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="chip-flotante"
                  onClick={() => responderPregunta(sug)}
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          <form
            className="reglita-flotante-form"
            onSubmit={(e) => {
              e.preventDefault();
              responderPregunta(mensajeInput);
            }}
          >
            <input
              type="text"
              aria-label="Consulta para Reglita"
              placeholder="Pregúntale a Reglita sobre tu clase..."
              value={mensajeInput}
              onChange={(e) => setMensajeInput(e.target.value)}
              disabled={escribiendo}
            />
            <button
              type="submit"
              className="boton-enviar-flotante"
              disabled={escribiendo || !mensajeInput.trim()}
              aria-label="Enviar consulta"
              title="Enviar consulta"
            >
              ➔
            </button>
          </form>
        </div>
      )}

      {/* Botón flotante permanente (FAB) */}
      <button
        type="button"
        className={`boton-fab-reglita ${abierto ? "fab-activo" : ""}`}
        onClick={() => setAbierto((prev) => !prev)}
        aria-label={abierto ? "Cerrar asistente Reglita" : "Abrir asistente pedagógica Reglita"}
        aria-expanded={abierto}
        aria-controls="ayuda-reglita"
        title="Asistente pedagógica Reglita"
      >
        <AvatarReglita tamano={42} conBurbujaEstado={!abierto} />
        {!abierto && <span className="fab-tooltip">¿Una consulta pedagógica?</span>}
      </button>
    </div>
  );
}
