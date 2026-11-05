import { useAulaVirtual } from "../../datos/useAulaVirtual";
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { aulaVirtual } from "../../datos/aulaVirtual";
import { IconoAnimado } from "../../componentes/IconoAnimado";
import { useDialogo } from "../../hooks/useDialogo";
import { IconoDocente } from "../../componentes/IconoDocente";
import { InsigniaSalon } from "../../componentes/IlustracionesInfantiles";
import { AvatarReglita } from "../../componentes/AvatarReglita";
import { api } from "../../api";

interface MensajeChatSubida {
  id: string;
  remitente: "docente" | "ia";
  texto: string;
}

export function SesionesLista() {
  const { sesiones } = useAulaVirtual();
  const [params, setParams] = useSearchParams();
  const [modalAbierto, setModalAbierto] = useState(params.get('nueva') === '1');
  const [vista, setVista] = useState('grilla');
  const filtroGrado = params.get('grado') || 'todos';
  function setFiltroGrado(grado: string) { setParams(prev => { const next = new URLSearchParams(prev); if (grado === 'todos') next.delete('grado'); else next.set('grado', grado); return next; }, { replace: true }); }
  const [aviso, setAviso] = useState('');
  const [errorArchivo, setErrorArchivo] = useState('');
  const guardarTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chatTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busqueda = params.get('buscar') || '';
  const dialogo = useDialogo(modalAbierto, cerrarSubida);
  useEffect(() => { if (params.get('nueva') === '1') setModalAbierto(true); }, [params]);
  useEffect(() => () => { if (guardarTimer.current) clearTimeout(guardarTimer.current); if (chatTimer.current) clearTimeout(chatTimer.current); }, []);
  function cerrarSubida() {
    if (guardarTimer.current) clearTimeout(guardarTimer.current);
    if (chatTimer.current) clearTimeout(chatTimer.current);
    setGuardando(false); setProcesandoIA(false); setModalAbierto(false);
    setParams(prev => { const next = new URLSearchParams(prev); next.delete('nueva'); return next; }, { replace: true });
  }
  function elegirArchivo(file?: File) {
    if (!file) return;
    if (!/\.(pdf|docx|txt)$/i.test(file.name)) {
      setErrorArchivo('Elige un documento PDF o DOCX.');
      return;
    }
    setErrorArchivo('');
    setArchivoNombre(file.name);
    setArchivoFile(file);
    if (!titulo.trim()) {
      setTitulo(file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '));
    }

    setProcesandoIA(true);
    setMensajesChat((prev) => [
      ...prev,
      {
        id: `ia-proc-${Date.now()}`,
        remitente: "ia",
        texto: `📄 Leyendo «${file.name}» con Mistral para identificar competencias, criterios y propósitos CNEB...`,
      },
    ]);

    api
      .extraerPdf(file)
      .then((res) => {
        if (res.sesion) {
          if (res.sesion.titulo) setTitulo(res.sesion.titulo);
          if (res.sesion.grado) setGrado(res.sesion.grado);
          if (res.sesion.area) setArea(res.sesion.area);
          if (res.sesion.competencia) setCompetencia(res.sesion.competencia);
          if (res.sesion.proposito) setProposito(res.sesion.proposito);
          setSesionExtraida(res.sesion);

          setMensajesChat((prev) => [
            ...prev,
            {
              id: `ia-res-${Date.now()}`,
              remitente: "ia",
              texto: `¡Listo, profe! Extraje la sesión «${res.sesion.titulo}» (${res.sesion.grado}.° grado) con ${res.sesion.criterios?.length || 1} criterios formativos CNEB. ¿Deseas priorizar algún enfoque antes de generar el juego?`,
            },
          ]);
        }
      })
      .catch(() => {
        setMensajesChat((prev) => [
          ...prev,
          {
            id: `ia-res-${Date.now()}`,
            remitente: "ia",
            texto: `Documento «${file.name}» preparado. Puedes afinar los campos del formulario y pulsar "Crear Actividades" para generar el videojuego interactivo con Reglita.`,
          },
        ]);
      })
      .finally(() => {
        setProcesandoIA(false);
      });
  }
  const sesionesVisibles = sesiones.filter(s => (filtroGrado === 'todos' || s.grado === Number(filtroGrado)) && `${s.titulo} ${s.area} ${s.competencia}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').includes(busqueda.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es')));


  // Formulario de nueva sesión
  const [titulo, setTitulo] = useState("");
  const [grado, setGrado] = useState(1);
  const [area, setArea] = useState("Matemática");
  const [competencia, setCompetencia] = useState("Resuelve problemas de cantidad");
  const [proposito, setProposito] = useState("");
  const [archivoNombre, setArchivoNombre] = useState<string | null>(null);
  const [archivoFile, setArchivoFile] = useState<File | null>(null);
  const [sesionExtraida, setSesionExtraida] = useState<any | null>(null);

  // Asistente Reglita para la subida
  const [mensajesChat, setMensajesChat] = useState<MensajeChatSubida[]>([
    {
      id: "ia-init",
      remitente: "ia",
      texto: "¡Hola, profe! Soy Reglita. Sube tu sesión de aprendizaje en PDF o DOCX y cuéntame si deseas priorizar algún enfoque específico (ej. cálculo mental rápido, andamiaje visual, material concreto o retos progresivos).",
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

    api
      .chat(
        `El docente está subiendo una sesión de ${area} para ${grado}.° de primaria y da esta indicación pedagógica: "${txt}". Responde brevemente como Reglita qué dinámica o mecánica aplicarás en el videojuego.`,
        mensajesChat.map((m) => ({ remitente: m.remitente, texto: m.texto }))
      )
      .then((res) => {
        setMensajesChat((prev) => [
          ...prev,
          { id: `ia-${Date.now()}`, remitente: "ia", texto: res.respuesta },
        ]);
      })
      .catch(() => {
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
      })
      .finally(() => {
        setProcesandoIA(false);
      });
  };

  const handleSimularArchivo = (nombre: string) => {
    setArchivoNombre(nombre);
    setArchivoFile(null);
    if (nombre.includes("primer-grado-u1-s9")) {
      setTitulo("Elaboran el cartel con los precios de los productos y sus nombres");
      setGrado(1);
      setArea("Matemática");
      setCompetencia("Resuelve problemas de cantidad");
      setProposito("Aprenderán a organizar productos de una tienda, elaborar carteles con sus precios y clasificarlos según su categoría.");
      setMensajesChat((prev) => [
        ...prev,
        {
          id: `ia-${Date.now()}`,
          remitente: "ia",
          texto: "¡Sesión oficial de 1.° de primaria cargada! Adaptaremos «La Tiendita del Aula» con conteo guiado y meta colectiva en camión.",
        },
      ]);
    } else if (nombre.includes("UNIDADES DE LONGITUD")) {
      setTitulo("Unidades de Longitud: múltiplos y conversiones en el patio");
      setGrado(3);
      setArea("Matemática");
      setCompetencia("Resuelve problemas de forma, movimiento y localización");
      setProposito("Medir longitudes y realizar conversiones entre metros, decímetros y centímetros usando la escalera métrica.");
      setMensajesChat((prev) => [
        ...prev,
        {
          id: `ia-${Date.now()}`,
          remitente: "ia",
          texto: "¡Sesión de 3.° de primaria cargada! Configuraremos «La Carrera del Patio» con retos de conversión usando ×10 y ÷10.",
        },
      ]);
    } else {
      setTitulo("Ecosistemas y relaciones tróficas en nuestra comunidad");
      setGrado(5);
      setArea("Ciencia y Tecnología");
      setCompetencia("Explica el mundo físico basándose en conocimientos sobre los seres vivos");
      setProposito("Identificar los niveles tróficos y las cadenas alimenticias en los ecosistemas locales.");
      setMensajesChat((prev) => [
        ...prev,
        {
          id: `ia-${Date.now()}`,
          remitente: "ia",
          texto: "¡Sesión de 5.° de primaria cargada! Prepararemos «EcoAventura» con exploración de hábitats y cadenas tróficas.",
        },
      ]);
    }
  };

  const guardarNuevaSesion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;

    setGuardando(true);
    const enfoqueDocente = mensajesChat
      .filter((m) => m.remitente === "docente")
      .map((m) => m.texto)
      .join(" | ");

    try {
      let resultadoJuego;
      if (archivoFile) {
        resultadoJuego = await api.generarDesdePdf(archivoFile, enfoqueDocente);
      } else {
        const sesionDatos = sesionExtraida || {
          titulo,
          grado: Number(grado),
          area,
          competencia,
          proposito,
          criterios: [
            { id: "C1", texto: proposito || "Demuestra comprensión del contenido formativo" },
          ],
        };
        resultadoJuego = await api.generarDesdeSesion(sesionDatos, enfoqueDocente);
      }

      if (resultadoJuego?.spec) {
        aulaVirtual.crearSesion(
          {
            titulo: resultadoJuego.spec.titulo || titulo,
            grado: Number(grado),
            area,
            competencia,
            proposito,
            archivoNombre: archivoNombre || "sesion-docente.pdf",
            criterios: resultadoJuego.spec.criterios,
            codigo: resultadoJuego.codigo,
            juegoId: resultadoJuego.juegoId,
            mecanica: resultadoJuego.spec.mecanica,
            tipo: resultadoJuego.spec.tipo,
          },
          enfoqueDocente,
        );

        setAviso(`¡Videojuego «${resultadoJuego.spec.titulo}» generado con éxito! Código: ${resultadoJuego.codigo}`);
        cerrarSubida();
        setTitulo("");
        setProposito("");
        setArchivoNombre(null);
        setArchivoFile(null);
        setSesionExtraida(null);
        return;
      }
    } catch (err) {
      console.warn("Fallo en generación por API, usando fallback local:", err);
      const codigoFallback = `JUEGO-${Math.floor(1000 + Math.random() * 9000)}`;
      aulaVirtual.crearSesion(
        {
          titulo,
          grado: Number(grado),
          area,
          competencia,
          proposito,
          archivoNombre: archivoNombre || "sesion-docente.pdf",
          codigo: codigoFallback,
          mecanica: Number(grado) <= 2 ? "tienda" : "carrera",
        },
        enfoqueDocente,
      );
      setAviso(`Sesión «${titulo}» guardada (Código: ${codigoFallback}).`);
      cerrarSubida();
      setTitulo("");
      setProposito("");
      setArchivoNombre(null);
      setArchivoFile(null);
      setSesionExtraida(null);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="sesiones-contenedor">
      <header className="panel-subcabecera">
        <div>
          <p className="docente-kicker">DE TU PLANIFICACIÓN A LA AVENTURA</p><h1>Sesiones de Aprendizaje</h1>
          <p className="suave">
            Organiza tus sesiones, explora sus actividades y prepara el siguiente descubrimiento de tu clase.
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

      <p className="docente-confirmacion" role="status">{aviso}</p>
      <div className="docente-filtros">
        <label className="docente-campo-buscar"><IconoDocente tipo="buscar" tamano={18} /><input aria-label="Buscar sesiones" placeholder="Título, área o competencia…" value={busqueda} onChange={e => setParams(prev => { const next = new URLSearchParams(prev); if (e.target.value) next.set('buscar', e.target.value); else next.delete('buscar'); return next; }, { replace: true })} /></label>
        <select aria-label="Filtrar por grado" value={filtroGrado} onChange={e => setFiltroGrado(e.target.value)}><option value="todos">Todos los grados</option>{[1, 2, 3, 4, 5, 6].map(g => <option key={g} value={g}>{g}.º de primaria</option>)}</select>
        <span className="docente-resultados" role="status">{sesionesVisibles.length} sesiones</span>
        <div className="docente-vistas" role="group" aria-label="Vista de sesiones"><button type="button" aria-label="Vista de cuadrícula" aria-pressed={vista === 'grilla'} onClick={() => setVista('grilla')}><IconoDocente tipo="grilla" /></button><button type="button" aria-label="Vista de lista" aria-pressed={vista === 'lista'} onClick={() => setVista('lista')}><IconoDocente tipo="lista" /></button></div>
      </div>
      {sesionesVisibles.length === 0 && <div className="tarjeta docente-vacio"><IconoDocente tipo="buscar" tamano={32} /><h3>No encontramos sesiones con estos filtros.</h3><button type="button" className="boton boton-fantasma" onClick={() => { setParams({}); }}>Limpiar filtros</button></div>}
      {/* Lista de Sesiones */}
      <div className={`rejilla-sesiones ${vista === "lista" ? "sesiones-vista-lista" : ""}`}>
        {sesionesVisibles.map((sesion) => {
          const juegos = aulaVirtual.obtenerJuegosPorSesion(sesion.id);
          const juegoActivacion = juegos.find((j) => j.tipo === "activacion");

          return (
            <article key={sesion.id} className="tarjeta tarjeta-sesion">
              <div className="sesion-tarjeta-cabecera"><InsigniaSalon grado={sesion.grado} tamano={42} />
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
        <div ref={dialogo} className="modal-telon" role="dialog" aria-modal="true" aria-labelledby="titulo-subir-sesion" onClick={cerrarSubida}>
          <div
            className="modal-contenido modal-ancho modal-subida-sesion"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="modal-cabecera">
              <div>
                <span className="docente-kicker">PREPARA TU PRÓXIMA CLASE</span><h2 id="titulo-subir-sesion">Subir Nueva Sesión de Aprendizaje</h2>
                <p className="suave">
                  Adjunta tu referencia y completa la información de tu sesión. Esta es una preparación de demostración, guardada en este navegador.
                </p>
              </div>
              <button
                type="button"
                className="boton-cerrar"
                aria-label="Cerrar nueva sesión"
                onClick={cerrarSubida}
              >
                ✕
              </button>
            </header>

            <div className="subida-grid">
              {/* Formulario de Metadatos */}
              <form className="formulario-sesion" onSubmit={guardarNuevaSesion}>
                {/* Zona de Subida de Archivos */}
                <div className="zona-dropzone" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); elegirArchivo(e.dataTransfer.files[0]); }}>
                  <IconoAnimado tipo="documento" tamano={40} />
                  <strong>{archivoNombre ? `Archivo: ${archivoNombre}` : "Arrastra aquí tu documento de referencia"}</strong>
                  <p className="suave-chico">
                    Usa un PDF o DOCX como referencia y revisa los campos antes de guardar.
                  </p>
                  <label className="docente-elegir-archivo">Elegir PDF o DOCX<input type="file" accept=".pdf,.docx" aria-label="Documento de la sesión" onChange={e => elegirArchivo(e.target.files?.[0])} /></label>
                  {errorArchivo && <p role="alert" className="docente-error">{errorArchivo}</p>}
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
                    onClick={cerrarSubida}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="boton boton-primario"
                    disabled={guardando || !titulo.trim()}
                  >
                    {guardando ? "Generando videojuego con Mistral AI…" : "Guardar y Generar Videojuegos"}
                  </button>
                </footer>
              </form>

              {/* Chat de Reglita para la Creación del Videojuego */}
              <aside className="chat-subida-lateral">
                <div className="chat-subida-cabecera">
                  <AvatarReglita tamano={38} pensando={procesandoIA} conBurbujaEstado={true} />
                  <div>
                    <h4>Reglita · Copiloto de Creación</h4>
                    <p className="suave-chico">Sugerencias pedagógicas de demostración</p>
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
                  <span className="sugerencias-titulo">Enfoques pedagógicos sugeridos:</span>
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
                    aria-label="Enfoque pedagógico"
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
