import { useEffect, useState } from 'react';
import { ReglitaInteractiva } from '../app/componentes/ReglitaInteractiva';
import { Icono } from './ilustraciones';

type Props = {
  ronda: number;
  colocados: number;
  seleccionado: boolean;
  error: boolean;
  completa: boolean;
  pausada: boolean;
  pedido: boolean;
  contando: boolean;
};

/** Capa expresiva: observa la partida y nunca decide respuestas ni tiempos educativos. */
export function CompaneraReglita({ ronda, colocados, seleccionado, error, completa, pausada, pedido, contando }: Props) {
  const [camina, setCamina] = useState(true);
  const [celebra, setCelebra] = useState(false);
  useEffect(() => {
    if (pausada) return;
    setCamina(true);
    const timer = setTimeout(() => setCamina(false), 1600);
    return () => clearTimeout(timer);
  }, [ronda, pausada]);
  useEffect(() => {
    if (!colocados && !completa) { setCelebra(false); return; }
    setCamina(false);
    setCelebra(true);
    const timer = setTimeout(() => setCelebra(false), 850);
    return () => clearTimeout(timer);
  }, [colocados, completa]);
  const accion = error ? 'ayudar' : celebra || completa ? 'celebrar' : seleccionado ? 'observar' : camina ? 'caminar' : 'esperar';
  const frase = error ? 'Sin prisa. Mira el dibujo y prueba otra vez.' : completa ? '¡Lo logramos! Vamos con otro reparto.' : celebra ? '¡Así se hace! Un pasito más.' : contando ? 'Cuenta conmigo. ¿Cuántos hay?' : seleccionado ? '¡Te sigo! Busca su lugar.' : pedido ? '¡Vamos a preparar ese pedido!' : '¡Abrimos la tienda! ¿Me ayudas a ordenar?';
  return (
    <aside className="companera-reglita" data-accion={accion} data-pausa={pausada ? 'true' : 'false'} aria-label="Reglita te acompaña en la tienda">
      <div className="companera-nombre"><span className="companera-punto" /> Tu compañera <strong>Reglita</strong></div>
      <div className="companera-escenario">
        <div className="companera-pasos" aria-hidden="true"><i /><i /><i /></div>
        <div className="companera-paseo"><ReglitaInteractiva compacta caminando={accion === 'caminar'} /></div>
        <span className="companera-sombra" aria-hidden="true" />
        <span className="companera-brillo companera-brillo-a" aria-hidden="true"><Icono nombre="star" size={32} /></span>
        <span className="companera-brillo companera-brillo-b" aria-hidden="true"><Icono nombre="star" size={24} /></span>
      </div>
      <div className="companera-dialogo"><span>{frase}</span></div>
    </aside>
  );
}
