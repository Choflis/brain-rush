import { ReglitaInteractiva } from "../componentes/ReglitaInteractiva";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AccesoEstudiante } from "./AccesoEstudiante";
import { useSesion } from "../sesion";
import { IconoAnimado } from "../componentes/IconoAnimado";

export function Login({ destino }: { destino?: string }) {
  const { iniciarDocente } = useSesion();
  const navegar = useNavigate();
  const [nombreDocente, setNombreDocente] = useState("Prof. Carlos Mendoza");
  const [escribiendoNombre, setEscribiendoNombre] = useState(false);
  const [posicionNombre, setPosicionNombre] = useState(0);
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const rolInicial = searchParams.get("rol") === "alumno" ? "alumno" : searchParams.get("rol") === "docente" || location.pathname.startsWith("/docente") ? "docente" : "alumno";

  const [tabRol, setTabRol] = useState<"docente" | "alumno">(rolInicial);

  const handleEntrarDocente = () => {
    iniciarDocente(nombreDocente.trim());
    navegar(destino || "/docente", { replace: true });
  };

  if (tabRol === "alumno") return <AccesoEstudiante alCambiarRol={() => setTabRol("docente")} />;

  return (
    <div className="centrado docente-acceso">
      <section className="tarjeta tarjeta-login">
        <div className="login-reglita"><ReglitaInteractiva compacta leyendo={escribiendoNombre} posicionLectura={posicionNombre} /></div>
        <p className="etiqueta">UN ESPACIO PARA ACOMPAÑAR CADA AVANCE</p>
        <h1>Bienvenido a tu aula.</h1>
        <p className="suave">
          Organiza tus sesiones y encuentra el siguiente paso para tus estudiantes.
        </p>

        {/* Selector de Rol */}
        <div className="selector-rol-tabs">
          <button
            type="button"
            className={`btn-rol ${tabRol === "docente" ? "btn-rol-activo" : ""}`}
            aria-pressed={tabRol === "docente"}
            onClick={() => setTabRol("docente")}
          >
            <IconoAnimado tipo="docente" tamano={20} /> Docente
          </button>
          <button
            type="button"
            className="btn-rol"
            aria-pressed={false}
            onClick={() => setTabRol("alumno")}
          >
            <IconoAnimado tipo="estudiante" tamano={20} /> Estudiante
          </button>
        </div>

        {(
          <div className="login-contenido-docente">
            <div className="docente-info-caja">
              <IconoAnimado tipo="docente" tamano={34} />
              <div>
                <strong>{nombreDocente.trim() || "Tu aula virtual"}</strong>
                <span className="suave-chico">Docente Titular de Primaria · Escuela Piloto</span>
              </div>
            </div>

            <label className="docente-login-label" htmlFor="nombre-docente">¿Cómo te llamas, profe?</label>
            <input id="nombre-docente" className="docente-login-nombre" autoComplete="name" maxLength={60} value={nombreDocente} onFocus={() => setEscribiendoNombre(true)} onBlur={() => setEscribiendoNombre(false)} onSelect={e => setPosicionNombre(e.currentTarget.selectionStart ?? 0)} onChange={e => { setNombreDocente(e.target.value); setPosicionNombre(e.target.selectionStart ?? 0); }} onKeyDown={e => { if (e.key === 'Enter' && nombreDocente.trim()) handleEntrarDocente(); }} />
            <p className="docente-login-nota">Acceso de demostración, sin contraseña. Tus datos de aula se conservan en este navegador.</p>

            <button
              type="button"
              className="boton boton-primario boton-grande boton-ancho"
              disabled={!nombreDocente.trim()}
              onClick={handleEntrarDocente}
            >
              Entrar al Panel Docente
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
