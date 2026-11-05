import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { aulaVirtual, type JuegoAula, type SesionEstudio } from "../../datos/aulaVirtual";
import { EstadisticasModal } from "./EstadisticasModal";
import { PrevisualizadorModal } from "./PrevisualizadorModal";
import { IconoAnimado } from "../../componentes/IconoAnimado";

export function SesionDetalle() {
  const { id = "" } = useParams<{ id: string }>();
  const navegar = useNavigate();

  const [sesion, setSesion] = useState<SesionEstudio | undefined>(() =>
    aulaVirtual.obtenerSesionPorId(id)
  );

  const [juegoParaEstadisticas, setJuegoParaEstadisticas] = useState<JuegoAula | null>(null);
  const [juegoParaPrevisualizar, setJuegoParaPrevisualizar] = useState<JuegoAula | null>(null);

  if (!sesion) {
    return (
      <div className="aviso aviso-error">
        <h3>Sesión no encontrada</h3>
        <p>No se encontró la sesión de estudio con identificador «{id}».</p>
        <Link to="/docente/sesiones" className="boton boton-primario">
          Volver a mis sesiones
        </Link>
      </div>
    );
  }

  const juegos = aulaVirtual.obtenerJuegosPorSesion(sesion.id);

  const handleIniciarJuegoActivacion = (juego: JuegoAula) => {
    navegar(`/proyectar/${juego.codigo}`);
  };

  const resolverIconoJuego = (mecanica: string) => {
    if (mecanica === "tienda") return <IconoAnimado tipo="tienda" tamano={38} />;
    if (mecanica === "carrera") return <IconoAnimado tipo="carrera" tamano={38} />;
    return <IconoAnimado tipo="ecosistema" tamano={38} />;
  };

  return (
    <div className="sesion-detalle">
      {/* Migas de pan */}
      <nav className="migas-pan" aria-label="Navegación de migas">
        <Link to="/docente">Aula Virtual</Link>
        <span>›</span>
        <Link to="/docente/sesiones">Sesiones de Estudio</Link>
        <span>›</span>
        <span className="miga-activa">{sesion.titulo}</span>
      </nav>

      {/* Cabecera de la Sesión */}
      <header className="detalle-cabecera">
        <div>
          <div className="fila-etiquetas">
            <span className="pastilla pastilla-grado">{sesion.grado}.º Grado Primaria</span>
            <span className="pastilla pastilla-area">{sesion.area}</span>
          </div>
          <h1>{sesion.titulo}</h1>
          <p className="entradilla-suave">{sesion.proposito}</p>
        </div>
      </header>

      {/* Grid: Ficha Curricular y Momentos */}
      <div className="rejilla-dos-columnas">
        {/* Columna Izquierda: Ficha Curricular */}
        <div className="tarjeta">
          <div className="cabecera-tarjeta-flex">
            <h3>Alineación Curricular</h3>
          </div>
          <div className="campo-curricular">
            <span className="etiqueta-campo">Competencia:</span>
            <p>
              <strong>{sesion.competencia}</strong>
            </p>
          </div>

          <div className="campo-curricular">
            <span className="etiqueta-campo">Capacidad:</span>
            <p className="suave">{sesion.capacidad}</p>
          </div>

          <div className="campo-curricular">
            <span className="etiqueta-campo">Criterios de Evaluación:</span>
            <ul className="lista-criterios">
              {sesion.criterios.map((c) => (
                <li key={c.id}>
                  <strong className="criterio-badge">{c.id}</strong>
                  <span>{c.texto}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="campo-curricular">
            <span className="etiqueta-campo">Materiales y Recursos:</span>
            <div className="chips-materiales">
              {sesion.materiales.map((m, idx) => (
                <span key={idx} className="chip-material">
                  • {m}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Momentos Pedagógicos */}
        <div className="tarjeta">
          <div className="cabecera-tarjeta-flex">
            <h3>Momentos de la Sesión</h3>
          </div>
          <div className="momento-bloque">
            <span className="momento-titulo momento-inicio">1. Inicio · 15 min</span>
            <p className="suave">{sesion.momentos.inicio}</p>
          </div>
          <div className="momento-bloque">
            <span className="momento-titulo momento-desarrollo">2. Desarrollo · 60 min</span>
            <p className="suave">{sesion.momentos.desarrollo}</p>
          </div>
          <div className="momento-bloque">
            <span className="momento-titulo momento-cierre">3. Cierre · 15 min</span>
            <p className="suave">{sesion.momentos.cierre}</p>
          </div>
        </div>
      </div>

      {/* Sección de Videojuegos Creados */}
      <section className="seccion-juegos-creados">
        <div className="cabecera-seccion">
          <div>
            <h2>Actividades de Aprendizaje ({juegos.length})</h2>
          </div>
        </div>

        {juegos.length === 0 ? (
          <div className="aviso">
            <p>Aún no se han generado actividades para esta sesión.</p>
          </div>
        ) : (
          <div className="rejilla-tarjetas-juegos">
            {juegos.map((juego) => {
              const esActivacion = juego.tipo === "activacion";
              return (
                <article key={juego.id} className="tarjeta tarjeta-juego-docente">
                  <div className="juego-cabecera-tarjeta">
                    <span className="juego-icono-tarjeta">
                      {resolverIconoJuego(juego.mecanica)}
                    </span>
                    <div>
                      <div className="fila-etiquetas">
                        <span className={`pastilla pastilla-${juego.tipo}`}>
                          {esActivacion ? "Activación Colectiva en Pizarra" : "Práctica Individual"}
                        </span>
                      </div>
                      <h3>{juego.titulo}</h3>
                    </div>
                  </div>

                  <p className="juego-consigna">
                    <strong>Consigna:</strong> {juego.consignaDocente}
                  </p>

                  {/* Resumen Diferenciado de Métricas: Colectivo vs Individual */}
                  {esActivacion ? (
                    <>
                      <div className="resumen-kpis-mini kpis-activacion-colectiva">
                        <div className="mini-kpi">
                          <span>Meta del Salón</span>
                          <strong className="texto-verde">
                            {juego.estadisticas.colectiva
                              ? `${juego.estadisticas.colectiva.actualCamion} / ${juego.estadisticas.colectiva.objetivoCamion} canastas`
                              : "Completada"}
                          </strong>
                        </div>
                        <div className="mini-kpi">
                          <span>Conectados</span>
                          <strong>
                            {juego.estadisticas.colectiva?.dispositivosConectados ??
                              juego.estadisticas.alumnos} en aula
                          </strong>
                        </div>
                        <div className="mini-kpi">
                          <span>Rondas</span>
                          <strong>
                            {juego.estadisticas.colectiva?.rondasSuperadas ?? 12}
                          </strong>
                        </div>
                      </div>

                      <div className="juego-acciones-tarjeta">
                        <button
                          type="button"
                          className="boton boton-primario boton-con-icono boton-destacado-docente"
                          onClick={() => handleIniciarJuegoActivacion(juego)}
                        >
                          <IconoAnimado tipo="proyeccion" tamano={20} /> Proyectar en la Pizarra
                        </button>
                        <button
                          type="button"
                          className="boton boton-fantasma"
                          onClick={() => setJuegoParaPrevisualizar(juego)}
                        >
                          Ajustar con Reglita
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="resumen-kpis-mini">
                        <div className="mini-kpi">
                          <span>Logro del Salón</span>
                          <strong>{juego.estadisticas.tasaLogro}%</strong>
                        </div>
                        <div className="mini-kpi">
                          <span>Estudiantes</span>
                          <strong>{juego.estadisticas.alumnos}</strong>
                        </div>
                        <div className="mini-kpi">
                          <span>Requieren Apoyo</span>
                          <strong
                            className={
                              juego.estadisticas.riesgo.length > 0 ? "texto-alerta" : ""
                            }
                          >
                            {juego.estadisticas.riesgo.length} alumnos
                          </strong>
                        </div>
                      </div>

                      <div className="juego-acciones-tarjeta">
                        <button
                          type="button"
                          className="boton boton-primario boton-con-icono"
                          onClick={() => setJuegoParaEstadisticas(juego)}
                        >
                          <IconoAnimado tipo="metricas" tamano={18} /> Ver Desempeño y Criterios
                        </button>
                        <button
                          type="button"
                          className="boton boton-fantasma"
                          onClick={() => setJuegoParaPrevisualizar(juego)}
                        >
                          Probar y Ajustar
                        </button>
                      </div>
                    </>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Modales */}
      {juegoParaEstadisticas && (
        <EstadisticasModal
          juego={juegoParaEstadisticas}
          onCerrar={() => setJuegoParaEstadisticas(null)}
        />
      )}

      {juegoParaPrevisualizar && (
        <PrevisualizadorModal
          juego={juegoParaPrevisualizar}
          onCerrar={() => setJuegoParaPrevisualizar(null)}
          onJuegoActualizado={(actualizado) => {
            setSesion(aulaVirtual.obtenerSesionPorId(id));
            setJuegoParaPrevisualizar(actualizado);
          }}
        />
      )}
    </div>
  );
}
