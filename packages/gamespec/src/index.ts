// Esquema GameSpec v1, tipos y validador compartidos entre API y web.
// Ver docs/especificacion/03-arquitectura-tecnica.md, sección 5.
export const SPEC_VERSION = "1.0" as const;

export type Tipo = "activacion" | "complemento";
export type Mecanica = "recorrido" | "emparejar" | "clasificar" | "secuencia" | "decision";
