import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Rol } from "./api";

export type Sesion = { token: string; rol: Rol; nombre: string };

type ContextoSesion = {
  sesion: Sesion | null;
  iniciarDocente: () => void;
  iniciarAlumno: (token: string) => void;
  cerrar: () => void;
};

const CLAVE = "br.sesion";

function leerSesion(): Sesion | null {
  try {
    const crudo = localStorage.getItem(CLAVE);
    if (!crudo) return null;
    const datos = JSON.parse(crudo) as Partial<Sesion>;
    if (typeof datos.token !== "string" || datos.token.length === 0) return null;
    return {
      token: datos.token,
      rol: datos.rol === "alumno" ? "alumno" : "docente",
      nombre: typeof datos.nombre === "string" ? datos.nombre : "Docente demo",
    };
  } catch {
    return null;
  }
}

function guardarSesion(sesion: Sesion | null) {
  if (sesion) localStorage.setItem(CLAVE, JSON.stringify(sesion));
  else localStorage.removeItem(CLAVE);
}

const Ctx = createContext<ContextoSesion | null>(null);

export function ProveedorSesion({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Sesion | null>(leerSesion);

  const iniciarDocente = useCallback(() => {
    const nueva: Sesion = { token: "demo-docente", rol: "docente", nombre: "Docente demo" };
    guardarSesion(nueva);
    setSesion(nueva);
  }, []);

  const iniciarAlumno = useCallback((token: string) => {
    const nueva: Sesion = { token, rol: "alumno", nombre: "Alumno" };
    guardarSesion(nueva);
    setSesion(nueva);
  }, []);

  const cerrar = useCallback(() => {
    guardarSesion(null);
    setSesion(null);
  }, []);

  const valor = useMemo(
    () => ({ sesion, iniciarDocente, iniciarAlumno, cerrar }),
    [sesion, iniciarDocente, iniciarAlumno, cerrar],
  );

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useSesion(): ContextoSesion {
  const valor = useContext(Ctx);
  if (!valor) throw new Error("useSesion debe usarse dentro de ProveedorSesion");
  return valor;
}
