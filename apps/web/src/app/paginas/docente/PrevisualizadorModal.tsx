import { useDialogo } from "../../hooks/useDialogo";
import { useEffect, useRef, useState } from "react";
import { aulaVirtual, type JuegoAula } from "../../datos/aulaVirtual";
import { IconoAnimado } from "../../componentes/IconoAnimado";
import { AvatarReglita } from "../../componentes/AvatarReglita";

interface Props {
  juego: JuegoAula;
  onCerrar: () => void;
  onJuegoActualizado?: (juego: JuegoAula) => void;
}

interface MensajeChat {
  id: string;
  remitente: "docente" | "ia";
  texto: string;
  hora: string;
}

export function PrevisualizadorModal({ juego: juegoInicial, onCerrar, onJuegoActualizado }: Props) {
  const dialogo = useDialogo(true, onCerrar);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [error, setError] = useState("");
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const [juego, setJuego] = useState<JuegoAula>(juegoInicial);
  const [mensajes, setMensajes] = useState<MensajeChat[]>(() => {
    const base: MensajeChat[] = [
      {
        id: "msg-0",
        remitente: "ia",
        texto: `¡Hola, profe! Soy Reglita. Estoy lista para refinar «${juegoInicial.titulo}» (v${juegoInicial.versionActual}). Cuéntame qué cambios te gustaría probar en el juego: ¿ajustar la velocidad, dar más tiempo, agregar pistas visuales o calibrar los retos? Podemos revisar propuestas de ajuste en esta demostración.`,
        hora: "Ahora",
      },
    ];

    if (juegoInicial.historialCambiosIA) {
      juegoInicial.historialCambiosIA.forEach((h, i) => {
        base.push({
          id: `hist-doc-${i}`,
          remitente: "docente",
          texto: h.instruccion,
          hora: "Anterior",
        });
        base.push({
          id: `hist-ia-${i}`,
          remitente: "ia",
          texto: h.respuesta,
          hora: "Anterior",
        });
      });
    }

    return base;
  });

  const [inputDocente, setInputDocente] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [recargarKey, setRecargarKey] = useState(0);

  const sugerencias = [
    "Aumenta la velocidad de Reglita al correr",
    "Agrega una pista visual tras el primer error",
    "Añade números decimales en dificultad avanzada",
    "Haz que la meta colectiva sea de 10 productos",
  ];

  const enviarMensaje = (textoPrompt: string) => {
    const texto = textoPrompt.trim();
    if (!texto || enviando) return;

    const ahora = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const nuevoMensajeDocente: MensajeChat = {
      id: `doc-${Date.now()}`,
      remitente: "docente",
      texto,
      hora: ahora,
    };

    setMensajes((prev) => [...prev, nuevoMensajeDocente]);
    setInputDocente("");
    setEnviando(true);

    setError("");
    timer.current = setTimeout(() => {
      try {
        const { respuestaIA, juegoActualizado } = aulaVirtual.refinarJuegoConIA(juego.id, texto);
        setJuego(juegoActualizado);
        if (onJuegoActualizado) onJuegoActualizado(juegoActualizado);

        const nuevoMensajeIA: MensajeChat = {
          id: `ia-${Date.now()}`,
          remitente: "ia",
          texto: respuestaIA,
          hora: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };

        setMensajes((prev) => [...prev, nuevoMensajeIA]);
        setRecargarKey((k) => k + 1);
      } catch (err) {
        setError("No pudimos guardar el ajuste. Vuelve a intentarlo.");
      } finally {
        setEnviando(false);
      }
    }, 600);
  };

  // URL del simulador según la mecánica
  const obtenerUrlJuego = () => {
    if (juego.codigo === "TIENDA" || juego.codigo === "TIENDA-C") {
      return `/tiendita.html?preview=true&v=${juego.versionActual}&k=${recargarKey}`;
    }
    if (juego.codigo === "CARRERA") {
      return `/j/CARRERA?preview=true&v=${juego.versionActual}&k=${recargarKey}`;
    }
    return `/docs/examples/EcoAventura_3D_Rescatemos_nuestro_Recreo.html?v=${juego.versionActual}&k=${recargarKey}`;
  };

  return (
    <div ref={dialogo} className="modal-telon modal-telon-completo" role="dialog" aria-modal="true" aria-label={`Previsualizar ${juego.titulo}`}>
      <div className="modal-previsualizador">
        <header className="previsualizador-cabecera">
          <div className="cabecera-info">
            <IconoAnimado tipo={juego.mecanica as any} tamano={34} />
            <div>
              <div className="fila-etiquetas">
                <span className={`pastilla pastilla-${juego.tipo}`}>
                  {juego.tipo === "activacion" ? "Activación Colectiva en Pizarra" : "Práctica Individual"}
                </span>
              </div>
              <h3>{juego.titulo}</h3>
            </div>
          </div>

          <div className="cabecera-acciones">
            <button
              type="button"
              className="boton boton-fantasma boton-sm"
              onClick={() => setRecargarKey((k) => k + 1)}
              title="Reiniciar simulador"
            >
              Reiniciar juego
            </button>
            <button
              type="button"
              className="boton-cerrar"
              onClick={onCerrar}
              aria-label="Cerrar previsualizador"
            >
              ✕ Cerrar
            </button>
          </div>
        </header>

        <div className="previsualizador-cuerpo">
          {/* Lado izquierdo: Pantalla de Juego */}
          <div className="previsualizador-pantalla">
            <iframe
              key={recargarKey}
              src={obtenerUrlJuego()}
              title={`Simulador de ${juego.titulo}`}
              className="iframe-juego"
              allow="autoplay; fullscreen"
            />
          </div>

          {/* Lado derecho: Chat con IA para Refinamiento */}
          <aside className="chat-ia-panel">
            <header className="chat-ia-cabecera">
              <AvatarReglita tamano={38} pensando={enviando} conBurbujaEstado={true} />
              <div>
                <h4>Reglita · Copiloto de Refinamiento</h4>
                <p className="suave-chico">Itera y refina las reglas del juego en vivo</p>
              </div>
            </header>

            <div className="chat-ia-mensajes">
              {mensajes.map((m) => (
                <div
                  key={m.id}
                  className={`burbuja-contenedor burbuja-${m.remitente}`}
                >
                  {m.remitente === "ia" ? (
                    <div className="burbuja-ia-con-reglita">
                      <AvatarReglita tamano={24} />
                      <div className="burbuja-ia-contenido">
                        <span className="nombre-reglita-chat">Reglita</span>
                        <div className="burbuja-texto">{m.texto}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="burbuja-texto">{m.texto}</div>
                  )}
                  <span className="burbuja-hora">{m.hora}</span>
                </div>
              ))}
              {enviando && (
                <div className="burbuja-contenedor burbuja-ia">
                  <div className="burbuja-ia-con-reglita">
                    <AvatarReglita tamano={24} pensando={true} />
                    <div className="burbuja-ia-contenido">
                      <span className="nombre-reglita-chat">Reglita</span>
                      <div className="burbuja-texto escribiendo">
                        <span>.</span><span>.</span><span>.</span> Ajustando GameSpec...
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sugerencias Rápidas */}
            <div className="chat-ia-sugerencias">
              <span className="sugerencias-titulo">💡 Sugerencias rápidas:</span>
              <div className="sugerencias-chips">
                {sugerencias.map((sug, i) => (
                  <button
                    key={i}
                    type="button"
                    className="chip-sugerencia"
                    onClick={() => enviarMensaje(sug)}
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>

            {error && <p role="alert" className="docente-error">{error}</p>}
            <form
              className="chat-ia-formulario"
              onSubmit={(e) => {
                e.preventDefault();
                enviarMensaje(inputDocente);
              }}
            >
              <input
                type="text"
                aria-label="Instrucción para Reglita"
                placeholder="Escribe una instrucción para la IA..."
                value={inputDocente}
                onChange={(e) => setInputDocente(e.target.value)}
                disabled={enviando}
              />
              <button
                type="submit"
                className="boton boton-primario"
                disabled={enviando || !inputDocente.trim()}
              >
                Enviar
              </button>
            </form>
          </aside>
        </div>
      </div>
    </div>
  );
}
