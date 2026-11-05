import { Link } from "react-router-dom";
import { IconoAnimado } from "../componentes/IconoAnimado";

export function Inicio() {
  return (
    <div className="inicio">
      {/* Sección Héroe */}
      <section className="heroe">
        <p className="etiqueta">hack4edu 2026 · Reto 11 · Aula Inteligente</p>
        <h1>
          La sesión de clase
          <br />
          se convierte en <span className="resaltado">videojuego</span>.
        </h1>
        <p className="entradilla">
          BRAIN RUSH toma la sesión pedagógica que el docente ya preparó en PDF o DOCX y la transforma
          en un videojuego educativo interactivo. Sin cuestionarios aburridos: arrastra, clasifica,
          convierte y aprende.
        </p>

        <div className="acciones acciones-landing">
          <Link to="/docente" className="boton boton-primario boton-grande">
            <IconoAnimado tipo="docente" tamano={22} /> Entrar como Docente
          </Link>
          <Link to="/estudiante" className="boton boton-secundario boton-grande">
            <IconoAnimado tipo="estudiante" tamano={22} /> Entrar como Estudiante
          </Link>
          <Link to="/login" className="boton boton-fantasma boton-grande">
            Acceso Rápido / Login
          </Link>
        </div>
      </section>

      {/* Demostraciones Directas de los 3 Juegos */}
      <section className="seccion seccion-demos">
        <h2>Juegos oficiales integrados en el sistema</h2>
        <p className="suave">
          Basados directamente en las sesiones curriculares del repositorio.
        </p>

        <div className="tarjetas tarjetas-tres">
          <article className="tarjeta tarjeta-demo-landing">
            <div className="demo-tarjeta-encabezado">
              <span className="tarjeta-numero">1.º Grado</span>
              <IconoAnimado tipo="tienda" tamano={44} />
            </div>
            <h3>La Tiendita de Reglita</h3>
            <span className="pastilla pastilla-activacion">Activación y Complemento</span>
            <p>
              Basada en <code>primer-grado-u1-s9.pdf</code>. Los niños clasifican productos y cuentan cantidades hasta 10 para llenar el camión.
            </p>
            <div className="demo-acciones">
              <a href="/tiendita.html" className="boton boton-primario boton-sm">
                Probar Activación (1.º)
              </a>
              <Link to="/docente/sesiones/ses-1-tienda" className="enlace-texto-chico">
                Ver sesión curricular
              </Link>
            </div>
          </article>

          <article className="tarjeta tarjeta-demo-landing">
            <div className="demo-tarjeta-encabezado">
              <span className="tarjeta-numero">3.º Grado</span>
              <IconoAnimado tipo="carrera" tamano={44} />
            </div>
            <h3>Carrera del Patio</h3>
            <span className="pastilla pastilla-complemento">Complemento Phaser</span>
            <p>
              Basada en <code>11 MAT UNIDADES DE LONGITUD.docx</code>. Reglita corre por el patio y salta puertas con conversiones ×10 y ÷10.
            </p>
            <div className="demo-acciones">
              <Link to="/j/CARRERA" className="boton boton-primario boton-sm">
                Probar Carrera (3.º)
              </Link>
              <Link to="/docente/sesiones/ses-2-longitud" className="enlace-texto-chico">
                Ver sesión curricular
              </Link>
            </div>
          </article>

          <article className="tarjeta tarjeta-demo-landing">
            <div className="demo-tarjeta-encabezado">
              <span className="tarjeta-numero">5.º Grado</span>
              <IconoAnimado tipo="ecosistema" tamano={44} />
            </div>
            <h3>EcoAventura / El Jardín</h3>
            <span className="pastilla pastilla-activacion">Ciencia y Tecnología</span>
            <p>
              Basada en <code>Sesion_CyT_5to_Ciclo_V_Ecosistemas.docx</code>. Misiones de equilibrio ecológico entre factores bióticos y abióticos.
            </p>
            <div className="demo-acciones">
              <a
                href="/docs/examples/EcoAventura_3D_Rescatemos_nuestro_Recreo.html"
                className="boton boton-primario boton-sm"
              >
                Probar EcoAventura (5.º)
              </a>
              <Link to="/docente/sesiones/ses-3-ecosistemas" className="enlace-texto-chico">
                Ver sesión curricular
              </Link>
            </div>
          </article>
        </div>
      </section>

      {/* Dos momentos pedagógicos */}
      <section id="como-funciona" className="seccion">
        <h2>Dos momentos, dos formas de aprender</h2>
        <div className="tarjetas">
          <article className="tarjeta">
            <div className="demo-tarjeta-encabezado">
              <span className="tarjeta-numero">01</span>
              <IconoAnimado tipo="proyeccion" tamano={38} />
            </div>
            <h3>Activación en Aula</h3>
            <p>
              El docente proyecta en pantalla grande y el aula colabora desde sus celulares o tablets.
              La meta es colectiva: entre todos llenan el camión o salvan el jardín.
            </p>
            <span className="pastilla pastilla-activacion">Proyección + Código PIN</span>
          </article>
          <article className="tarjeta">
            <div className="demo-tarjeta-encabezado">
              <span className="tarjeta-numero">02</span>
              <IconoAnimado tipo="trofeo" tamano={38} />
            </div>
            <h3>Complemento Individual</h3>
            <p>
              Cada alumno practica a su propio ritmo en casa o el laboratorio. Las mecánicas se adaptan,
              recopilan evidencias por criterio curricular y funcionan sin conexión.
            </p>
            <span className="pastilla pastilla-complemento">Práctica Autónoma + Métricas CNEB</span>
          </article>
        </div>
      </section>

      {/* Del papel al juego */}
      <section className="seccion">
        <h2>Del documento al videojuego en tres pasos</h2>
        <ol className="pasos">
          <li>
            <strong>1. Sube la sesión.</strong> Extrae competencia, capacidades y criterios de evaluación.
          </li>
          <li>
            <strong>2. Modela con el Chat de IA.</strong> Escribe indicaciones pedagógicas para personalizar
            personajes, temática o nivel de dificultad.
          </li>
          <li>
            <strong>3. Juega y mide formativamente.</strong> Monitorea en el panel docente los aciertos por criterio
            y detecta a tiempo a los alumnos en riesgo.
          </li>
        </ol>
      </section>
    </div>
  );
}
