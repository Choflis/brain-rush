import { useEffect, useState } from 'react';
import { aulaVirtual } from './aulaVirtual';

export function useAulaVirtual() {
  const [estado, setEstado] = useState(() => aulaVirtual.obtenerTodo());
  useEffect(() => {
    const actualizar = () => setEstado(aulaVirtual.obtenerTodo());
    window.addEventListener('brainrush:aula-actualizada', actualizar);
    window.addEventListener('storage', actualizar);
    return () => {
      window.removeEventListener('brainrush:aula-actualizada', actualizar);
      window.removeEventListener('storage', actualizar);
    };
  }, []);
  return estado;
}
