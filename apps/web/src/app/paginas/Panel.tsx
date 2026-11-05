import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, ErrorApi, type JuegoResumen, type PanelJuego } from "../api";
import { useSesion } from "../sesion";

type Estado = "cargando" | "listo" | "error";

export function Panel() {
  const { sesion } = useSesion();
  const [juegos, setJuegos] = useState<JuegoResumen[]>([]);
  const [estado, setEstado] = useState<Estado>("cargando");
  const [mensaje, setMensaje] = useState("");
  const [juegoActivo, setJuegoActivo] = useState<string | null>(null);
  const [panel, setPanel] = useState<PanelJuego | null>(null);
  const [cargandoPanel, setCargandoPanel] = useState(false);

  const cargar = useCallback(async () => {
    if (!sesion) return;
    setEstado("cargando");
    try {
      const datos = await api.listarJuegos(sesion.token);
      setJuegos(datos.juegos);
      setEstado("listo");
    } catch (error) {
      setMensaje(
        error instanceof ErrorApi
          ? error.message
          : "No se pudieron cargar los juegos. Revisa que la API esté corriendo.",
      );
      setEstado("error");
    }
  }, [sesion]);

  const abrirPanel = useCallback(
    async (juegoId: string) => {
      if (!sesion) return;
      setJuegoActivo(juegoId);
      setCargandoPanel(true);
      setPanel(null);
      try {
        const datos = await api.panel(juegoId, sesion.token);
        setPanel(datos);
      } catch (error) {
        setMensaje(error instanceof ErrorApi ? error.message : "No se pudo cargar el panel.");
      } finally {
        setCargandoPanel(false);
      }
    },
    [sesion],
  );

  useEffect(() => {
    void cargar();
  }, [cargar]);

  return (
    <div className="panel">
      <header className="panel-cabecera">
        <div>
          <p className="etiqueta">Panel docente</p>
          <h1>Mis juegos</h1>
          <p className="suave">
            Cada juego nace de una sesión de aprendizaje y conserva sus criterios.
          </p>
        </div>
        <button type="button" className="boton boton-fantasma" onClick={() => void cargar()}>
          Actualizar
        </button>
      </header>

      {estado === "cargando" && <p className="estado-carga">Cargando juegos…</p>}

      {estado === "error" && (
        <div className="aviso aviso-error" role="alert">
          <strong>No se pudo conectar con la API.</strong>
          <p>{mensaje}</p>
          <p className="suave">
            En local, inicia la API con <code>npm run dev:api</code> en el puerto 8787.
          </p>
          <button type="button" className="boton boton-primario" onClick={() => void cargar()}>
            Reintentar
          </button>
        </div>
      )}

      {estado === "listo" && juegos.length === 0 && (
        <div className="aviso">
          <strong>Todavía no hay juegos publicados.</strong>
          <p>
            La carga de sesiones y la generación llegan con U4. Mientras tanto, el motor de juego
            usa los fixtures de <code>fixtures/juegos/</code>.
          </p>
        </div>
      )}

      {estado === "listo" && juegos.length > 0 && (
        <div className="tabla-envoltura">
          <table className="tabla">
            <thead>
              <tr>
                <th>Juego</th>
                <th>Tipo</th>
                <th>Mecánica</th>
                <th>Nivel</th>
                <th>Versión</th>
                <th>Estado</th>
                <th>Código</th>
              </tr>
            </thead>
            <tbody>
              {juegos.map((juego) => (
                <tr
                  key={juego.id}
                  onClick={() => void abrirPanel(juego.id)}
                  style={{ cursor: "pointer" }}
                  className={juegoActivo === juego.id ? "fila-activa" : ""}
                >
                  <td>
                    <strong>{juego.titulo}</strong>
                  </td>
                  <td>{juego.tipo === "activacion" ? "Activación" : "Complemento"}</td>
                  <td>{juego.mecanica}</td>
                  <td>{juego.nivel}</td>
                  <td>v{juego.versionActual}</td>
                  <td>
                    <span className={`pastilla pastilla-${juego.estado}`}>{juego.estado}</span>
                  </td>
                  <td>
                    <Link to={`/j/${juego.codigo}`} className="enlace-codigo">
                      {juego.codigo}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {juegoActivo && (
        <section className="seccion">
          <h2>Resultados · {panel?.juego.titulo ?? juegoActivo}</h2>
          {cargandoPanel && <p className="estado-carga">Cargando resultados…</p>}
          {panel && (
            <>
              <p className="suave">
                {panel.participacion.alumnos} alumnos · {panel.participacion.intentos} intentos ·{" "}
                {panel.participacion.completados} completados
              </p>
              <div className="tabla-envoltura">
                <table className="tabla">
                  <thead>
                    <tr>
                      <th>Criterio</th>
                      <th>Aciertos</th>
                      <th>Total</th>
                      <th>Porcentaje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {panel.porCriterio.map((c) => (
                      <tr key={c.criterio}>
                        <td>
                          <strong>{c.criterio}</strong> · {c.texto}
                        </td>
                        <td>{c.aciertos}</td>
                        <td>{c.total}</td>
                        <td>{Math.round(c.porcentaje * 100)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {panel.riesgo.length > 0 && (
                <>
                  <h3>Alumnos en riesgo</h3>
                  <ul className="lista-simple">
                    {panel.riesgo.map((r) => (
                      <li key={r.alumnoId}>
                        {r.nombre} · {r.aciertos}/{r.total} · {r.criteriosBajos.join(", ")}
                      </li>
                    ))}
                  </ul>
                </>
              )}
              <p>
                <button
                  type="button"
                  className="boton boton-fantasma"
                  onClick={async () => {
                    if (!sesion) return;
                    const r = await fetch(
                      `${import.meta.env.VITE_API_URL ?? "http://localhost:8787"}/api/panel/${encodeURIComponent(
                        juegoActivo,
                      )}.csv`,
                      { headers: { Authorization: `Bearer ${sesion.token}` } },
                    );
                    const blob = await r.blob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `brain-rush-${juegoActivo}.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  Descargar CSV
                </button>
              </p>
            </>
          )}
        </section>
      )}

      <section className="seccion">
        <h2>Lo que sigue en este panel</h2>
        <ul className="lista-simple">
          <li>Revisar la sesión extraída y sus criterios.</li>
          <li>Ver el juego generado antes de publicarlo.</li>
          <li>Resultados por criterio, alumnos en riesgo y exportación CSV.</li>
        </ul>
      </section>
    </div>
  );
}
