import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Rol } from "./api";

export type Sesion = {
  token: string;
  rol: Rol;
  nombre: string;
  alumnoId?: string;
  claseId?: string;
};

type ContextoSesion = {
  sesion: Sesion | null;
  iniciarDocente: (nombre?: string) => void;
  iniciarAlumno: (token: string, nombre?: string, alumnoId?: string, claseId?: string) => void;
  cerrar: () => void;
};

const CLAVE = "br.sesion";

function leerSesion(): Sesion | null {
  try {
    const crudo = localStorage.getItem(CLAVE);
    if (!crudo) return null;
    const datos = JSON.parse(crudo) as Partial<Sesion>;
    if (typeof datos.token !== "string" || datos.token.length === 0) return null;
    const nombreLimpio =
      !datos.nombre || datos.nombre === "Docente demo" || datos.nombre === "Docente"
        ? "Prof. Carlos Mendoza"
        : datos.nombre;
    return {
      token: datos.token,
      rol: datos.rol === "alumno" ? "alumno" : "docente",
      nombre: datos.rol === "alumno" ? (typeof datos.nombre === "string" ? datos.nombre : "Alumno") : nombreLimpio,
      alumnoId: typeof datos.alumnoId === "string" ? datos.alumnoId : undefined,
      claseId: typeof datos.claseId === "string" ? datos.claseId : undefined,
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

  const iniciarDocente = useCallback((nombre?: string) => {
    const nueva: Sesion = {
      token: "demo-docente",
      rol: "docente",
      nombre: nombre || "Prof. Carlos Mendoza",
    };
    guardarSesion(nueva);
    setSesion(nueva);
  }, []);

  const iniciarAlumno = useCallback(
    (token: string, nombre?: string, alumnoId?: string, claseId?: string) => {
      const nueva: Sesion = {
        token: token || `token-alu-${Date.now()}`,
        rol: "alumno",
        nombre: nombre || "Alumno",
        alumnoId,
        claseId,
      };
      guardarSesion(nueva);
      setSesion(nueva);
    },
    [],
  );

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
