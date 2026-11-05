import { useState } from "react";
import { Link } from "react-router-dom";
import { aulaVirtual, type SesionEstudio } from "../../datos/aulaVirtual";
import { IconoAnimado } from "../../componentes/IconoAnimado";
import { AvatarReglita } from "../../componentes/AvatarReglita";

interface MensajeChatSubida {
  id: string;
  remitente: "docente" | "ia";
  texto: string;
}

export function SesionesLista() {
  const [sesiones, setSesiones] = useState<SesionEstudio[]>(() => aulaVirtual.obtenerSesiones());
  const [modalAbierto, setModalAbierto] = useState(false);

  // Formulario de nueva sesión
  const [titulo, setTitulo] = useState("");
  const [grado, setGrado] = useState(1);
  const [area, setArea] = useState("Matemática");
  const [competencia, setCompetencia] = useState("Resuelve problemas de cantidad");
  const [proposito, setProposito] = useState("");
  const [archivoNombre, setArchivoNombre] = useState<string | null>(null);

  // Asistente Reglita para la subida
  const [mensajesChat, setMensajesChat] = useState<MensajeChatSubida[]>([
    {
      id: "ia-init",
      remitente: "ia",
      texto: "¡Hola, profe! Soy Reglita 📏. Sube tu sesión de aprendizaje y cuéntame si deseas priorizar algún enfoque específico (ej. cálculo mental rápido, andamiaje visual, material concreto o retos progresivos).",
    },
  ]);
  const [inputChat, setInputChat] = useState("");
  const [procesandoIA, setProcesandoIA] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const enviarIndicacionIA = (e: React.FormEvent) => {
    e.preventDefault();
    const txt = inputChat.trim();
    if (!txt || procesandoIA) return;

    setMensajesChat((prev) => [
      ...prev,
      { id: `doc-${Date.now()}`, remitente: "docente", texto: txt },
    ]);
    setInputChat("");
    setProcesandoIA(true);

    setTimeout(() => {
      let respuesta = "";
      const lower = txt.toLowerCase();
      if (lower.includes("mercado") || lower.includes("tienda") || lower.includes("comprar")) {
        respuesta = "¡Excelente idea pedagógica, profe! Configuraré la dinámica de la tiendita con productos contextualizados y conteo guiado.";
      } else if (lower.includes("carrera") || lower.includes("velocidad") || lower.includes("saltar")) {
        respuesta = "¡Muy motivador para los niños! Prepararé la carrera interactiva con retos de conversión métrica para abrir puertas.";
      } else if (lower.includes("naturaleza") || lower.includes("ecología") || lower.includes("ambiente")) {
        respuesta = "¡Enfoque muy significativo! Diseñaré la actividad enfocada en el equilibrio de seres vivos y el cuidado ambiental.";
      } else {
        respuesta = `¡Entendido, profesor! Ajustaré la curva de dificultad y los apoyos visuales para responder a «${txt}».`;
      }

      setMensajesChat((prev) => [
        ...prev,
        { id: `ia-${Date.now()}`, remitente: "ia", texto: respuesta },
      ]);
      setProcesandoIA(false);
    }, 500);
  };

  const handleSimularArchivo = (nombre: string) => {
    setArchivoNombre(nombre);
    if (!titulo) {
      if (nombre.includes("fracciones")) setTitulo("Descubrimos las fracciones con alimentos");
      else if (nombre.includes("geometria")) setTitulo("Cuerpos geométricos en nuestro entorno");
      else setTitulo("Sesión de aprendizaje interactiva");
    }
    if (!proposito) {
      setProposito("Desarrollar comprensión significativa a través de la resolución colaborativa de problemas.");
    }
  };

  const guardarNuevaSesion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;

    setGuardando(true);
    setTimeout(() => {
      aulaVirtual.crearSesion(
        {
          titulo,
          grado: Number(grado),
          area,
          competencia,
          proposito,
          archivoNombre: archivoNombre || "sesion-docente.pdf",
        },
        mensajesChat.filter((m) => m.remitente === "docente").map((m) => m.texto).join(" | ")
      );

      setSesiones(aulaVirtual.obtenerSesiones());
      setGuardando(false);
      setModalAbierto(false);
      // Reset
      setTitulo("");
      setProposito("");
      setArchivoNombre(null);
      setMensajesChat([
        {
          id: "ia-init",
          remitente: "ia",
          texto: "¡Hola, docente! Sube el archivo de tu sesión y dime si tienes indicaciones especiales para el videojuego.",
        },
      ]);
    }, 600);
  };

  return (
    <div className="sesiones-contenedor">
      <header className="panel-subcabecera">
        <div>
          <h1>Sesiones de Aprendizaje</h1>
          <p className="suave">
            Sube tus sesiones oficiales en PDF o DOCX y transfórmalas en videojuegos educativos alineados al CNEB.
          </p>
        </div>
        <button
          type="button"
          className="boton boton-primario boton-con-icono"
          onClick={() => setModalAbierto(true)}
        >
          <IconoAnimado tipo="documento" tamano={18} /> Subir Nueva Sesión
        </button>
      </header>

      {/* Lista de Sesiones */}
      <div className="rejilla-sesiones">
        {sesiones.map((sesion) => {
          const juegos = aulaVirtual.obtenerJuegosPorSesion(sesion.id);
          const juegoActivacion = juegos.find((j) => j.tipo === "activacion");

          return (
            <article key={sesion.id} className="tarjeta tarjeta-sesion">
              <div className="sesion-tarjeta-cabecera">
                <span className="pastilla pastilla-grado">{sesion.grado}.º Grado</span>
                <span className="pastilla pastilla-area">{sesion.area}</span>
              </div>

              <h3>{sesion.titulo}</h3>
              <p className="sesion-competencia">
                <strong>Competencia:</strong> {sesion.competencia}
              </p>
              <p className="sesion-proposito suave">{sesion.proposito}</p>

              <div className="sesion-juegos-resumen">
                <span className="etiqueta-chica">Actividades interactivas ({juegos.length}):</span>
                <div className="chips-juegos">
                  {juegos.map((j) => (
                    <span key={j.id} className={`chip-juego chip-${j.tipo}`}>
                      {j.tipo === "activacion" ? "Activación en Pizarra" : "Práctica Individual"} · {j.titulo}
                    </span>
                  ))}
                </div>
              </div>

              <div className="sesion-acciones-doble">
                <Link
                  to={`/docente/sesiones/${sesion.id}`}
                  className="boton boton-primario"
                >
                  Abrir Sesión
                </Link>
                {juegoActivacion && (
                  <Link
                    to={`/proyectar/${juegoActivacion.codigo}`}
                    className="boton boton-secundario boton-con-icono"
                    title="Iniciar proyección colectiva en pantalla de clase"
                  >
                    <IconoAnimado tipo="proyeccion" tamano={16} /> Proyectar
                  </Link>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {/* Modal / Drawer para Subir Nueva Sesión con Chat de IA */}
      {modalAbierto && (
        <div className="modal-telon" role="dialog" aria-modal="true" onClick={() => setModalAbierto(false)}>
          <div
            className="modal-contenido modal-ancho modal-subida-sesion"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="modal-cabecera">
              <div>
                <h2>Subir Nueva Sesión de Aprendizaje</h2>
                <p className="suave">
                  Sube el documento curricular para extraer automáticamente competencias y generar actividades para tu salón.
                </p>
              </div>
              <button
                type="button"
                className="boton-cerrar"
                onClick={() => setModalAbierto(false)}
              >
                ✕
              </button>
            </header>

            <div className="subida-grid">
              {/* Formulario de Metadatos */}
              <form className="formulario-sesion" onSubmit={guardarNuevaSesion}>
                {/* Zona de Subida de Archivos */}
                <div className="zona-dropzone">
                  <IconoAnimado tipo="documento" tamano={40} />
                  <strong>{archivoNombre ? `Archivo: ${archivoNombre}` : "Arrastra tu sesión en PDF o DOCX"}</strong>
                  <p className="suave-chico">
                    El sistema extraerá automáticamente el propósito, competencias y criterios pedagógicos.
                  </p>
                  <div className="archivos-ejemplo">
                    <span>O simula con una sesión de ejemplo:</span>
                    <button
                      type="button"
                      className="boton-archivo-ejemplo"
                      onClick={() => handleSimularArchivo("primer-grado-u1-s9.pdf")}
                    >
                      primer-grado-u1-s9.pdf
                    </button>
                    <button
                      type="button"
                      className="boton-archivo-ejemplo"
                      onClick={() => handleSimularArchivo("11 MAT UNIDADES DE LONGITUD.docx")}
                    >
                      11 MAT UNIDADES DE LONGITUD.docx
                    </button>
                    <button
                      type="button"
                      className="boton-archivo-ejemplo"
                      onClick={() => handleSimularArchivo("Sesion_CyT_5to_Ciclo_V_Ecosistemas.docx")}
                    >
                      Sesion_CyT_5to_Ciclo_V_Ecosistemas.docx
                    </button>
                  </div>
                </div>

                <div className="campo">
                  <label htmlFor="input-titulo">Título de la Sesión</label>
                  <input
                    id="input-titulo"
                    type="text"
                    required
                    placeholder="Ej. Resolvemos problemas de compras con fracciones"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                  />
                </div>

                <div className="fila-dos-campos">
                  <div className="campo">
                    <label htmlFor="select-grado">Grado de Primaria</label>
                    <select
                      id="select-grado"
                      value={grado}
                      onChange={(e) => setGrado(Number(e.target.value))}
                    >
                      <option value={1}>1.º Grado</option>
                      <option value={2}>2.º Grado</option>
                      <option value={3}>3.º Grado</option>
                      <option value={4}>4.º Grado</option>
                      <option value={5}>5.º Grado</option>
                      <option value={6}>6.º Grado</option>
                    </select>
                  </div>

                  <div className="campo">
                    <label htmlFor="select-area">Área Curricular</label>
                    <select
                      id="select-area"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                    >
                      <option value="Matemática">Matemática</option>
                      <option value="Ciencia y Tecnología">Ciencia y Tecnología</option>
                      <option value="Comunicación">Comunicación</option>
                      <option value="Personal Social">Personal Social</option>
                    </select>
                  </div>
                </div>

                <div className="campo">
                  <label htmlFor="input-competencia">Competencia CNEB</label>
                  <input
                    id="input-competencia"
                    type="text"
                    value={competencia}
                    onChange={(e) => setCompetencia(e.target.value)}
                  />
                </div>

                <div className="campo">
                  <label htmlFor="input-proposito">Propósito Pedagógico</label>
                  <textarea
                    id="input-proposito"
                    rows={2}
                    placeholder="¿Qué aprenderán los estudiantes en esta sesión?"
                    value={proposito}
                    onChange={(e) => setProposito(e.target.value)}
                  />
                </div>

                <footer className="form-pie">
                  <button
                    type="button"
                    className="boton boton-fantasma"
                    onClick={() => setModalAbierto(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="boton boton-primario"
                    disabled={guardando || !titulo.trim()}
                  >
                    {guardando ? "Generando actividades..." : "Crear Actividades"}
                  </button>
                </footer>
              </form>

              {/* Chat de Reglita para la Creación del Videojuego */}
              <aside className="chat-subida-lateral">
                <div className="chat-subida-cabecera">
                  <AvatarReglita tamano={38} pensando={procesandoIA} conBurbujaEstado={true} />
                  <div>
                    <h4>Reglita · Copiloto de Creación</h4>
                    <p className="suave-chico">Tu asistente pedagógica en tiempo real</p>
                  </div>
                </div>

                <div className="chat-subida-mensajes">
                  {mensajesChat.map((m) => (
                    <div key={m.id} className={`burbuja-contenedor burbuja-${m.remitente}`}>
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
                    </div>
                  ))}
                  {procesandoIA && (
                    <div className="burbuja-contenedor burbuja-ia">
                      <div className="burbuja-ia-con-reglita">
                        <AvatarReglita tamano={24} pensando={true} />
                        <div className="burbuja-ia-contenido">
                          <span className="nombre-reglita-chat">Reglita</span>
                          <div className="burbuja-texto escribiendo">
                            <span>.</span><span>.</span><span>.</span> Reglita está pensando...
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="sugerencias-subida">
                  <span className="sugerencias-titulo">💡 Enfoques pedagógicos sugeridos:</span>
                  <div className="chips-subida">
                    <button
                      type="button"
                      className="chip-subida"
                      onClick={() => setInputChat("Priorizar cálculo mental rápido y apoyo visual para cantidades")}
                    >
                      Cálculo mental guiado
                    </button>
                    <button
                      type="button"
                      className="chip-subida"
                      onClick={() => setInputChat("Enfócate en la conversión de metros a centímetros")}
                    >
                      Conversión métrica
                    </button>
                    <button
                      type="button"
                      className="chip-subida"
                      onClick={() => setInputChat("Activar pistas visuales y tiempo adaptativo para que nadie se frustre")}
                    >
                      Pistas adaptativas
                    </button>
                  </div>
                </div>

                <form className="chat-subida-input" onSubmit={enviarIndicacionIA}>
                  <input
                    type="text"
                    placeholder="Escribe un enfoque pedagógico para tus alumnos..."
                    value={inputChat}
                    onChange={(e) => setInputChat(e.target.value)}
                    disabled={procesandoIA}
                  />
                  <button
                    type="submit"
                    className="boton boton-primario boton-sm"
                    disabled={procesandoIA || !inputChat.trim()}
                  >
                    Enviar
                  </button>
                </form>
              </aside>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
