import { Navigate, useNavigate } from "react-router-dom";
import { useSesion } from "../sesion";

export function Login({ destino }: { destino: string }) {
  const { sesion, iniciarDocente } = useSesion();
  const navegar = useNavigate();

  if (sesion) return <Navigate to={destino} replace />;

  return (
    <div className="centrado">
      <section className="tarjeta tarjeta-login">
        <p className="etiqueta">Acceso demo</p>
        <h1>Panel docente</h1>
        <p>
          En esta etapa no hay contraseña. Entra con el usuario demo para revisar los juegos
          generados y sus resultados.
        </p>
        <button
          type="button"
          className="boton boton-primario boton-grande boton-ancho"
          onClick={() => {
            iniciarDocente();
            navegar(destino, { replace: true });
          }}
        >
          Entrar como docente
        </button>
        <small>
          El token demo es <code>demo-docente</code>. Cuando llegue la autenticación real, este
          botón se reemplaza por el inicio de sesión del colegio.
        </small>
      </section>
    </div>
  );
}
