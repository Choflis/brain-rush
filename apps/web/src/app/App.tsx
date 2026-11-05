import { Link, NavLink, Route, Routes, useLocation } from "react-router-dom";
import { useSesion } from "./sesion";
import { Inicio } from "./paginas/Inicio";
import { Login } from "./paginas/Login";
import { DocenteLayout } from "./paginas/docente/DocenteLayout";
import { DashboardDocente } from "./paginas/docente/DashboardDocente";
import { SesionesLista } from "./paginas/docente/SesionesLista";
import { SesionDetalle } from "./paginas/docente/SesionDetalle";
import { ClasesAlumnos } from "./paginas/docente/ClasesAlumnos";
import { PortalEstudiante } from "./paginas/estudiante/PortalEstudiante";
import { Juego } from "./paginas/Juego";
import { Sala } from "./paginas/Sala";
import { Proyeccion } from "./paginas/Proyeccion";
import { NoEncontrada } from "./paginas/NoEncontrada";

function Cabecera() {
  const { sesion, cerrar } = useSesion();

  return (
    <header className="cabecera">
      <Link to="/" className="marca" aria-label="BRAIN RUSH, inicio">
        <span className="marca-icono" aria-hidden="true">
          ⚡
        </span>
        <span>
          BRAIN<span className="marca-fuerte">RUSH</span>
        </span>
      </Link>
      <nav className="navegacion" aria-label="Principal">
        <NavLink to="/docente" className="nav-enlace">
          Panel Docente
        </NavLink>
        <NavLink to="/estudiante" className="nav-enlace">
          Portal Estudiantes
        </NavLink>
        {sesion ? (
          <button type="button" className="boton boton-fantasma" onClick={cerrar}>
            Salir ({sesion.nombre.split(" ")[0]})
          </button>
        ) : (
          <Link to="/login" className="boton boton-primario">
            Entrar
          </Link>
        )}
      </nav>
    </header>
  );
}

export function App() {
  const { sesion } = useSesion();
  const ubicacion = useLocation();

  // 1. Pantallas de Juego o Sala sincronizada a pantalla completa
  const esJuegoOSala =
    ubicacion.pathname.startsWith("/j/") ||
    ubicacion.pathname.startsWith("/s/");

  if (esJuegoOSala) {
    return (
      <Routes>
        <Route path="/j/:codigo" element={<Juego />} />
        <Route path="/s/:codigo" element={<Sala />} />
      </Routes>
    );
  }

  // 2. Proyección para el proyector del aula
  if (ubicacion.pathname.startsWith("/proyectar/")) {
    return (
      <Routes>
        <Route path="/proyectar/:codigo" element={<Proyeccion />} />
      </Routes>
    );
  }

  // 3. Aula Virtual Docente con Sidebar dedicado
  if (ubicacion.pathname.startsWith("/docente")) {
    // Si no ha iniciado sesión, mostrar login
    if (!sesion || sesion.rol !== "docente") {
      return (
        <div className="aplicacion">
          <Cabecera />
          <main className="contenido">
            <Login destino={ubicacion.pathname} />
          </main>
        </div>
      );
    }

    return (
      <Routes>
        <Route path="/docente" element={<DocenteLayout />}>
          <Route index element={<DashboardDocente />} />
          <Route path="sesiones" element={<SesionesLista />} />
          <Route path="sesiones/:id" element={<SesionDetalle />} />
          <Route path="clases" element={<ClasesAlumnos />} />
        </Route>
      </Routes>
    );
  }

  // 4. Portal del Estudiante
  if (ubicacion.pathname.startsWith("/estudiante")) {
    return (
      <Routes>
        <Route path="/estudiante" element={<PortalEstudiante />} />
      </Routes>
    );
  }

  // 5. Landing y Páginas Generales
  return (
    <div className="aplicacion">
      <Cabecera />
      <main className="contenido">
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/login" element={<Login destino="/docente" />} />
          <Route path="/docente/login" element={<Login destino="/docente" />} />
          <Route path="*" element={<NoEncontrada />} />
        </Routes>
      </main>
      <footer className="pie">
        <span>BRAIN RUSH · MVP para hack4edu 2026</span>
        <span className="pie-nota">
          Funciona en localhost y offline. Los datos se sincronizan en este dispositivo.
        </span>
      </footer>
    </div>
  );
}
