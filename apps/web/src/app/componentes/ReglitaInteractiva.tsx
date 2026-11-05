import { useEffect, useId, useRef, useState } from 'react';
import './reglita-interactiva.css';

type Props = { className?: string; compacta?: boolean; leyendo?: boolean; posicionLectura?: number; interactiva?: boolean; caminando?: boolean };

/** La imagen original se conserva; la mirada se dibuja en su misma coordenada. */
export function ReglitaInteractiva({ className = '', compacta = false, leyendo = false, posicionLectura = 0, interactiva = true, caminando = false }: Props) {
  const figura = useRef<HTMLButtonElement>(null);
  const ojos = useRef<SVGGElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saludo, setSaludo] = useState(false);
  const id = useId();
  const leyendoRef = useRef(leyendo);
  leyendoRef.current = leyendo;

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let x = 0;
    let y = 0;
    const centrar = () => {
      cancelAnimationFrame(frame);
      ojos.current?.setAttribute('transform', 'translate(0 0)');
      if (figura.current) figura.current.style.transform = '';
    };
    const mover = (event: PointerEvent) => {
      if (media.matches || leyendoRef.current || event.pointerType === 'touch') return;
      x = event.clientX; y = event.clientY;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = figura.current?.getBoundingClientRect();
        if (!rect || rect.bottom < 0 || rect.top > window.innerHeight) return;
        const dx = Math.max(-1, Math.min(1, (x - rect.left - rect.width / 2) / 400));
        const dy = Math.max(-1, Math.min(1, (y - rect.top - rect.height * .32) / 350));
        ojos.current?.setAttribute('transform', `translate(${dx * 13} ${dy * 10})`);
        if (figura.current) figura.current.style.transform = `rotate(${dx * 2}deg)`;
      });
    };
    window.addEventListener('pointermove', mover, { passive: true });
    document.documentElement.addEventListener('pointerleave', centrar);
    window.addEventListener('blur', centrar);
    media.addEventListener('change', centrar);
    return () => {
      cancelAnimationFrame(frame);
      if (timer.current) clearTimeout(timer.current);
      window.removeEventListener('pointermove', mover);
      document.documentElement.removeEventListener('pointerleave', centrar);
      window.removeEventListener('blur', centrar);
      media.removeEventListener('change', centrar);
    };
  }, []);

  useEffect(() => {
    const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dx = -11 + Math.min(1, Math.max(0, posicionLectura / 18)) * 22;
    ojos.current?.setAttribute('transform', leyendo && !reducir ? `translate(${dx} 12)` : 'translate(0 0)');
    if (figura.current) figura.current.style.transform = leyendo && !reducir ? 'rotate(-2deg)' : '';
  }, [leyendo, posicionLectura]);

  function saludar() {
    if (timer.current) clearTimeout(timer.current);
    setSaludo(true);
    timer.current = setTimeout(() => setSaludo(false), 2600);
  }

  return (
    <div className={`reglita-interactiva ${compacta ? 'reglita-compacta' : ''} ${caminando ? 'reglita-caminando' : ''} ${className}`} data-estado={leyendo ? 'leyendo' : 'esperando'} aria-hidden={!interactiva || undefined}>
      <button ref={figura} type="button" className={`reglita-saludo ${saludo ? 'reglita-celebra' : ''}`} onClick={saludar} disabled={!interactiva} aria-label="Saludar a Reglita">
        <span className="reglita-figura">
          <img src="/juego/tiendita/mascota.png" alt="Reglita, tu compañera verde de aventuras" draggable={false} className={caminando ? "reglita-torso" : undefined} />
          {caminando && <><img className="reglita-pierna reglita-pierna-izquierda" src="/juego/tiendita/mascota.png" alt="" draggable={false} /><img className="reglita-pierna reglita-pierna-derecha" src="/juego/tiendita/mascota.png" alt="" draggable={false} /></>}
          <svg viewBox="0 0 1300 1189" className="reglita-mirada" aria-hidden="true">
            <defs>
              <radialGradient id={`${id}-iris`}><stop offset=".5" stopColor="#1c5136" /><stop offset=".85" stopColor="#509766" /><stop offset="1" stopColor="#244f35" /></radialGradient>
              <radialGradient id={`${id}-blanco`}><stop stopColor="#f8f7f8" /><stop offset="1" stopColor="#e5e4e6" /></radialGradient>
            </defs>
            <ellipse cx="595" cy="394" rx="51" ry="56" fill={`url(#${id}-blanco)`} />
            <ellipse cx="749" cy="374" rx="51" ry="56" fill={`url(#${id}-blanco)`} />
            <g ref={ojos} data-reglita-iris transform="translate(0 0)">
              {[{ x: 595, y: 394 }, { x: 749, y: 374 }].map(({ x, y }) => (
                <g key={x}>
                  <ellipse cx={x} cy={y} rx="43" ry="47" fill={`url(#${id}-iris)`} />
                  <ellipse cx={x} cy={y + 1} rx="25" ry="30" fill="#07160f" />
                  <circle cx={x + 13} cy={y - 18} r="9" fill="white" />
                </g>
              ))}
            </g>
          </svg>
        </span>
      </button>
      <span className={`reglita-bocadillo ${saludo ? 'visible' : ''}`} role={saludo ? "status" : undefined} aria-live="polite">{saludo ? '¡Chócala! Aprendamos juntos.' : ''}</span>
      {!compacta && <span className="reglita-invitacion">Soy Reglita. ¡Toca mi mano!</span>}
    </div>
  );
}
