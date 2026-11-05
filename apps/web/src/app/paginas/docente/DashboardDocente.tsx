import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAulaVirtual } from '../../datos/useAulaVirtual';
import { IconoDocente } from '../../componentes/IconoDocente';
import { AvatarExplorador, InsigniaSalon } from '../../componentes/IlustracionesInfantiles';
import { AvatarReglita } from '../../componentes/AvatarReglita';

export function DashboardDocente() {
  const estado = useAulaVirtual();
  const [salon, setSalon] = useState('todos');
  const [verTodos, setVerTodos] = useState(false);
  const [abierto, setAbierto] = useState<string | null>(null);
  const clases = estado.clases.filter(c => salon === 'todos' || c.id === salon);
  const estudiantes = estado.estudiantes.filter(e => salon === 'todos' || e.claseId === salon);
  const sesiones = estado.sesiones.filter(s => salon === 'todos' || clases.some(c => c.grado === s.grado));
  const promedio = estudiantes.length ? Math.round(estudiantes.reduce((n, e) => n + e.promedioAciertos, 0) / estudiantes.length) : 0;
  const apoyo = estudiantes.filter(e => e.estado === 'en_riesgo');
  const evidencias = estado.historial.filter(h => salon === 'todos' || h.claseId === salon).slice(0, 6);
  const enlaceClase = `/docente/clases${salon === 'todos' ? '' : `?salon=${salon}`}`;
  return (
    <div className="dashboard-docente">
      <header className="panel-subcabecera"><div><p className="docente-kicker">ENSEÑAR, ACOMPAÑAR, DESCUBRIR</p><h1>Tu aula, de un vistazo.</h1><p className="suave">Cada avance cuenta. Encuentra el siguiente paso para tu clase.</p></div><div className="acciones-cabecera"><Link to="/proyectar/TIENDA" className="boton boton-secundario"><IconoDocente tipo="pantalla" /> Proyectar en Aula</Link><Link to="/docente/sesiones?nueva=1" className="boton boton-primario">+ Subir Sesión</Link></div></header>
      <div className="docente-control-resumen"><span><span className="docente-punto" /> Resumen de aprendizaje</span><label>Ver salón<select aria-label="Ver salón" value={salon} onChange={e => { setSalon(e.target.value); setVerTodos(false); setAbierto(null); }}><option value="todos">Todos mis salones</option>{estado.clases.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></label></div>
      <div className="kpis-grilla kpis-docente">
        <Link to={salon === "todos" ? "/docente/sesiones" : `/docente/sesiones?grado=${clases[0]?.grado}`} className="kpi-tarjeta"><span className="docente-kpi-icono"><IconoDocente tipo="libro" tamano={24} /></span><span><span className="kpi-numero">{sesiones.length}</span><span className="kpi-etiqueta">Sesiones para descubrir</span></span><IconoDocente tipo="flecha" tamano={16} /></Link>
        <Link to={enlaceClase} className="kpi-tarjeta"><span className="docente-kpi-icono"><IconoDocente tipo="alumnos" tamano={24} /></span><span><span className="kpi-numero docente-resumen-alumnos">{estudiantes.length}</span><span className="kpi-etiqueta">Estudiantes en tu aula</span></span><IconoDocente tipo="flecha" tamano={16} /></Link>
        <a href="#comparacion-salones" className="kpi-tarjeta kpi-destacado"><span className="docente-kpi-icono"><IconoDocente tipo="check" tamano={24} /></span><span><span className="kpi-numero">{promedio}%</span><span className="kpi-etiqueta">Promedio de aciertos</span></span><IconoDocente tipo="flecha" tamano={16} /></a>
        <a href="#apoyo-docente" className="kpi-tarjeta kpi-alerta"><span className="docente-kpi-icono"><IconoDocente tipo="apoyo" tamano={24} /></span><span><span className="kpi-numero">{apoyo.length}</span><span className="kpi-etiqueta">Necesitan acompañamiento</span></span><IconoDocente tipo="flecha" tamano={16} /></a>
      </div>
      <div className="docente-grid-principal">
        <section className="tarjeta docente-salones" id="comparacion-salones"><div className="cabecera-tarjeta-flex"><div><p className="docente-kicker">UNA MIRADA A CADA GRUPO</p><h2>Así van tus salones</h2></div><button type="button" className="docente-enlace" disabled={salon === 'todos'} onClick={() => setSalon('todos')}>Ver todos</button></div>
          <div className="docente-comparacion">{clases.map(c => {
            const grupo = estado.estudiantes.filter(e => e.claseId === c.id);
            const pct = grupo.length ? Math.round(grupo.reduce((n, e) => n + e.promedioAciertos, 0) / grupo.length) : 0;
            const sesion = estado.sesiones.find(s => s.id === c.sesionPrincipalId);
            return <article className="docente-salon-fila" key={c.id}><button type="button" className="docente-salon-elegir" aria-label={`Ver resumen de ${c.nombre}`} onClick={() => setSalon(c.id)}><InsigniaSalon grado={c.grado} tamano={48} /><span><strong>{c.nombre}</strong><small>{grupo.length} estudiantes · {grupo.filter(e => e.estado === 'en_riesgo').length} por acompañar</small></span><b>{pct}%</b></button><div className="docente-barra" role="meter" aria-label={`Promedio de ${c.nombre}`} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><span style={{ transform: `scaleX(${pct / 100})` }} /></div>{sesion && <Link className="docente-sesion-enlace" to={`/docente/sesiones/${sesion.id}`}><span>{sesion.titulo}</span><IconoDocente tipo="flecha" tamano={16} /></Link>}</article>;
          })}</div>
          <div className="docente-leyenda"><span className="docente-punto" /> Aciertos promedio de los estudiantes · datos de demostración</div>
        </section>
        <section className="tarjeta docente-apoyo" id="apoyo-docente"><div className="cabecera-tarjeta-flex"><div><p className="docente-kicker">UN POCO DE AYUDA, UN GRAN PASO</p><h2>¿A quién acompañamos?</h2></div><span className="docente-contador">{apoyo.length}</span></div>
          {apoyo.length === 0 && <div className="docente-vacio"><IconoDocente tipo="check" tamano={32} /><h3>Sin alertas en este grupo</h3><p>Puedes seguir explorando las evidencias de tus estudiantes.</p></div>}
          <div className="docente-apoyo-lista">{(verTodos ? apoyo : apoyo.slice(0, 3)).map(e => <article className="docente-apoyo-alumno" key={e.id}><button type="button" className="docente-apoyo-abrir" aria-label={`Ver apoyo de ${e.nombre}`} aria-expanded={abierto === e.id} onClick={() => setAbierto(abierto === e.id ? null : e.id)}><AvatarExplorador semilla={e.id} tamano={44} /><span><strong>{e.nombre} {e.apellidos}</strong><small>{estado.clases.find(c => c.id === e.claseId)?.nombre.split('·')[0]}</small></span><b>{e.promedioAciertos}%</b><span className="docente-desplegar" aria-hidden="true">{abierto === e.id ? '−' : '+'}</span></button>{abierto === e.id && <div className="docente-apoyo-detalle"><strong>Criterios por reforzar: {e.criteriosBajos.join(', ')}</strong><p>Prueba una actividad con apoyo visual y observa qué estrategia usa antes de repetirla de forma autónoma.</p><Link to={`/docente/clases?salon=${e.claseId}&estado=en_riesgo`}>Ver estudiantes del salón <IconoDocente tipo="flecha" tamano={16} /></Link></div>}</article>)}</div>
          {apoyo.length > 3 && <button type="button" className="docente-ver-mas" onClick={() => setVerTodos(v => !v)} aria-expanded={verTodos}>{verTodos ? 'Mostrar menos' : `Ver los ${apoyo.length} estudiantes`} <IconoDocente tipo="flecha" tamano={16} /></button>}
          <div className="docente-reglita-nota"><AvatarReglita tamano={44} /><p><strong>Una idea de Reglita</strong>Un error puede mostrarte cómo está pensando. Escucha su estrategia y acompaña el siguiente intento.</p></div>
        </section>
      </div>
      <section className="tarjeta seccion-actividad-reciente"><div className="cabecera-tarjeta-flex"><div><p className="docente-kicker">EL APRENDIZAJE DEJA HUELLAS</p><h2>Evidencias recientes</h2></div><Link className="docente-enlace" to={enlaceClase}>Ver estudiantes <IconoDocente tipo="flecha" tamano={16} /></Link></div>{evidencias.length ? <div className="tabla-envoltura"><table className="tabla"><thead><tr><th>Estudiante</th><th>Juego</th><th>Aciertos</th><th>Logro</th><th>Duración</th><th>Registro</th></tr></thead><tbody>{evidencias.map(h => <tr key={h.id}><td><div className="docente-persona"><AvatarExplorador semilla={h.alumnoId} tamano={34} /><strong>{h.alumnoNombre}</strong></div></td><td>{estado.juegos.find(j => j.id === h.juegoId)?.titulo || h.juegoId}</td><td>{h.aciertos} / {h.total}</td><td><span className={`pastilla ${h.porcentaje >= .8 ? 'pastilla-exito' : h.porcentaje >= .6 ? 'pastilla-medio' : 'pastilla-alerta'}`}>{Math.round(h.porcentaje * 100)}%</span></td><td>{Math.round(h.duracionSegundos / 60)} min</td><td className="suave">{h.fecha}</td></tr>)}</tbody></table></div> : <div className="docente-vacio"><p>Aún no hay evidencias registradas para este salón.</p></div>}</section>
    </div>
  );
}
