import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { aulaVirtual, type ClaseAula, type Estudiante, type JuegoAula } from "../../datos/aulaVirtual";
import { useSesion } from "../../sesion";
import { IconoAnimado } from "../../componentes/IconoAnimado";
import { AvatarReglita } from "../../componentes/AvatarReglita";

export function PortalEstudiante() {
  const { sesion, iniciarAlumno, cerrar } = useSesion();
  const navegar = useNavigate();

  const clases = aulaVirtual.obtenerClases();

  // Determinar clase activa según sesión o primera por defecto
  const [claseSeleccionadaId, setClaseSeleccionadaId] = useState<string>(() => {
    if (sesion?.claseId) return sesion.claseId;
    return clases[0]?.id || "";
  });

  const [codigoSala, setCodigoSala] = useState("");
  const [errorSala, setErrorSala] = useState("");

  const claseActual: ClaseAula | undefined =
    clases.find((c) => c.id === claseSeleccionadaId) || clases[0];

  // Juegos complementarios habilitados para la clase seleccionada
  const juegosDisponibles: JuegoAula[] = claseActual
    ? aulaVirtual.obtenerJuegosPorClase(claseActual.id)
    : [];

  const estudiantesClase: Estudiante[] = claseActual
    ? aulaVirtual.obtenerEstudiantesPorClase(claseActual.id)
    : [];

  const handleSeleccionarEstudiante = (est: Estudiante) => {
    iniciarAlumno(`token-${est.id}`, `${est.nombre} ${est.apellidos}`, est.id, claseActual?.id);
  };

  const handleUnirseASala = (e: React.FormEvent) => {
    e.preventDefault();
    const pin = codigoSala.trim().toUpperCase();
    if (!pin) {
      setErrorSala("Escribe el código que tu profesor proyecta en la pizarra.");
      return;
    }
    navegar(`/s/${pin}`);
  };

  const handleLanzarJuego = (juego: JuegoAula) => {
    if (juego.codigo === "TIENDA" || juego.codigo === "TIENDA-C") {
      window.location.href = "/tiendita.html";
    } else if (juego.codigo === "CARRERA") {
      navegar(`/j/${juego.codigo}`);
    } else {
      window.location.href = "/docs/examples/EcoAventura_3D_Rescatemos_nuestro_Recreo.html";
    }
  };

  const resolverIconoMecanica = (mecanica: string) => {
    if (mecanica === "tienda") return <IconoAnimado tipo="tienda" tamano={70} />;
    if (mecanica === "carrera") return <IconoAnimado tipo="carrera" tamano={70} />;
    return <IconoAnimado tipo="ecosistema" tamano={70} />;
  };

  const obtenerConsignaNino = (juego: JuegoAula) => {
    if (juego.codigo === "TIENDA" || juego.codigo === "TIENDA-C") {
      return "¡Ayuda a Reglita a llenar el camión organizando los alimentos!";
    }
    if (juego.codigo === "CARRERA") {
      return "¡Corre velozmente por el patio, salta y resuelve conversiones!";
    }
    return "¡Explora el bosque interactivo y protege a los seres vivos!";
  };

  return (
    <div className="portal-estudiante">
      {/* Barra Superior Infantil */}
      <header className="estudiante-cabecera">
        <Link to="/" className="marca-estudiante">
          <IconoAnimado tipo="rayo" tamano={28} />
          <span>
            BRAIN<span className="marca-fuerte">RUSH</span>
          </span>
          <span className="pastilla-alumnos">ZONA DE JUEGOS</span>
        </Link>

        <div className="estudiante-usuario-widget">
          {sesion?.rol === "alumno" ? (
            <div className="estudiante-badge">
              <IconoAnimado tipo="estudiante" tamano={22} />
              <div className="estudiante-textos">
                <strong>{sesion.nombre}</strong>
                <span className="suave-micro">{claseActual?.nombre.split("·")[0]}</span>
              </div>
              <button
                type="button"
                className="boton boton-fantasma boton-sm"
                onClick={cerrar}
                title="Cambiar de estudiante"
              >
                Cambiar
              </button>
            </div>
          ) : (
            <Link to="/login" className="boton boton-fantasma boton-sm">
              Ingresar con mi nombre
            </Link>
          )}
        </div>
      </header>

      <main className="estudiante-contenido">
        {/* Banner de Acción Inmediata: Código de Pizarra */}
        <section className="alumnos-pin-banner">
          <div className="pin-banner-icono">
            <AvatarReglita tamano={46} />
          </div>
          <div className="pin-banner-info">
            <strong>¿Tu profesor proyectó un juego en la pizarra?</strong>
            <span>Escribe el código para unirte a la partida con todo tu salón</span>
          </div>
          <form className="pin-banner-form" onSubmit={handleUnirseASala}>
            <input
              type="text"
              placeholder="EJEMPLO: TIENDA"
              value={codigoSala}
              maxLength={10}
              onChange={(e) => {
                setCodigoSala(e.target.value.toUpperCase());
                setErrorSala("");
              }}
            />
            <button type="submit" className="boton boton-entrar-pin">
              ¡Entrar a la Clase! ➔
            </button>
          </form>
          {errorSala && <p className="mensaje-error-pin">{errorSala}</p>}
        </section>

        {/* Selector de Aula: Botones Grandes y Claros */}
        <section className="seccion-aulas-tabs">
          <span className="titulo-selector-aula">Elige tu salón:</span>
          <div className="aulas-tabs-ninos">
            {clases.map((clase) => {
              const seleccionada = clase.id === claseActual?.id;
              const nombreCorto = (clase.nombre.split("·")[0] ?? clase.nombre).trim();
              return (
                <button
                  key={clase.id}
                  type="button"
                  className={`tab-aula-nino ${seleccionada ? "tab-aula-nino-activo" : ""}`}
                  onClick={() => setClaseSeleccionadaId(clase.id)}
                >
                  <span className="tab-icono">{clase.icono}</span>
                  <span className="tab-nombre">{nombreCorto}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Selector Rápido de Estudiante si aún no se autenticó */}
        {(!sesion || sesion.rol !== "alumno") && (
          <section className="seccion-elegir-alumno-rapido">
            <span className="rotulo-alumno">¿Quién eres tú? Haz clic en tu nombre:</span>
            <div className="chips-alumnos-rapidos">
              {estudiantesClase.map((est) => (
                <button
                  key={est.id}
                  type="button"
                  className="chip-alumno-boton"
                  onClick={() => handleSeleccionarEstudiante(est)}
                >
                  <span>{est.avatar}</span>
                  <strong>{est.nombre}</strong>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Catálogo de Juegos: Máxima Atracción, Cero Distracción */}
        <section className="seccion-juegos-ninos">
          {juegosDisponibles.length === 0 ? (
            <div className="aviso-vacio-nino tarjeta">
              <AvatarReglita tamano={64} />
              <h3>¡Aún no hay juegos activos para este salón!</h3>
              <p>Tu profesor activará los juegos en la próxima clase.</p>
            </div>
          ) : (
            <div className="grilla-juegos-ninos">
              {juegosDisponibles.map((juego) => (
                <article key={juego.id} className="tarjeta-juego-nino-directo">
                  <div className="tarjeta-juego-icono-area" style={{ backgroundColor: juego.color }}>
                    {resolverIconoMecanica(juego.mecanica)}
                  </div>

                  <div className="tarjeta-juego-cuerpo">
                    <h2>{juego.titulo}</h2>
                    <p className="mision-juego-nino">{obtenerConsignaNino(juego)}</p>

                    <button
                      type="button"
                      className="boton boton-jugar-destacado"
                      onClick={() => handleLanzarJuego(juego)}
                    >
                      ¡JUGAR AHORA! ▶
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="estudiante-pie">
        <p>BRAIN RUSH · Aprender Jugando</p>
        <Link to="/docente" className="enlace-docente-pie">
          Acceso Docente
        </Link>
      </footer>
    </div>
  );
}
