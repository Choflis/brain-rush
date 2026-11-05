import { Link, useParams } from "react-router-dom";

export function Pendiente({ tarea, detalle }: { tarea: string; detalle: string }) {
  const { codigo } = useParams<{ codigo: string }>();

  return (
    <div className="centrado">
      <section className="tarjeta tarjeta-login">
        <p className="etiqueta">Ruta reservada · {tarea}</p>
        <h1>{detalle}</h1>
        <p>
          Esta pantalla pertenece al motor y la experiencia del alumno. La ruta ya está registrada
          para que Choflis la implemente sin tocar el resto del esqueleto.
        </p>
        {codigo && (
          <p>
            Código recibido: <code>{codigo}</code>
          </p>
        )}
        <Link to="/docente" className="boton boton-primario boton-ancho">
          Volver al panel
        </Link>
      </section>
    </div>
  );
}
