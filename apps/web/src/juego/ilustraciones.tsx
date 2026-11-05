import type { CSSProperties } from "react";

export type Categoria = "aguas" | "gaseosas" | "jugos";
export const categorias: Record<string, { nombre: string; singular: string; color: string; claro: string }> = {
  aguas: { nombre: "Agua", singular: "agua", color: "#267ea9", claro: "#e0f3fa" },
  gaseosas: { nombre: "Gaseosa", singular: "gaseosa", color: "#bd4b5f", claro: "#fce9e9" },
  jugos: { nombre: "Jugo", singular: "jugo", color: "#bd641d", claro: "#fff0d8" },
};
export function estiloCategoria(id: string): CSSProperties {
  const c = categorias[id] ?? categorias.aguas!;
  return { "--category": c.color, "--category-light": c.claro } as CSSProperties;
}

export function Producto({ categoria, className = "" }: { categoria: string; className?: string }) {
  if (categoria === "jugos") return <svg className={`product-art ${className}`} viewBox="0 0 70 96" fill="none" aria-hidden="true">
    <path d="m18 20 9-13h25l9 13v63c0 4-3 6-6 6H24c-4 0-6-2-6-6z" fill="#ffb951" />
    <path d="M18 20h43v63c0 4-3 6-6 6H24c-4 0-6-2-6-6z" fill="#ef9d35" />
    <path d="M18 20h33v69H24c-4 0-6-2-6-6z" fill="#ffc66f" />
    <path d="M27 7h25l9 13H18z" fill="#ffe3a9" /><path d="M51 20v69" stroke="#d98a32" strokeWidth="2" />
    <rect x="24" y="32" width="22" height="38" rx="7" fill="#fff9e9" />
    <circle cx="35" cy="52" r="9" fill="#ed8c2d" /><path d="M35 43c0-5 6-8 11-6-1 5-5 7-11 6" fill="#6b923e" />
    <path d="M43 13V4h13" stroke="#77a44a" strokeWidth="5" strokeLinecap="round" />
    <path d="M24 77h20" stroke="#e89a43" strokeWidth="3" strokeLinecap="round" />
  </svg>;
  const agua = categoria === "aguas";
  return <svg className={`product-art ${className}`} viewBox="0 0 70 96" fill="none" aria-hidden="true">
    <rect x="24" y="5" width="22" height="11" rx="3" fill={agua ? "#348fbd" : "#ab3857"} />
    <path d="M25 16v8c0 6-11 8-11 19v39c0 6 5 9 21 9s21-3 21-9V43c0-11-11-13-11-19v-8" fill={agua ? "#a9dff2" : "#d76d7a"} />
    <path d="M25 18v7c0 7-10 9-10 20v34" stroke={agua ? "#e6f8ff" : "#f7b8b9"} strokeWidth="4" strokeLinecap="round" />
    <path d="M19 40h32M19 78h32" stroke={agua ? "#72b8d6" : "#ba4a61"} strokeWidth="3" />
    <rect x="15" y="46" width="40" height="26" rx="4" fill={agua ? "#eafaff" : "#fff1e7"} />
    {agua ? <path d="M35 50c-2 4-8 9-8 13a8 8 0 0 0 16 0c0-4-6-9-8-13" fill="#3a97c2" /> : <g fill="#c44d63"><circle cx="32" cy="59" r="5" /><circle cx="41" cy="64" r="3" /><circle cx="40" cy="53" r="2" /></g>}
    <path d="M27 8v5m5-5v5m6-5v5m5-5v5" stroke={agua ? "#67b2d1" : "#d66d84"} strokeWidth="1.5" />
  </svg>;
}

export function Icono({ nombre, size = 24 }: { nombre: "play" | "pause" | "sound" | "mute" | "help" | "close" | "arrow" | "check" | "star" | "hand" | "home"; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    play: <path d="m9 5 11 7-11 7z" fill="currentColor" strokeLinejoin="round" />,
    pause: <><path d="M8 5v14M16 5v14" strokeWidth="4" /></>,
    sound: <><path d="M11 4 5 9H2v6h3l6 5zM16 8a6 6 0 0 1 0 8M19 4a11 11 0 0 1 0 16" /></>,
    mute: <><path d="M11 4 5 9H2v6h3l6 5zM17 9l5 6m0-6-5 6" /></>,
    help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4M12 17h.01" /></>,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    arrow: <path d="M4 12h15m-6-6 6 6-6 6" />,
    check: <path d="m5 12 4 4L19 6" />,
    star: <path d="m12 3 2.8 5.7L21 9.6l-4.5 4.3 1 6.1-5.5-2.9L6.5 20l1-6.1L3 9.6l6.2-.9z" fill="currentColor" strokeLinejoin="round" />,
    hand: <><path d="M9 11V5a2 2 0 0 1 4 0v6l2-1 5 3v4c0 4-2 5-6 5h-2l-7-7a2 2 0 0 1 3-3l1 1" /></>,
    home: <><path d="m3 10 9-7 9 7M5 9v11h14V9M10 20v-6h4v6" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[nombre]}</svg>;
}

export function Camion({ lleno = false }: { lleno?: boolean }) {
  return <svg viewBox="0 0 116 65" fill="none" aria-hidden="true">
    <rect x="5" y="9" width="65" height="39" rx="6" fill="#1f7a6a" />
    {lleno && <><rect x="14" y="19" width="20" height="20" rx="3" fill="#d0ed82" /><rect x="39" y="19" width="20" height="20" rx="3" fill="#f6ca6c" /></>}
    <path d="M70 24h22l17 17v9H70z" fill="#f26a3d" /><path d="M78 29h11l10 11H78z" fill="#eff9fc" />
    <rect x="2" y="46" width="109" height="7" rx="3" fill="#18594f" />
    <circle cx="25" cy="53" r="10" fill="#413751" /><circle cx="25" cy="53" r="4" fill="#fff6df" />
    <circle cx="91" cy="53" r="10" fill="#413751" /><circle cx="91" cy="53" r="4" fill="#fff6df" />
    <circle cx="96" cy="43" r="2" fill="#fff6df" />
  </svg>;
}
