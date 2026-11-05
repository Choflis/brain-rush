import { useDialogo } from "../../hooks/useDialogo";
import type { JuegoAula } from "../../datos/aulaVirtual";
import { IconoAnimado } from "../../componentes/IconoAnimado";

interface Props {
  juego: JuegoAula;
  onCerrar: () => void;
}

export function EstadisticasModal({ juego, onCerrar }: Props) {
  const stats = juego.estadisticas;
  const dialogo = useDialogo(true, onCerrar);

  const descargarCSV = () => {
    const filas = [
      ["Juego", juego.titulo],
      ["Codigo", juego.codigo],
      ["Tipo", juego.tipo],
      ["Nivel", juego.nivel],
      ["Intentos Totales", stats.intentos],
      ["Alumnos Participantes", stats.alumnos],
      ["Completados", stats.completados],
      ["Tasa de Logro Global (%)", `${stats.tasaLogro}%`],
      [],
      ["Criterio", "Descripcion", "Aciertos", "Total Items", "Porcentaje Logro"],
      ...stats.porCriterio.map((c) => [
        c.criterio,
        `"${c.texto.replace(/"/g, '""')}"`,
        c.aciertos,
        c.total,
        `${Math.round(c.porcentaje * 100)}%`,
      ]),
      [],
      ["Alumnos en Riesgo Pedagógico", "Aciertos", "Total", "Criterios con Dificultad"],
      ...stats.riesgo.map((r) => [
        r.nombre,
        r.aciertos,
        r.total,
        r.criteriosBajos.join(" / "),
      ]),
    ];

    const contenidoCSV = filas.map((f) => f.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + contenidoCSV], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `brain-rush-estadisticas-${juego.codigo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resolverIcono = (mecanica: string) => {
    if (mecanica === "tienda") return <IconoAnimado tipo="tienda" tamano={32} />;
    if (mecanica === "carrera") return <IconoAnimado tipo="carrera" tamano={32} />;
    return <IconoAnimado tipo="ecosistema" tamano={32} />;
  };

  return (
    <div ref={dialogo} className="modal-telon" role="dialog" aria-modal="true" aria-label={`Estadísticas de ${juego.titulo}`} onClick={onCerrar}>
      <div className="modal-contenido modal-ancho" onClick={(e) => e.stopPropagation()}>
        <header className="modal-cabecera">
          <div className="cabecera-info">
            {resolverIcono(juego.mecanica)}
            <div>
              <div className="fila-etiquetas">
                <span className="pastilla pastilla-complemento">Práctica Individual Formativa</span>
              </div>
              <h2>Estadísticas de Aprendizaje · {juego.titulo}</h2>
              <p className="suave">
                Evidencia formativa individual recopilada de los estudiantes que practicaron este juego.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="boton-cerrar"
            onClick={onCerrar}
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </header>

        {/* Métricas Principales */}
        <div className="kpis-grilla">
          <div className="kpi-tarjeta">
            <span className="kpi-numero">{stats.intentos}</span>
            <span className="kpi-etiqueta">Intentos totales</span>
          </div>
          <div className="kpi-tarjeta">
            <span className="kpi-numero">{stats.alumnos}</span>
            <span className="kpi-etiqueta">Alumnos evaluados</span>
          </div>
          <div className="kpi-tarjeta">
            <span className="kpi-numero">{stats.completados}</span>
            <span className="kpi-etiqueta">Completados</span>
          </div>
          <div className="kpi-tarjeta kpi-destacado">
            <span className="kpi-numero">{stats.tasaLogro}%</span>
            <span className="kpi-etiqueta">Tasa de logro</span>
          </div>
        </div>

        {/* Criterios Pedagógicos */}
        <section className="modal-seccion">
          <h3>Rendimiento por Criterio Curricular</h3>
          <p className="suave">
            Cada ítem del juego mide directamente un criterio de la sesión de aprendizaje.
          </p>

          <div className="tabla-envoltura">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Criterio</th>
                  <th>Descripción pedagógica</th>
                  <th>Aciertos</th>
                  <th>Total</th>
                  <th>Logro</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {stats.porCriterio.map((c) => {
                  const pct = Math.round(c.porcentaje * 100);
                  const estadoClase =
                    pct >= 80 ? "logro-alto" : pct >= 60 ? "logro-medio" : "logro-bajo";
                  return (
                    <tr key={c.criterio}>
                      <td>
                        <strong>{c.criterio}</strong>
                      </td>
                      <td>{c.texto}</td>
                      <td>{c.aciertos}</td>
                      <td>{c.total}</td>
                      <td>
                        <div className="barra-progreso-contenedor">
                          <div
                            className={`barra-progreso-llenado ${estadoClase}`}
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                          <span className="barra-progreso-texto">{pct}%</span>
                        </div>
                      </td>
                      <td>
                        <span className={`insignia-estado ${estadoClase}`}>
                          {pct >= 80 ? "Satisfactorio" : pct >= 60 ? "En proceso" : "Requiere apoyo"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Alumnos en Riesgo */}
        <section className="modal-seccion">
          <h3>
            Atención Prioritaria: {stats.riesgo.length} estudiantes
          </h3>
          {stats.riesgo.length === 0 ? (
            <div className="aviso-exito">
              Todos los estudiantes alcanzaron el umbral de logro en este complemento.
            </div>
          ) : (
            <div className="lista-alumnos-riesgo">
              {stats.riesgo.map((r) => (
                <div key={r.alumnoId} className="tarjeta-alumno-riesgo">
                  <div className="datos-alumno">
                    <strong className="nombre-alumno-riesgo">{r.nombre}</strong>
                    <span className="suave">
                      Rendimiento: {r.aciertos} de {r.total} aciertos · {Math.round((r.aciertos / (r.total || 1)) * 100)}% de logro
                    </span>
                  </div>
                  <div className="criterios-bajos">
                    <span className="etiqueta-alerta">Dificultad en:</span>
                    {r.criteriosBajos.map((crit) => (
                      <span key={crit} className="pastilla pastilla-alerta">
                        {crit}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <footer className="modal-pie">
          <button
            type="button"
            className="boton boton-primario boton-con-icono"
            onClick={descargarCSV}
          >
            <IconoAnimado tipo="documento" tamano={18} /> Exportar Reporte CSV
          </button>
          <button
            type="button"
            className="boton boton-fantasma"
            onClick={onCerrar}
          >
            Cerrar
          </button>
        </footer>
      </div>
    </div>
  );
}
