import { Link, NavLink, Route, Routes, useLocation } from "react-router-dom";
import { useSesion } from "./sesion";
import { Inicio } from "./paginas/Inicio";
import { Login } from "./paginas/Login";
import { Panel } from "./paginas/Panel";
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
          Panel docente
        </NavLink>
        {sesion ? (
          <button type="button" className="boton boton-fantasma" onClick={cerrar}>
            Salir
          </button>
        ) : (
          <Link to="/docente/login" className="boton boton-primario">
            Entrar
          </Link>
        )}
      </nav>
    </header>
  );
}

function RutaDocente() {
  const { sesion } = useSesion();
  const ubicacion = useLocation();

  if (!sesion) {
    return <Login destino={ubicacion.pathname} />;
  }
  return <Panel />;
}

export function App() {
  const ubicacion = useLocation();
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

  return (
    <div className="aplicacion">
      <Cabecera />
      <main className="contenido">
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/docente/login" element={<Login destino="/docente" />} />
          <Route path="/docente" element={<RutaDocente />} />
          <Route path="/proyectar/:codigo" element={<Proyeccion />} />
          <Route path="*" element={<NoEncontrada />} />
        </Routes>
      </main>
      <footer className="pie">
        <span>BRAIN RUSH · MVP para hack4edu 2026</span>
        <span className="pie-nota">Funciona en localhost. Los datos se guardan en este dispositivo.</span>
      </footer>
    </div>
  );
}
