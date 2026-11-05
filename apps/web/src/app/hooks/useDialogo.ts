import { useEffect, useRef } from 'react';

/** Escape, foco contenido y devolución al activador sin reiniciar por cada render. */
export function useDialogo(abierto: boolean, cerrar: () => void, modal = true) {
  const ref = useRef<HTMLDivElement>(null);
  const onCerrar = useRef(cerrar);
  onCerrar.current = cerrar;
  useEffect(() => {
    if (!abierto || !ref.current) return;
    const nodo = ref.current;
    const anterior = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    if (modal) document.body.style.overflow = 'hidden';
    const controles = () => [...nodo.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), iframe, [tabindex="0"]')].filter(e => e.getClientRects().length > 0);
    const frame = requestAnimationFrame(() => controles()[0]?.focus());
    function tecla(event: KeyboardEvent) {
      if (!modal && !nodo.contains(document.activeElement) && event.key !== 'Escape') return;
      if (!modal && event.key === 'Escape' && document.querySelector('[aria-modal="true"]')) return;
      if (event.key === 'Escape') { event.preventDefault(); onCerrar.current(); }
      if (!modal || event.key !== 'Tab') return;
      const elementos = controles(), primero = elementos[0], ultimo = elementos.at(-1);
      if (!primero || !ultimo) { event.preventDefault(); return; }
      if (!nodo.contains(document.activeElement) || event.shiftKey && document.activeElement === primero) { event.preventDefault(); (event.shiftKey ? ultimo : primero).focus(); }
      else if (!event.shiftKey && document.activeElement === ultimo) { event.preventDefault(); primero.focus(); }
    }
    document.addEventListener('keydown', tecla);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', tecla);
      if (modal) document.body.style.overflow = overflow;
      if (anterior?.isConnected) anterior.focus({ preventScroll: true });
    };
  }, [abierto, modal]);
  return ref;
}
