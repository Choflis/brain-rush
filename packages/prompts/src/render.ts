export function renderizar(plantilla: string, vars: Record<string, string>): string {
  const salida = plantilla.replace(/\{\{(\w+)\}\}/g, (_, clave: string) => {
    if (!(clave in vars)) throw new Error(`Falta la variable {{${clave}}}`);
    return vars[clave]!;
  });
  return salida;
}
