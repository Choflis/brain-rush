import { useState } from "react";
import { Link } from "react-router-dom";
import { aulaVirtual } from "../../datos/aulaVirtual";
import { IconoAnimado } from "../../componentes/IconoAnimado";

export function DashboardDocente() {
  const [metricas] = useState(() => aulaVirtual.obtenerMetricasGlobales());
  const [clases] = useState(() => aulaVirtual.obtenerClases());
  const [estado] = useState(() => aulaVirtual.obtenerTodo());

  const alumnosEnRiesgo = estado.estudiantes.filter((e) => e.estado === "en_riesgo");
  const ultimosIntentos = estado.historial.slice(0, 5);

  return (
    <div className="dashboard-docente">
      <header className="panel-subcabecera">
        <div>
          <h1>Panel del Docente</h1>
          <p className="suave">
            Seguimiento de aprendizajes por salón, resultados formativos y estudiantes que requieren apoyo.
          </p>
        </div>
        <div className="acciones-cabecera">
          <Link to="/proyectar/TIENDA" className="boton boton-secundario boton-con-icono">
            <IconoAnimado tipo="proyeccion" tamano={18} /> Proyectar en Aula
          </Link>
          <Link to="/docente/sesiones" className="boton boton-primario">
            + Subir Sesión
          </Link>
        </div>
      </header>

      {/* Tarjetas KPI Superiores */}
      <div className="kpis-grilla kpis-docente">
        <div className="kpi-tarjeta">
          <IconoAnimado tipo="documento" tamano={34} />
          <div>
            <span className="kpi-numero">{metricas.totalSesiones}</span>
            <span className="kpi-etiqueta">Sesiones Activas</span>
          </div>
        </div>

        <div className="kpi-tarjeta">
          <IconoAnimado tipo="estudiante" tamano={34} />
          <div>
            <span className="kpi-numero">{metricas.totalEstudiantes}</span>
            <span className="kpi-etiqueta">Estudiantes Matriculados</span>
          </div>
        </div>

        <div className="kpi-tarjeta kpi-destacado">
          <IconoAnimado tipo="metricas" tamano={34} />
          <div>
            <span className="kpi-numero">{metricas.promedioLogroGlobal}%</span>
            <span className="kpi-etiqueta">Logro Promedio</span>
          </div>
        </div>

        <div className={`kpi-tarjeta ${metricas.alumnosEnRiesgo > 0 ? "kpi-alerta" : ""}`}>
          <div className="kpi-icono-alerta">!</div>
          <div>
            <span className="kpi-numero">{metricas.alumnosEnRiesgo}</span>
            <span className="kpi-etiqueta">Requieren Apoyo Hoy</span>
          </div>
        </div>
      </div>

      {/* Grid: Aulas Virtuales y Alumnos en Riesgo */}
      <div className="rejilla-dos-columnas">
        {/* Columna 1: Rendimiento por Aulas */}
        <section className="tarjeta">
          <div className="cabecera-tarjeta-flex">
            <h3>Salones a tu Cargo</h3>
            <Link to="/docente/clases" className="enlace-accion">
              Gestionar salones ➔
            </Link>
          </div>

          <div className="lista-clases-dashboard">
            {clases.map((clase) => {
              const sesion = aulaVirtual.obtenerSesionPorId(clase.sesionPrincipalId);
              const estudiantes = aulaVirtual.obtenerEstudiantesPorClase(clase.id);
              const suma = estudiantes.reduce((acc, e) => acc + e.promedioAciertos, 0);
              const promedio = Math.round(suma / (estudiantes.length || 1));
              const riesgoEnClase = estudiantes.filter((e) => e.estado === "en_riesgo").length;

              return (
                <div key={clase.id} className="item-clase-dashboard">
                  <div className="clase-dashboard-header">
                    <span className="avatar-aula">{clase.icono}</span>
                    <div className="clase-dashboard-titulos">
                      <strong>{clase.nombre}</strong>
                      <span className="suave-chico">
                        {estudiantes.length} estudiantes evaluados
                      </span>
                    </div>
                    <span className="pastilla pastilla-promedio">{promedio}% logro</span>
                  </div>

                  {sesion && (
                    <div className="clase-dashboard-sesion">
                      <span className="etiqueta-sesion-vinculada">
                        Sesión: <strong>{sesion.titulo}</strong>
                      </span>
                    </div>
                  )}

                  <div className="clase-dashboard-footer">
                    <div className="barra-progreso-contenedor barra-mediana">
                      <div
                        className={`barra-progreso-llenado ${
                          promedio >= 80 ? "logro-alto" : promedio >= 60 ? "logro-medio" : "logro-bajo"
                        }`}
                        style={{ width: `${promedio}%` }}
                      />
                    </div>
                    <div className="clase-dashboard-alertas">
                      {riesgoEnClase > 0 ? (
                        <span className="alerta-chica">{riesgoEnClase} alumnos en refuerzo</span>
                      ) : (
                        <span className="exito-chico">Sin alertas de riesgo</span>
                      )}
                      {sesion && (
                        <Link
                          to={`/docente/sesiones/${sesion.id}`}
                          className="boton boton-fantasma boton-sm"
                        >
                          Ver sesión y juegos
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Columna 2: Atención Pedagógica Prioritaria (Alumnos en Riesgo) */}
        <section className="tarjeta">
          <div className="cabecera-tarjeta-flex">
            <h3>Alumnos que Requieren Apoyo</h3>
            <span className="pastilla pastilla-alerta">{alumnosEnRiesgo.length} estudiantes</span>
          </div>

          <div className="lista-alumnos-riesgo-completa">
            {alumnosEnRiesgo.map((alumno) => {
              const clase = clases.find((c) => c.id === alumno.claseId);
              return (
                <div key={alumno.id} className="tarjeta-riesgo-item">
                  <div className="tarjeta-riesgo-persona">
                    <span className="avatar-mediano">{alumno.avatar}</span>
                    <div className="tarjeta-riesgo-info">
                      <strong className="nombre-alumno-riesgo">{alumno.nombre} {alumno.apellidos}</strong>
                      <span className="suave-chico">{clase?.nombre || "Primaria"}</span>
                    </div>
                  </div>

                  <div className="tarjeta-riesgo-metricas">
                    <div className="puntaje-riesgo">
                      <span className="numero-riesgo">{alumno.promedioAciertos}%</span>
                      <span className="suave-micro">aciertos promedio</span>
                    </div>
                    <div className="criterios-afectados">
                      <span className="suave-micro">Criterio pendiente:</span>
                      {alumno.criteriosBajos.map((crit) => (
                        <span key={crit} className="pastilla pastilla-alerta">
                          {crit}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="tarjeta-riesgo-sugerencia">
                    <strong>Pauta de Refuerzo:</strong> Activar juego individual con pistas visuales guiadas.
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Registro de Actividad Reciente */}
      <section className="tarjeta seccion-actividad-reciente">
        <h3>Últimas Evidencias Registradas</h3>
        <div className="tabla-envoltura">
          <table className="tabla">
            <thead>
              <tr>
                <th>Estudiante</th>
                <th>Juego</th>
                <th>Aciertos</th>
                <th>Logro</th>
                <th>Duración</th>
                <th>Fecha</th>
                <th>Estado Formativo</th>
              </tr>
            </thead>
            <tbody>
              {ultimosIntentos.map((intento) => {
                const pct = Math.round(intento.porcentaje * 100);
                const aprobado = pct >= 60;
                const juego = estado.juegos.find((j) => j.id === intento.juegoId);
                return (
                  <tr key={intento.id}>
                    <td>
                      <strong>{intento.alumnoNombre}</strong>
                    </td>
                    <td>
                      {juego?.titulo || intento.juegoId}
                    </td>
                    <td>
                      {intento.aciertos} / {intento.total}
                    </td>
                    <td>
                      <span className={aprobado ? "texto-verde" : "texto-alerta"}>
                        {pct}%
                      </span>
                    </td>
                    <td className="suave">{Math.round(intento.duracionSegundos / 60)} min</td>
                    <td className="suave">{intento.fecha}</td>
                    <td>
                      <span
                        className={`pastilla ${
                          pct >= 80
                            ? "pastilla-exito"
                            : pct >= 60
                            ? "pastilla-medio"
                            : "pastilla-alerta"
                        }`}
                      >
                        {pct >= 80 ? "Destacado" : pct >= 60 ? "Aprobado" : "Requiere apoyo"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
