const trazos = {
  inicio: 'M3 10 12 3l9 7v10H3V10Zm6 10v-7h6v7',
  libro: 'M12 5C8 2 4 3 2 4v15c3-1 6-1 10 2 4-3 7-3 10-2V4c-2-1-6-2-10 1Zm0 0v16',
  alumnos: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM2 21v-3a7 7 0 0 1 14 0v3m1-17a4 4 0 0 1 0 8m2 3a6 6 0 0 1 3 6',
  buscar: 'M10 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm5-2 6 6',
  panel: 'M3 4h18v16H3V4Zm6 0v16m-4-9h2',
  flecha: 'M4 12h16m-6-6 6 6-6 6',
  cerrar: 'm6 6 12 12M6 18 18 6',
  lista: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  grilla: 'M3 3h7v7H3V3Zm11 0h7v7h-7V3ZM3 14h7v7H3v-7Zm11 0h7v7h-7v-7Z',
  apoyo: 'M12 9v4m0 4h.01M10 3 1 20h22L14 3h-4Z',
  check: 'm5 12 4 4L20 5',
  pantalla: 'M3 3h18v14H3V3Zm9 14v5m-5 0h10m-8-12 2 2 4-5',
  salir: 'M9 3H3v18h6m4-15 6 6-6 6m-5-6h14',
};
export function IconoDocente({ tipo, tamano = 20 }: { tipo: keyof typeof trazos; tamano?: number }) {
  return <svg width={tamano} height={tamano} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={trazos[tipo]} /></svg>;
}
