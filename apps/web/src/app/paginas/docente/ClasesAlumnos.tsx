import { useSearchParams } from "react-router-dom";
import { useAulaVirtual } from "../../datos/useAulaVirtual";
import { AvatarExplorador, InsigniaSalon } from "../../componentes/IlustracionesInfantiles";
import { IconoDocente } from "../../componentes/IconoDocente";
import { useState } from "react";
import { aulaVirtual, type Estudiante } from "../../datos/aulaVirtual";
import { IconoAnimado } from "../../componentes/IconoAnimado";

export function ClasesAlumnos() {
  const datos = useAulaVirtual();
  const clases = datos.clases;
  const [params, setParams] = useSearchParams();
  const claseSeleccionadaId = params.get("salon") || clases[0]?.id || "";
  const [busqueda, setBusqueda] = useState("");
  const [orden, setOrden] = useState("nombre");
  const filtro = params.get("estado") || "todos";
  const [confirmacion, setConfirmacion] = useState("");
  function cambiarParam(clave: string, valor: string) { setParams(prev => { const next = new URLSearchParams(prev); next.set(clave, valor); return next; }, { replace: true }); }
  const juegos = datos.juegos.filter(j => j.tipo === "complemento");

  const claseActual = clases.find((c) => c.id === claseSeleccionadaId) || clases[0];
  const estudiantesActuales: Estudiante[] = claseActual
    ? datos.estudiantes.filter(e => claseActual.estudiantesIds.includes(e.id))
    : [];

  const handleToggleJuego = (juegoId: string) => {
    if (!claseActual) return;
    const habilitado = aulaVirtual.toggleJuegoComplementarioEnClase(claseActual.id, juegoId);
    setConfirmacion(`${juegos.find(j => j.id === juegoId)?.titulo}: ${habilitado ? "habilitado" : "bloqueado"} en ${claseActual.nombre}.`);
  };

  const resolverIconoMecanica = (mecanica: string) => {
    if (mecanica === "tienda") return <IconoAnimado tipo="tienda" tamano={32} />;
    if (mecanica === "carrera") return <IconoAnimado tipo="carrera" tamano={32} />;
    return <IconoAnimado tipo="ecosistema" tamano={32} />;
  };

  const estudiantesVisibles = estudiantesActuales.filter(e =>
    `${e.nombre} ${e.apellidos}`.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(busqueda.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '')) && (filtro === 'todos' || e.estado === filtro)
  ).sort((a, b) => orden === 'menor' ? a.promedioAciertos - b.promedioAciertos : orden === 'mayor' ? b.promedioAciertos - a.promedioAciertos : a.nombre.localeCompare(b.nombre, 'es'));

  return (
    <div className="clases-contenedor">
      <header className="panel-subcabecera">
        <div>
          <p className="docente-kicker">CADA ESTUDIANTE, SU PROPIO CAMINO</p><h1>Aulas y Estudiantes</h1>
          <p className="suave">
            Gestiona tus secciones de clase, visualiza a los alumnos inscritos y controla qué juegos complementarios pueden jugar.
          </p>
        </div>
      </header>

      {/* Selector de Clases */}
      <div className="selector-aulas-tabs">
        {clases.map((clase) => {
          const esActiva = clase.id === claseActual?.id;
          return (
            <button
              key={clase.id}
              type="button"
              className={`tab-aula ${esActiva ? "tab-aula-activa" : ""}`}
              aria-pressed={esActiva}
              onClick={() => { cambiarParam("salon", clase.id); setConfirmacion(""); }}
            >
              <InsigniaSalon grado={clase.grado} tamano={44} />
              <div className="tab-aula-textos">
                <strong>{clase.nombre}</strong>
                <span className="tab-aula-sub">{clase.estudiantesIds.length} estudiantes · {clase.juegosComplementariosHabilitados.length} juegos habilitados</span>
              </div>
            </button>
          );
        })}
      </div>

      {claseActual && (
        <div className="detalle-aula-seccion">
          <p className="docente-confirmacion" role="status">{confirmacion}</p>
          {/* Tarjeta de Control de Acceso a Juegos Complementarios */}
          <div className="tarjeta tarjeta-control-juegos">
            <div className="cabecera-tarjeta-control">
              <div>
                <h3>Control de Acceso a Juegos Complementarios</h3>
                <p className="suave">
                  Restringe o habilita qué videojuegos de refuerzo están disponibles en el portal para los estudiantes de esta clase.
                </p>
              </div>
            </div>

            <div className="rejilla-juegos-permisos">
              {juegos.map((juego) => {
                const habilitado = claseActual.juegosComplementariosHabilitados.includes(juego.id);
                return (
                  <div
                    key={juego.id}
                    className={`tarjeta-permiso-juego ${habilitado ? "juego-habilitado" : "juego-deshabilitado"}`}
                  >
                    <div className="icono-permiso">
                      {resolverIconoMecanica(juego.mecanica)}
                    </div>
                    <div className="info-permiso">
                      <div className="fila-etiquetas">
                        <span className="pastilla pastilla-grado">{juego.grados.join(", ")}.º Grado</span>
                      </div>
                      <strong>{juego.titulo}</strong>
                      <p className="suave-chico">{juego.subtitulo}</p>
                    </div>

                    <div className="toggle-switch-contenedor">
                      <label className="switch">
                        <input
                          type="checkbox"
                          role="switch"
                          aria-label={`Habilitar ${juego.titulo}`}
                          checked={habilitado}
                          onChange={() => handleToggleJuego(juego.id)}
                        />
                        <span className="slider redondo" />
                      </label>
                      <span className="toggle-estado-texto">
                        {habilitado ? "Habilitado" : "Bloqueado"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Lista de Estudiantes Inscritos */}
          <div className="tarjeta">
            <div className="cabecera-tarjeta-alumnos">
              <div>
                <h3>Estudiantes de la Clase: {estudiantesActuales.length}</h3>
                <p className="suave">
                  Métricas de progreso formativo y alertas de atención pedagógica por alumno en juegos de complemento.
                </p>
              </div>
            </div>

            <div className="docente-filtros">
              <label className="docente-campo-buscar"><IconoDocente tipo="buscar" tamano={18} /><input aria-label="Buscar estudiantes" placeholder="Busca por nombre…" value={busqueda} onChange={e => setBusqueda(e.target.value)} /></label>
              <select aria-label="Estado del estudiante" value={filtro} onChange={e => cambiarParam('estado', e.target.value)}><option value="todos">Todos los estados</option><option value="en_riesgo">Necesitan apoyo</option><option value="destacado">Destacados</option><option value="activo">Activos</option></select>
              <select aria-label="Ordenar estudiantes" value={orden} onChange={e => setOrden(e.target.value)}><option value="nombre">Nombre A–Z</option><option value="menor">Menor logro primero</option><option value="mayor">Mayor logro primero</option></select>
              <span className="docente-resultados" role="status">{estudiantesVisibles.length} de {estudiantesActuales.length}</span>
            </div>
            <div className="tabla-envoltura">
              <table className="tabla tabla-alumnos">
                <thead>
                  <tr>
                    <th>Estudiante</th>
                    <th>Estado</th>
                    <th>Intentos</th>
                    <th>Promedio de Aciertos</th>
                    <th>Criterios con Dificultad</th>
                    <th>Último Acceso</th>
                  </tr>
                </thead>
                <tbody>
                  {estudiantesVisibles.length === 0 && <tr><td colSpan={6} className="docente-vacio">No hay estudiantes con estos filtros.</td></tr>}
                  {estudiantesVisibles.map((est) => {
                    const esRiesgo = est.estado === "en_riesgo";
                    const esDestacado = est.estado === "destacado";
                    return (
                      <tr key={est.id} className={esRiesgo ? "fila-alerta" : ""}>
                        <td>
                          <div className="celda-estudiante">
                            <AvatarExplorador semilla={est.id} tamano={38} />
                            <div>
                              <strong>{est.nombre} {est.apellidos}</strong>
                              <span className="id-suave">ID: {est.id}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`pastilla pastilla-estado-${est.estado}`}
                          >
                            {esDestacado ? "Destacado" : esRiesgo ? "En Riesgo" : "Activo"}
                          </span>
                        </td>
                        <td>{est.intentosTotal}</td>
                        <td>
                          <div className="barra-progreso-contenedor">
                            <div
                              className={`barra-progreso-llenado ${
                                est.promedioAciertos >= 80
                                  ? "logro-alto"
                                  : est.promedioAciertos >= 60
                                  ? "logro-medio"
                                  : "logro-bajo"
                              }`}
                              style={{ width: `${est.promedioAciertos}%` }}
                            />
                            <span className="barra-progreso-texto">{est.promedioAciertos}%</span>
                          </div>
                        </td>
                        <td>
                          {est.criteriosBajos.length > 0 ? (
                            est.criteriosBajos.map((crit) => (
                              <span key={crit} className="pastilla pastilla-alerta">
                                {crit}
                              </span>
                            ))
                          ) : (
                            <span className="suave">Ninguno</span>
                          )}
                        </td>
                        <td className="suave">{est.ultimoAcceso}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
