import { useState, type FormEvent } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useSesion } from '../../sesion';
import { useAulaVirtual } from '../../datos/useAulaVirtual';
import { IconoDocente } from '../../componentes/IconoDocente';
import { ReglitaFlotante } from '../../componentes/ReglitaFlotante';
import '../../docente.css';

export function DocenteLayout() {
  const { sesion, cerrar } = useSesion();
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const estado = useAulaVirtual();
  const [compacta, setCompacta] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const pagina = ubicacion.pathname.includes('/clases') ? 'Clases y alumnos' : ubicacion.pathname.includes('/sesiones') ? 'Sesiones de estudio' : 'Panel de inicio';
  const nombre = sesion?.nombre || 'Prof. Carlos Mendoza';
  const iniciales = nombre.replace(/^Prof\.\s*/, '').split(' ').slice(0, 2).map(n => n[0]).join('');
  function buscar(event: FormEvent) { event.preventDefault(); navegar(`/docente/sesiones?buscar=${encodeURIComponent(busqueda.trim())}`); }
  return (
    <div className={`layout-aula-virtual ${compacta ? 'docente-compacto' : ''}`}>
      <a href="#contenido-docente" className="docente-saltar">Saltar al contenido</a>
      <aside className="sidebar-docente">
        <div className="sidebar-cabecera"><Link to="/" className="sidebar-marca" aria-label="BRAIN RUSH, inicio"><span className="docente-marca-simbolo"><svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><path d="M18 3 7 18h8l-1 11 12-16h-8Z" /></svg></span><div className="sidebar-marca-textos"><span>BRAIN<span className="marca-fuerte">RUSH</span></span><span className="marca-sub">Tu escritorio pedagógico</span></div></Link></div>
        <div className="sidebar-perfil-tarjeta"><span className="docente-iniciales" aria-hidden="true">{iniciales}</span><div className="perfil-textos"><strong>{nombre}</strong><span className="perfil-cargo">Docente de primaria</span></div></div>
        <nav className="sidebar-menu" aria-label="Navegación del aula virtual"><span className="sidebar-seccion-titulo">MI ESPACIO DE TRABAJO</span>
          {([{ ruta: '/docente', titulo: 'Panel de Inicio', icono: 'inicio' }, { ruta: '/docente/sesiones', titulo: 'Sesiones de Estudio', icono: 'libro' }, { ruta: '/docente/clases', titulo: 'Clases y Alumnos', icono: 'alumnos' }] as const).map(item => <NavLink key={item.ruta} to={item.ruta} end={item.ruta === '/docente'} aria-label={item.titulo} title={compacta ? item.titulo : undefined} className={({ isActive }) => `sidebar-item ${isActive ? 'sidebar-item-activo' : ''}`}><IconoDocente tipo={item.icono} /><span>{item.titulo}</span></NavLink>)}
        </nav>
        <div className="sidebar-widget-resumen"><span className="widget-titulo">TU AULA EN NÚMEROS</span><div className="widget-items"><div className="widget-fila"><span>Salones activos</span><strong>{estado.clases.length}</strong></div><div className="widget-fila"><span>Estudiantes</span><strong>{estado.estudiantes.length}</strong></div><div className="widget-fila"><span>Juegos listos</span><strong>{estado.juegos.length}</strong></div></div><span className="docente-local">Datos de demostración · este navegador</span></div>
        <footer className="sidebar-pie"><Link to="/estudiante" className="boton-enlace-estudiante" title="Vista de Estudiantes"><IconoDocente tipo="pantalla" /><span>Vista de Estudiantes</span><IconoDocente tipo="flecha" tamano={16} /></Link><button type="button" className="boton-salir-sidebar" onClick={() => { cerrar(); navegar('/'); }} aria-label="Cerrar sesión" title="Cerrar sesión"><IconoDocente tipo="salir" /><span>Cerrar sesión</span></button></footer>
        <button type="button" className="docente-plegar" aria-label={compacta ? 'Expandir navegación' : 'Plegar navegación'} aria-expanded={!compacta} onClick={() => setCompacta(c => !c)}><IconoDocente tipo="panel" /><span>{compacta ? 'Expandir' : 'Plegar menú'}</span></button>
      </aside>
      <div className="docente-espacio">
        <header className="docente-topbar"><div className="docente-contexto"><span>Aula virtual</span><span aria-hidden="true">/</span><strong>{pagina}</strong></div><form onSubmit={buscar} className="docente-busqueda-global"><IconoDocente tipo="buscar" tamano={18} /><input aria-label="Buscar en tus sesiones" placeholder="Encuentra una sesión…" value={busqueda} onChange={e => setBusqueda(e.target.value)} /><button type="submit" aria-label="Ir a resultados"><IconoDocente tipo="flecha" tamano={18} /></button></form><span className="docente-sello">Modo demo</span></header>
        <main id="contenido-docente" className="contenido-aula-virtual" tabIndex={-1}><Outlet /></main>
      </div>
      <ReglitaFlotante />
    </div>
  );
}
