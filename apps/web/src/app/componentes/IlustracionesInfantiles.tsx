/** Ilustraciones propias en SVG: misma forma y color en todos los dispositivos. */
export function InsigniaSalon({ grado, tamano = 40 }: { grado: number; tamano?: number }) {
  const verde = grado >= 5;
  const azul = grado >= 3 && grado < 5;
  const tinta = verde ? '#426b37' : azul ? '#346b88' : '#b7502c';
  const fondo = verde ? '#e0eccb' : azul ? '#dcecf0' : '#fae4cd';
  return (
    <svg className="insignia-salon" width={tamano} height={tamano} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="58" height="58" rx="19" fill={fondo} />
      {verde ? <g stroke={tinta} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M32 49V26M32 36C19 37 16 28 17 22C27 21 32 26 32 36Z" fill="#9abd70" /><path d="M32 29C32 18 40 14 49 15C49 25 42 31 32 29Z" fill="#6e9e54" /><path d="M21 50H43" /></g> : azul ? <g stroke={tinta} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 17H46V47H18Z" fill="#fffdf7" /><path d="M24 25H40M24 32H36M24 39H40M23 13V20M32 13V20M41 13V20" /><path d="M42 45L50 37" stroke="#d29238" strokeWidth="5" /></g> : <g stroke={tinta} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M25 21V17C25 11 39 11 39 17V21" /><rect x="17" y="20" width="30" height="32" rx="10" fill="#e89759" /><rect x="23" y="34" width="18" height="12" rx="4" fill="#fff3d8" /><path d="M24 28H40M28 39H36" /></g>}
    </svg>
  );
}

export function AvatarExplorador({ semilla, tamano = 48 }: { semilla: string; tamano?: number }) {
  const hash = Array.from(semilla).reduce((n, c) => n + c.charCodeAt(0), 0);
  const tipo = hash % 3;
  const colores = [{ fondo: '#f8e5c9', cara: '#e6ad6e', tinta: '#80542f' }, { fondo: '#e2ecd3', cara: '#a6bc7c', tinta: '#43633f' }, { fondo: '#dcebed', cara: '#87b7c0', tinta: '#335f73' }];
  const c = colores[hash % colores.length]!;
  return (
    <svg className={`avatar-explorador avatar-explorador-${tipo}`} width={tamano} height={tamano} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="60" height="60" rx="21" fill={c.fondo} />
      {tipo === 0 ? <><ellipse cx="24" cy="19" rx="7" ry="13" fill={c.cara} /><ellipse cx="40" cy="19" rx="7" ry="13" fill={c.cara} /><path d="M24 11V24M40 11V24" stroke="#fff5dc" strokeWidth="4" strokeLinecap="round" /></> : tipo === 1 ? <><circle cx="17" cy="24" r="9" fill={c.cara} /><circle cx="47" cy="24" r="9" fill={c.cara} /><circle cx="17" cy="24" r="4" fill={c.fondo} /><circle cx="47" cy="24" r="4" fill={c.fondo} /></> : <><path d="M15 31L17 11L32 23L47 11L49 31" fill={c.cara} /><path d="M20 23L21 18L26 24M38 24L43 18L44 23" stroke={c.fondo} strokeWidth="3" strokeLinejoin="round" /></>}
      <ellipse cx="32" cy="37" rx="20" ry="18" fill={c.cara} />
      <ellipse cx="32" cy="43" rx="12" ry="9" fill="#fff9e9" />
      <g className="avatar-explorador-ojos" fill={c.tinta}><circle cx="25" cy="34" r="2.5" /><circle cx="39" cy="34" r="2.5" /></g>
      <path d="M29 40Q32 37 35 40L32 43Z" fill={c.tinta} />
      <path d="M27 46Q32 51 37 46" stroke={c.tinta} strokeWidth="2" strokeLinecap="round" />
      <circle cx="20" cy="41" r="3" fill="#d7866e" opacity=".55" /><circle cx="44" cy="41" r="3" fill="#d7866e" opacity=".55" />
    </svg>
  );
}

export function TrazoEstrella({ className = '' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M24 5L29 18L43 19L32 28L35 42L24 34L12 42L15 28L5 19L19 18Z" fill="currentColor" /><path d="M19 25L22 28L29 20" stroke="#fffdf3" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
