import type { CSSProperties } from "react";

export type TipoIconoAnimado =
  | "rayo"
  | "tienda"
  | "camion"
  | "carrera"
  | "ecosistema"
  | "robot"
  | "metricas"
  | "proyeccion"
  | "trofeo"
  | "estudiante"
  | "docente"
  | "documento";

interface Props {
  tipo: TipoIconoAnimado;
  tamano?: number;
  className?: string;
  color?: string;
  animarAlHover?: boolean;
}

export function IconoAnimado({
  tipo,
  tamano = 32,
  className = "",
  color,
  animarAlHover = false,
}: Props) {
  const estiloContenedor: CSSProperties = {
    width: `${tamano}px`,
    height: `${tamano}px`,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    verticalAlign: "middle",
  };

  const claseAnimacion = `icono-lottie icono-lottie-${tipo} ${
    animarAlHover ? "animar-hover" : "animar-loop"
  } ${className}`;

  switch (tipo) {
    case "rayo":
      return (
        <span className={claseAnimacion} style={estiloContenedor} aria-hidden="true">
          <svg viewBox="0 0 48 48" width={tamano} height={tamano} fill="none">
            <path
              className="anim-rayo-cuerpo"
              d="M26 4L10 26H24L22 44L38 22H24L26 4Z"
              fill={color || "#f26a3d"}
              stroke="#d94f24"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <circle className="anim-rayo-destello" cx="24" cy="24" r="20" stroke="#ffd166" strokeWidth="2" strokeDasharray="4 6" opacity="0.6" />
          </svg>
        </span>
      );

    case "tienda":
      return (
        <span className={claseAnimacion} style={estiloContenedor} aria-hidden="true">
          <svg viewBox="0 0 48 48" width={tamano} height={tamano} fill="none">
            <path
              d="M8 18H40V38C40 40.2 38.2 42 36 42H12C9.8 42 8 40.2 8 38V18Z"
              fill="#fff0eb"
              stroke={color || "#f26a3d"}
              strokeWidth="2.5"
            />
            <path
              className="anim-tienda-toldo"
              d="M6 18L10 8H38L42 18H6Z"
              fill="#f26a3d"
              stroke="#d94f24"
              strokeWidth="2.5"
            />
            <path d="M14 18V22C14 24.2 12.2 26 10 26C7.8 26 6 24.2 6 22V18" fill="#ffd166" />
            <path d="M22 18V22C22 24.2 20.2 26 18 26C15.8 26 14 24.2 14 22V18" fill="#f26a3d" />
            <path d="M30 18V22C30 24.2 28.2 26 26 26C23.8 26 22 24.2 22 22V18" fill="#ffd166" />
            <path d="M38 18V22C38 24.2 36.2 26 34 26C31.8 26 30 24.2 30 22V18" fill="#f26a3d" />
            <path d="M42 18V22C42 24.2 40.2 26 38 26C35.8 26 34 24.2 34 22V18" fill="#ffd166" />
            <rect x="20" y="28" width="8" height="14" rx="2" fill="#dff2ec" stroke="#1f7a6a" strokeWidth="2" />
          </svg>
        </span>
      );

    case "camion":
      return (
        <span className={claseAnimacion} style={estiloContenedor} aria-hidden="true">
          <svg viewBox="0 0 48 48" width={tamano} height={tamano} fill="none">
            <rect className="anim-camion-caja" x="4" y="14" width="26" height="20" rx="3" fill="#f26a3d" stroke="#d94f24" strokeWidth="2.5" />
            <path d="M30 20H38L44 26V34H30V20Z" fill="#ffd166" stroke="#d94f24" strokeWidth="2.5" />
            <rect x="33" y="22" width="6" height="5" rx="1" fill="#fff" />
            <circle className="anim-camion-rueda" cx="13" cy="36" r="4.5" fill="#14201f" stroke="#fff" strokeWidth="2" />
            <circle className="anim-camion-rueda" cx="37" cy="36" r="4.5" fill="#14201f" stroke="#fff" strokeWidth="2" />
          </svg>
        </span>
      );

    case "carrera":
      return (
        <span className={claseAnimacion} style={estiloContenedor} aria-hidden="true">
          <svg viewBox="0 0 48 48" width={tamano} height={tamano} fill="none">
            <circle className="anim-corredor-cabeza" cx="32" cy="10" r="5" fill="#1f7a6a" />
            <path
              className="anim-corredor-cuerpo"
              d="M26 18L30 24L24 30L26 40"
              stroke="#1f7a6a"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              className="anim-corredor-pierna"
              d="M30 24L38 28L34 38"
              stroke="#1f7a6a"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M20 22L28 19L36 21"
              stroke="#f26a3d"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <line className="anim-carrera-linea1" x1="4" y1="42" x2="44" y2="42" stroke="#e4dccd" strokeWidth="3" strokeDasharray="6 4" />
          </svg>
        </span>
      );

    case "ecosistema":
      return (
        <span className={claseAnimacion} style={estiloContenedor} aria-hidden="true">
          <svg viewBox="0 0 48 48" width={tamano} height={tamano} fill="none">
            <path
              className="anim-eco-tallo"
              d="M24 42V20C24 16 28 12 36 10C36 18 32 22 24 24"
              stroke="#2b8a3e"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              className="anim-eco-hoja"
              d="M24 28C18 28 14 24 12 18C20 18 24 22 24 28Z"
              fill="#8ce99a"
              stroke="#2b8a3e"
              strokeWidth="2"
            />
            <circle cx="36" cy="10" r="3" fill="#ffd166" />
            <path d="M10 42H38" stroke="#868e96" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </span>
      );

    case "robot":
      return (
        <span className={claseAnimacion} style={estiloContenedor} aria-hidden="true">
          <svg viewBox="0 0 48 48" width={tamano} height={tamano} fill="none">
            <rect className="anim-robot-cabeza" x="10" y="14" width="28" height="24" rx="6" fill="#e7ecff" stroke="#3b5bdb" strokeWidth="2.5" />
            <circle cx="19" cy="24" r="3" fill="#3b5bdb" />
            <circle cx="29" cy="24" r="3" fill="#3b5bdb" />
            <path d="M18 32C20 34 28 34 30 32" stroke="#3b5bdb" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="24" y1="14" x2="24" y2="8" stroke="#3b5bdb" strokeWidth="2.5" strokeLinecap="round" />
            <circle className="anim-robot-antena" cx="24" cy="6" r="3" fill="#f26a3d" />
            <rect x="6" y="22" width="4" height="8" rx="2" fill="#3b5bdb" />
            <rect x="38" y="22" width="4" height="8" rx="2" fill="#3b5bdb" />
          </svg>
        </span>
      );

    case "metricas":
      return (
        <span className={claseAnimacion} style={estiloContenedor} aria-hidden="true">
          <svg viewBox="0 0 48 48" width={tamano} height={tamano} fill="none">
            <rect className="anim-barra-1" x="8" y="24" width="7" height="18" rx="2" fill="#dff2ec" stroke="#1f7a6a" strokeWidth="2" />
            <rect className="anim-barra-2" x="20" y="14" width="7" height="28" rx="2" fill="#ffd166" stroke="#f08c00" strokeWidth="2" />
            <rect className="anim-barra-3" x="32" y="8" width="7" height="34" rx="2" fill="#fff0eb" stroke="#f26a3d" strokeWidth="2" />
            <path
              className="anim-linea-tendencia"
              d="M11 20L23 11L36 6"
              stroke="#2b8a3e"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="2 3"
            />
          </svg>
        </span>
      );

    case "proyeccion":
      return (
        <span className={claseAnimacion} style={estiloContenedor} aria-hidden="true">
          <svg viewBox="0 0 48 48" width={tamano} height={tamano} fill="none">
            <rect x="6" y="8" width="36" height="24" rx="4" fill="#14201f" stroke="#4a5c59" strokeWidth="2" />
            <circle className="anim-haz-luz" cx="24" cy="20" r="6" fill="#ffd166" />
            <path d="M18 32L12 42M30 32L36 42M24 32V42" stroke="#4a5c59" strokeWidth="3" strokeLinecap="round" />
            <path
              className="anim-ondas"
              d="M10 14L4 10M38 14L44 10"
              stroke="#f26a3d"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </span>
      );

    case "trofeo":
      return (
        <span className={claseAnimacion} style={estiloContenedor} aria-hidden="true">
          <svg viewBox="0 0 48 48" width={tamano} height={tamano} fill="none">
            <path
              className="anim-trofeo-copa"
              d="M14 10H34V22C34 27.5 29.5 32 24 32C18.5 32 14 27.5 14 22V10Z"
              fill="#ffd166"
              stroke="#c26a00"
              strokeWidth="2.5"
            />
            <path d="M14 14H8C6.9 14 6 14.9 6 16V18C6 21.3 8.7 24 12 24H14" stroke="#c26a00" strokeWidth="2" />
            <path d="M34 14H40C41.1 14 42 14.9 42 16V18C42 21.3 39.3 24 36 24H34" stroke="#c26a00" strokeWidth="2" />
            <rect x="21" y="32" width="6" height="6" fill="#c26a00" />
            <rect x="16" y="38" width="16" height="4" rx="2" fill="#868e96" />
            <circle className="anim-brillo" cx="24" cy="18" r="2.5" fill="#fff" />
          </svg>
        </span>
      );

    case "estudiante":
      return (
        <span className={claseAnimacion} style={estiloContenedor} aria-hidden="true">
          <svg viewBox="0 0 48 48" width={tamano} height={tamano} fill="none">
            <circle cx="24" cy="16" r="8" fill="#ffd166" stroke="#d94f24" strokeWidth="2" />
            <path
              d="M10 40C10 32.3 16.3 26 24 26C31.7 26 38 32.3 38 40"
              fill="#dff2ec"
              stroke="#1f7a6a"
              strokeWidth="2.5"
            />
            <path d="M14 12L24 6L34 12L24 17L14 12Z" fill="#1f7a6a" />
          </svg>
        </span>
      );

    case "docente":
      return (
        <span className={claseAnimacion} style={estiloContenedor} aria-hidden="true">
          <svg viewBox="0 0 48 48" width={tamano} height={tamano} fill="none">
            <rect x="6" y="8" width="36" height="26" rx="3" fill="#1f7a6a" stroke="#14201f" strokeWidth="2" />
            <line x1="12" y1="16" x2="26" y2="16" stroke="#dff2ec" strokeWidth="2" strokeLinecap="round" />
            <line x1="12" y1="22" x2="32" y2="22" stroke="#dff2ec" strokeWidth="2" strokeLinecap="round" />
            <path d="M18 34L14 42M30 34L34 42" stroke="#14201f" strokeWidth="3" strokeLinecap="round" />
            <circle className="anim-docente-puntero" cx="34" cy="14" r="3" fill="#ffd166" />
          </svg>
        </span>
      );

    case "documento":
      return (
        <span className={claseAnimacion} style={estiloContenedor} aria-hidden="true">
          <svg viewBox="0 0 48 48" width={tamano} height={tamano} fill="none">
            <path
              d="M12 8C12 6.9 12.9 6 14 6H28L36 14V40C36 41.1 35.1 42 34 42H14C12.9 42 12 41.1 12 40V8Z"
              fill="#fff"
              stroke="#68728c"
              strokeWidth="2.5"
            />
            <path d="M28 6V14H36" fill="#e7ecff" stroke="#68728c" strokeWidth="2" />
            <line x1="18" y1="22" x2="30" y2="22" stroke="#3b5bdb" strokeWidth="2" strokeLinecap="round" />
            <line x1="18" y1="28" x2="30" y2="28" stroke="#3b5bdb" strokeWidth="2" strokeLinecap="round" />
            <line x1="18" y1="34" x2="24" y2="34" stroke="#3b5bdb" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
      );
  }
}
