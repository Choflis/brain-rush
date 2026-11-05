import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./app/App";
import { ProveedorSesion } from "./app/sesion";
import "./app/estilos.css";

const raiz = document.getElementById("root");
if (!raiz) throw new Error("Falta el contenedor #root en index.html");

createRoot(raiz).render(
  <StrictMode>
    <BrowserRouter>
      <ProveedorSesion>
        <App />
      </ProveedorSesion>
    </BrowserRouter>
  </StrictMode>,
);
