import { ReglitaInteractiva } from "../componentes/ReglitaInteractiva";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AccesoEstudiante } from "./AccesoEstudiante";
import { useSesion } from "../sesion";
import { IconoAnimado } from "../componentes/IconoAnimado";

export function Login({ destino }: { destino?: string }) {
  const { iniciarDocente } = useSesion();
  const navegar = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const rolInicial = searchParams.get("rol") === "alumno" ? "alumno" : searchParams.get("rol") === "docente" || location.pathname.startsWith("/docente") ? "docente" : "alumno";

  const [tabRol, setTabRol] = useState<"docente" | "alumno">(rolInicial);

  const handleEntrarDocente = () => {
    iniciarDocente("Prof. Carlos Mendoza");
    navegar(destino || "/docente", { replace: true });
  };

  if (tabRol === "alumno") return <AccesoEstudiante alCambiarRol={() => setTabRol("docente")} />;

  return (
    <div className="centrado">
      <section className="tarjeta tarjeta-login">
        <div className="login-reglita"><ReglitaInteractiva compacta /></div>
        <p className="etiqueta">Tu próxima aventura empieza aquí</p>
        <h1>¡Qué bueno verte!</h1>
        <p className="suave">
          Elige cómo quieres entrar. ¡Tenemos mucho por descubrir!
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
                <strong>Prof. Carlos Mendoza</strong>
                <span className="suave-chico">Docente Titular de Primaria · Escuela Piloto</span>
              </div>
            </div>

            <p className="suave">
              En esta etapa de evaluación no se requiere contraseña. Puedes acceder directamente al
              panel de métricas, gestión de sesiones y clases.
            </p>

            <button
              type="button"
              className="boton boton-primario boton-grande boton-ancho"
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
