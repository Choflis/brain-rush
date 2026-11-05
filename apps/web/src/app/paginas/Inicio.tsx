import { Link } from "react-router-dom";

export function Inicio() {
  return (
    <div className="inicio">
      <section className="heroe">
        <p className="etiqueta">hack4edu 2026 · Reto 11</p>
        <h1>
          La sesión de clase
          <br />
          se convierte en <span className="resaltado">juego</span>.
        </h1>
        <p className="entradilla">
          BRAIN RUSH toma la sesión que el docente ya preparó y la transforma en un videojuego
          educativo. Sin cuestionarios: el alumno arrastra, cuenta, convierte y juega.
        </p>
        <div className="acciones">
          <Link to="/docente" className="boton boton-primario boton-grande">
            Abrir panel docente
          </Link>
          <a href="#como-funciona" className="boton boton-fantasma boton-grande">
            Cómo funciona
          </a>
        </div>
      </section>

      <section id="como-funciona" className="seccion">
        <h2>Dos momentos, dos juegos</h2>
        <div className="tarjetas">
          <article className="tarjeta">
            <span className="tarjeta-numero">01</span>
            <h3>Activación</h3>
            <p>
              El docente proyecta la escena y el aula juega desde sus dispositivos. La meta es
              colectiva: entre todos llenan el camión de la tiendita.
            </p>
            <span className="pastilla">La tiendita · 1.º y 2.º</span>
          </article>
          <article className="tarjeta">
            <span className="tarjeta-numero">02</span>
            <h3>Complemento</h3>
            <p>
              Cada alumno practica en casa, con o sin conexión. Reglita corre por el patio y las
              puertas piden conversiones de medidas.
            </p>
            <span className="pastilla">La carrera · 3.º y 4.º</span>
          </article>
        </div>
      </section>

      <section className="seccion">
        <h2>Del papel al juego en tres pasos</h2>
        <ol className="pasos">
          <li>
            <strong>Sube la sesión.</strong> Se extraen competencia, criterios y actividades.
          </li>
          <li>
            <strong>Se genera el juego.</strong> Un GameSpec validado define escena, ítems y
            retroalimentación.
          </li>
          <li>
            <strong>Juega y mide.</strong> El panel muestra aciertos por criterio y quién necesita
            apoyo.
          </li>
        </ol>
      </section>

      <section className="seccion aviso-local">
        <h2>Etapa actual</h2>
        <p>
          El MVP corre en <strong>localhost</strong>. Los juegos de 1.º y 3.º ya están generados y
          validados; el de 5.º está planificado. Las credenciales de Cloudflare y Mistral se
          integran al final.
        </p>
      </section>
    </div>
  );
}
