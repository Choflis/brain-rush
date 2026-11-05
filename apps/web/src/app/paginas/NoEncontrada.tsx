import { Link } from "react-router-dom";

export function NoEncontrada() {
  return (
    <div className="centrado">
      <section className="tarjeta tarjeta-login">
        <p className="etiqueta">Error 404</p>
        <h1>Esta página no existe</h1>
        <p>Revisa el enlace o vuelve al inicio.</p>
        <Link to="/" className="boton boton-primario boton-ancho">
          Ir al inicio
        </Link>
      </section>
    </div>
  );
}
