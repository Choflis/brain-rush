import { useRef, useState, type KeyboardEvent } from 'react';

const colores = [
  { nombre: 'verde', valor: '#1f7a6a' },
  { nombre: 'naranja', valor: '#d94f24' },
  { nombre: 'amarillo', valor: '#ffd166' },
  { nombre: 'azul', valor: '#4483a2' },
];
const TOTAL = 60;

export function Mosaico({ extendido = false }: { extendido?: boolean }) {
  const [pintura, setPintura] = useState(0);
  const [casillas, setCasillas] = useState<(number | null)[]>(() => Array(TOTAL).fill(null));
  const [activa, setActiva] = useState(0);
  const botones = useRef<(HTMLButtonElement | null)[]>([]);
  const pintadas = casillas.filter(c => c !== null).length;
  function pintar(index: number) {
    setCasillas(old => old[index] === pintura ? old : old.map((c, i) => i === index ? pintura : c));
  }
  function teclado(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const columnas = getComputedStyle(event.currentTarget.parentElement!).gridTemplateColumns.split(" ").length;
    const movimientos: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowUp: -columnas, ArrowDown: columnas, Home: -index, End: TOTAL - 1 - index };
    if (!(event.key in movimientos)) return;
    event.preventDefault();
    const siguiente = Math.max(0, Math.min(TOTAL - 1, index + movimientos[event.key]!));
    setActiva(siguiente);
    botones.current[siguiente]?.focus();
  }
  return (
    <section className={`mosaico ${extendido ? "mosaico-extendido" : ""}`} aria-labelledby="mosaico-titulo">
      <div className="mosaico-cabecera">
        <div><span className="mini-etiqueta">Un recreo creativo</span><h2 id="mosaico-titulo">¡Deja tu huella de color!</h2></div>
        <span className="mosaico-contador" aria-live="off">{pintadas}<span> / {TOTAL}</span></span>
      </div>
      <p id="mosaico-ayuda">Elige un color y pasa el cursor o toca los cuadritos. ¿Qué vas a dibujar?</p>
      <div className="mosaico-cuadros" role="group" aria-label="Mosaico para pintar" aria-describedby="mosaico-ayuda">
        {casillas.map((color, index) => (
          <button key={index} ref={el => { botones.current[index] = el; }} type="button"
            className={`mosaico-casilla ${color !== null ? 'pintada' : ''}`}
            style={{ backgroundColor: color === null ? undefined : colores[color]!.valor }}
            aria-label={`Casilla ${index + 1}, ${color === null ? 'sin pintar' : colores[color]!.nombre}`}
            tabIndex={activa === index ? 0 : -1}
            onFocus={() => setActiva(index)} onKeyDown={e => teclado(e, index)}
            onPointerEnter={e => { if (e.pointerType === 'mouse') pintar(index); }}
            onClick={() => pintar(index)} />
        ))}
      </div>
      <div className="mosaico-herramientas">
        <div className="mosaico-paleta" role="group" aria-label="Colores del pincel">
          {colores.map((c, i) => <button key={c.nombre} type="button" className="mosaico-color" style={{ backgroundColor: c.valor }} aria-label={`Pintar de ${c.nombre}`} aria-pressed={pintura === i} onClick={() => setPintura(i)}>{pintura === i ? <span aria-hidden="true">✓</span> : null}</button>)}
        </div>
        <button type="button" className="mosaico-borrar" onClick={() => setCasillas(Array(TOTAL).fill(null))}>Borrar mosaico <span aria-hidden="true">↺</span></button>
      </div>
    </section>
  );
}
