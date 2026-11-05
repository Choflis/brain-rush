import { ReglitaInteractiva } from "../componentes/ReglitaInteractiva";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { aulaVirtual, type ClaseAula, type Estudiante } from "../datos/aulaVirtual";
import { useSesion } from "../sesion";
import { IconoAnimado } from "../componentes/IconoAnimado";

export function Login({ destino }: { destino?: string }) {
  const { iniciarDocente, iniciarAlumno } = useSesion();
  const navegar = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const rolInicial = searchParams.get("rol") === "alumno" ? "alumno" : "docente";

  const [tabRol, setTabRol] = useState<"docente" | "alumno">(rolInicial);

  const clases = aulaVirtual.obtenerClases();
  const [claseSeleccionadaId, setClaseSeleccionadaId] = useState<string>(clases[0]?.id || "");

  const claseActual: ClaseAula | undefined =
    clases.find((c) => c.id === claseSeleccionadaId) || clases[0];
  const estudiantesClase: Estudiante[] = claseActual
    ? aulaVirtual.obtenerEstudiantesPorClase(claseActual.id)
    : [];

  const handleEntrarDocente = () => {
    iniciarDocente("Prof. Carlos Mendoza");
    navegar(destino || "/docente", { replace: true });
  };

  const handleEntrarAlumno = (est: Estudiante) => {
    iniciarAlumno(`token-${est.id}`, `${est.nombre} ${est.apellidos}`, est.id, claseActual?.id);
    navegar("/estudiante", { replace: true });
  };

  const handleEntrarAlumnoInvitado = () => {
    iniciarAlumno(`token-invitado-${Date.now()}`, "Estudiante Invitado", undefined, claseActual?.id);
    navegar("/estudiante", { replace: true });
  };

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
            className={`btn-rol ${tabRol === "alumno" ? "btn-rol-activo" : ""}`}
            aria-pressed={tabRol === "alumno"}
            onClick={() => setTabRol("alumno")}
          >
            <IconoAnimado tipo="estudiante" tamano={20} /> Estudiante
          </button>
        </div>

        {tabRol === "docente" ? (
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
        ) : (
          <div className="login-contenido-estudiante">
            <label className="etiqueta-chica">1. Elige tu salón:</label>
            <div className="selector-clases-login">
              {clases.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`chip-clase-login ${c.id === claseActual?.id ? "chip-clase-activo" : ""}`}
                  onClick={() => setClaseSeleccionadaId(c.id)}
                >
                  {c.nombre.split("·")[0]}
                </button>
              ))}
            </div>

            <label className="etiqueta-chica">2. Haz clic en tu nombre para entrar:</label>
            <div className="grilla-alumnos-login">
              {estudiantesClase.map((est) => (
                <button
                  key={est.id}
                  type="button"
                  className="boton-alumno-login"
                  onClick={() => handleEntrarAlumno(est)}
                >
                  <span className="avatar-alumno-login">{est.avatar}</span>
                  <strong>{est.nombre}</strong>
                </button>
              ))}
            </div>

            <div className="separador-login">o</div>

            <button
              type="button"
              className="boton boton-fantasma boton-ancho boton-sm"
              onClick={handleEntrarAlumnoInvitado}
            >
              Entrar como Estudiante Invitado
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
