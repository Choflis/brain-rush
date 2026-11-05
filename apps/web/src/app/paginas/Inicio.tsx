import { Link } from 'react-router-dom';
import { IconoAnimado } from '../componentes/IconoAnimado';
import { ReglitaInteractiva } from '../componentes/ReglitaInteractiva';
import { Mosaico } from '../componentes/Mosaico';

export function Inicio() {
  return (
    <div className="inicio">
      <section className="bienvenida">
        <div className="bienvenida-texto">
          <p className="etiqueta"><span className="punto-aventura" /> Pequeños pasos, grandes descubrimientos</p>
          <h1>Aprender es toda una <span className="palabra-aventura">aventura<svg viewBox="0 0 400 18" aria-hidden="true"><path d="M4 11Q180-4 393 9" /></svg></span>.</h1>
          <p className="entradilla">Cuenta, explora y descubre con Reglita. Un mundo de juegos que nacen de lo que aprendes en clase.</p>
          <div className="acciones acciones-landing">
            <Link to="/estudiante" className="boton boton-primario boton-grande"><IconoAnimado tipo="rayo" tamano={24} color="white" /> ¡Quiero jugar! <span aria-hidden="true">↗</span></Link>
            <Link to="/docente" className="boton boton-fantasma boton-grande">Soy docente <span aria-hidden="true">→</span></Link>
          </div>
          <div className="bienvenida-nota"><span className="nota-dibujo" aria-hidden="true">✳</span><span>A tu ritmo. Sin miedo a equivocarte.<br /><strong>¡Cada intento es un nuevo descubrimiento!</strong></span></div>
        </div>
        <div className="bienvenida-escena">
          <div className="escena-arco" aria-hidden="true"><span className="escena-sol">✳</span><span className="escena-cuadricula" /></div>
          <span className="pegatina pegatina-suma" aria-hidden="true">2 + 3 = <b>5</b></span>
          <span className="pegatina pegatina-idea" aria-hidden="true">¡Lo descubrí! <span>✦</span></span>
          <ReglitaInteractiva />
          <span className="escena-suelo" aria-hidden="true" />
        </div>
      </section>

      <section className="seccion seccion-demos" id="juegos">
        <div className="seccion-titulo-fila"><div><p className="mini-etiqueta">Explora, prueba, aprende</p><h2>¿Qué descubrimos hoy?</h2></div><Link to="/estudiante" className="enlace-explorar">Ir a mi salón <span aria-hidden="true">→</span></Link></div>
        <div className="tarjetas tarjetas-tres aventuras-grid">
          <article className="tarjeta tarjeta-demo-landing aventura-tienda">
            <div className="aventura-ilustracion"><span className="aventura-grado">1.º y 2.º de primaria</span><IconoAnimado tipo="tienda" tamano={100} animarAlHover /><span className="aventura-dibujo" aria-hidden="true">1 2 3</span></div>
            <div className="aventura-contenido"><span className="aventura-tema">Cuenta y clasifica</span><h3>La Tiendita de Reglita</h3><p>Organiza los productos, cuenta y llena el camión. ¡Tu pequeña tienda te espera!</p><div className="demo-acciones"><a href="/tiendita.html" className="boton boton-primario">Jugar a la tiendita <span aria-hidden="true">→</span></a><Link to="/docente/sesiones/ses-1-tienda" className="enlace-texto-chico">Ver sesión para docentes</Link></div></div>
          </article>
          <article className="tarjeta tarjeta-demo-landing aventura-carrera">
            <div className="aventura-ilustracion"><span className="aventura-grado">3.º y 4.º de primaria</span><IconoAnimado tipo="carrera" tamano={100} animarAlHover /><span className="aventura-dibujo" aria-hidden="true">×10 ÷10</span></div>
            <div className="aventura-contenido"><span className="aventura-tema">Mide y convierte</span><h3>Carrera del Patio</h3><p>Salta de centímetros a metros y cruza cada puerta. ¡Vamos a la meta!</p><div className="demo-acciones"><Link to="/j/CARRERA" className="boton boton-primario">Jugar a la carrera <span aria-hidden="true">→</span></Link><Link to="/docente/sesiones/ses-2-longitud" className="enlace-texto-chico">Ver sesión para docentes</Link></div></div>
          </article>
          <article className="tarjeta tarjeta-demo-landing aventura-eco">
            <div className="aventura-ilustracion"><span className="aventura-grado">5.º y 6.º de primaria</span><IconoAnimado tipo="ecosistema" tamano={100} animarAlHover /><span className="aventura-dibujo" aria-hidden="true">✿ ✧</span></div>
            <div className="aventura-contenido"><span className="aventura-tema">Explora y cuida</span><h3>EcoAventura</h3><p>Conoce a los habitantes del jardín y ayuda a cuidar su hogar.</p><div className="demo-acciones"><a href="/docs/examples/EcoAventura_3D_Rescatemos_nuestro_Recreo.html" className="boton boton-primario">Explorar el jardín <span aria-hidden="true">→</span></a><Link to="/docente/sesiones/ses-3-ecosistemas" className="enlace-texto-chico">Ver sesión para docentes</Link></div></div>
          </article>
        </div>
      </section>



      <section className="seccion puente-docente" id="como-funciona">
        <div><p className="mini-etiqueta">Para quienes enseñan</p><h2>Tu clase, una nueva<br />forma de descubrir.</h2><p>Transforma tus sesiones de aprendizaje en experiencias de juego y acompaña el progreso de cada estudiante.</p><Link to="/docente" className="boton boton-secundario">Conocer el aula virtual <span aria-hidden="true">→</span></Link></div>
        <ol className="pasos-visuales"><li><span>01</span><div><h3>Prepara tu sesión</h3><p>Trabaja con tus competencias y criterios de aprendizaje.</p></div></li><li><span>02</span><div><h3>Elige la aventura</h3><p>Activación en equipo o práctica individual a su ritmo.</p></div></li><li><span>03</span><div><h3>Acompaña cada paso</h3><p>Revisa evidencias y encuentra dónde necesitan apoyo.</p></div></li></ol>
      </section>
      <div className="recreo-fila"><Mosaico extendido /></div>
    </div>
  );
}
