import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./app/App";
import { ProveedorSesion } from "./app/sesion";
import "@fontsource-variable/nunito";
import "./app/estilos.css";
import "./app/aventura.css";
import "./app/acceso-infantil.css";

const raiz = document.getElementById("root");
if (!raiz) throw new Error("Falta el contenedor #root en index.html");

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js");
  });
}

createRoot(raiz).render(
  <StrictMode>
    <BrowserRouter>
      <ProveedorSesion>
        <App />
      </ProveedorSesion>
    </BrowserRouter>
  </StrictMode>,
);
