import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useSesion } from "../../sesion";
import { IconoAnimado } from "../../componentes/IconoAnimado";
import { ReglitaFlotante } from "../../componentes/ReglitaFlotante";

export function DocenteLayout() {
  const { sesion, cerrar } = useSesion();
  const navegar = useNavigate();

  const handleCerrar = () => {
    cerrar();
    navegar("/");
  };

  return (
    <div className="layout-aula-virtual">
      {/* Sidebar Lateral del Aula Virtual */}
      <aside className="sidebar-docente">
        <div className="sidebar-cabecera">
          <Link to="/" className="sidebar-marca">
            <IconoAnimado tipo="rayo" tamano={28} />
            <div className="sidebar-marca-textos">
              <span>
                BRAIN<span className="marca-fuerte">RUSH</span>
              </span>
              <span className="marca-sub">AULA VIRTUAL</span>
            </div>
          </Link>
        </div>

        {/* Tarjeta de Perfil Docente */}
        <div className="sidebar-perfil-tarjeta">
          <div className="perfil-avatar-circulo" aria-hidden="true">👨‍🏫</div>
          <div className="perfil-textos">
            <strong>{(!sesion?.nombre || sesion.nombre === "Docente demo") ? "Prof. Carlos Mendoza" : sesion.nombre}</strong>
            <span className="perfil-cargo">Docente de Primaria</span>
          </div>
        </div>

        {/* Menú de Navegación del Aula Virtual */}
        <nav className="sidebar-menu" aria-label="Navegación del aula virtual">
          <span className="sidebar-seccion-titulo">GESTIÓN PEDAGÓGICA</span>
          <NavLink
            to="/docente"
            end
            className={({ isActive }) => `sidebar-item ${isActive ? "sidebar-item-activo" : ""}`}
          >
            <IconoAnimado tipo="metricas" tamano={18} />
            <span>Panel de Inicio</span>
          </NavLink>

          <NavLink
            to="/docente/sesiones"
            className={({ isActive }) => `sidebar-item ${isActive ? "sidebar-item-activo" : ""}`}
          >
            <IconoAnimado tipo="documento" tamano={18} />
            <span>Sesiones de Estudio</span>
          </NavLink>

          <NavLink
            to="/docente/clases"
            className={({ isActive }) => `sidebar-item ${isActive ? "sidebar-item-activo" : ""}`}
          >
            <IconoAnimado tipo="estudiante" tamano={18} />
            <span>Clases y Alumnos</span>
          </NavLink>
        </nav>

        {/* Resumen de Estado */}
        <div className="sidebar-widget-resumen">
          <span className="widget-titulo">ESTADO DE AULAS</span>
          <div className="widget-items">
            <div className="widget-fila">
              <span>Salones activos:</span>
              <strong>3</strong>
            </div>
            <div className="widget-fila">
              <span>Estudiantes:</span>
              <strong>16</strong>
            </div>
            <div className="widget-fila">
              <span>Juegos listos:</span>
              <strong>5</strong>
            </div>
          </div>
        </div>

        {/* Pie del Sidebar */}
        <footer className="sidebar-pie">
          <Link to="/estudiante" className="boton-enlace-estudiante">
            Vista de Estudiantes ➔
          </Link>
          <button type="button" className="boton-salir-sidebar" onClick={handleCerrar}>
            Cerrar sesión
          </button>
        </footer>
      </aside>

      {/* Contenido Principal */}
      <main className="contenido-aula-virtual">
        <Outlet />
      </main>

      {/* Agente Copiloto Flotante Permanente para el Docente */}
      <ReglitaFlotante />
    </div>
  );
}
