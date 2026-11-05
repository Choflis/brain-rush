/**
 * Resolvedor visual de assets para el motor de juego.
 * Mapea assetId → { emoji, color, forma } permitiendo que el motor
 * funcione y se dibuje completamente sin requerir archivos SVG/PNG.
 */

export type FormaVisual =
  | "rectangulo"
  | "circulo"
  | "cuadrado"
  | "estrella"
  | "triangulo"
  | "capsula";

export interface RepresentacionVisual {
  emoji: string;
  color: string;
  forma: FormaVisual;
  nombre?: string;
}

/**
 * Catálogo de representaciones visuales para los assets definidos en los fixtures
 * y en el catálogo oficial de BRAIN RUSH (packages/assets/catalogo.json).
 */
export const CATALOGO_VISUAL: Record<string, RepresentacionVisual> = {
  // --- Personaje ---
  "personaje-reglita": {
    emoji: "📏",
    color: "#FFD54F",
    forma: "rectangulo",
    nombre: "Reglita"
  },

  // --- Fixture N1: Escenario y Tutorial Tienda ---
  "escenario-tiendita": {
    emoji: "🏪",
    color: "#81C784",
    forma: "rectangulo",
    nombre: "Tiendita del aula"
  },
  "anim-tutorial-tienda": {
    emoji: "🛒",
    color: "#4FC3F7",
    forma: "rectangulo",
    nombre: "Tutorial de la tiendita"
  },

  // --- Fixture N1: Estanterías ---
  "estanteria-gaseosas": {
    emoji: "🥤",
    color: "#EF5350",
    forma: "rectangulo",
    nombre: "Estantería de gaseosas"
  },
  "estanteria-aguas": {
    emoji: "💧",
    color: "#29B6F6",
    forma: "rectangulo",
    nombre: "Estantería de aguas"
  },
  "estanteria-jugos": {
    emoji: "🧃",
    color: "#FFA726",
    forma: "rectangulo",
    nombre: "Estantería de jugos"
  },
  "estanteria-bebidas": {
    emoji: "🥤",
    color: "#42A5F5",
    forma: "rectangulo",
    nombre: "Estantería para bebidas"
  },
  "estanteria-galletas": {
    emoji: "🍪",
    color: "#8D6E63",
    forma: "rectangulo",
    nombre: "Estantería para galletas"
  },

  // --- Fixture N1: Productos ---
  "producto-gaseosa": {
    emoji: "🥤",
    color: "#E53935",
    forma: "circulo",
    nombre: "Botella de gaseosa"
  },
  "producto-agua": {
    emoji: "💧",
    color: "#039BE5",
    forma: "circulo",
    nombre: "Botella de agua"
  },
  "producto-jugo": {
    emoji: "🧃",
    color: "#FB8C00",
    forma: "cuadrado",
    nombre: "Caja de jugo"
  },
  "producto-galleta": {
    emoji: "🍪",
    color: "#6D4C41",
    forma: "circulo",
    nombre: "Paquete de galletas"
  },
  "producto-leche": {
    emoji: "🥛",
    color: "#ECEFF1",
    forma: "rectangulo",
    nombre: "Caja de leche"
  },

  // --- Fixture N1: Meta y Animaciones Tienda ---
  "camion-reparto": {
    emoji: "🚚",
    color: "#FFA726",
    forma: "rectangulo",
    nombre: "Camión de reparto"
  },
  "anim-camion-lleno": {
    emoji: "🎉",
    color: "#66BB6A",
    forma: "rectangulo",
    nombre: "Camión lleno"
  },
  "anim-caja-registradora": {
    emoji: "🛎️",
    color: "#FFCA28",
    forma: "circulo",
    nombre: "Caja registradora"
  },

  // --- Fixture N2: Escenario y Tutorial Carrera ---
  "escenario-patio": {
    emoji: "🏫",
    color: "#A5D6A7",
    forma: "rectangulo",
    nombre: "Patio de la escuela"
  },
  "anim-tutorial-escalera": {
    emoji: "🪜",
    color: "#26A69A",
    forma: "rectangulo",
    nombre: "Tutorial escalera de conversión"
  },

  // --- Fixture N2: Objetos y Guardian ---
  "puerta-guardian": {
    emoji: "🚪",
    color: "#5D4037",
    forma: "rectangulo",
    nombre: "Puerta del guardián"
  },
  "objeto-lapiz": {
    emoji: "✏️",
    color: "#FDD835",
    forma: "rectangulo",
    nombre: "Lápiz"
  },
  "objeto-cuerda": {
    emoji: "🪢",
    color: "#8D6E63",
    forma: "circulo",
    nombre: "Cuerda enrollada"
  },
  "objeto-pizarra": {
    emoji: "📋",
    color: "#2E7D32",
    forma: "rectangulo",
    nombre: "Pizarra de aula"
  },
  "objeto-puerta": {
    emoji: "🚪",
    color: "#795548",
    forma: "rectangulo",
    nombre: "Puerta del aula"
  },
  "objeto-mesa": {
    emoji: "🪑",
    color: "#BCAAA4",
    forma: "rectangulo",
    nombre: "Mesa de aula"
  },
  "objeto-cuaderno": {
    emoji: "📓",
    color: "#5C6BC0",
    forma: "rectangulo",
    nombre: "Cuaderno"
  },

  // --- Fixture N2: Iconos y Animaciones Carrera ---
  "icono-por-10": {
    emoji: "✖️",
    color: "#42A5F5",
    forma: "circulo",
    nombre: "Botón multiplicar por 10"
  },
  "icono-entre-10": {
    emoji: "➗",
    color: "#AB47BC",
    forma: "circulo",
    nombre: "Botón dividir entre 10"
  },
  "icono-escalera-unidades": {
    emoji: "🪜",
    color: "#26A69A",
    forma: "rectangulo",
    nombre: "Escalera de unidades métricas"
  },
  "anim-salto-puerta": {
    emoji: "🦘",
    color: "#FF7043",
    forma: "circulo",
    nombre: "Salto de puerta"
  },
  "anim-pista-escalera": {
    emoji: "💡",
    color: "#FFEE58",
    forma: "estrella",
    nombre: "Pista en escalera"
  },

  // --- Retroalimentaciones comunes ---
  "anim-estrella": {
    emoji: "⭐",
    color: "#FFD700",
    forma: "estrella",
    nombre: "Estrella de acierto"
  },
  "anim-aplauso": {
    emoji: "👏",
    color: "#4CAF50",
    forma: "circulo",
    nombre: "Aplauso de acierto"
  },

  // --- Alias habituales para categorías o metas ---
  "camion": {
    emoji: "🚚",
    color: "#FFA726",
    forma: "rectangulo",
    nombre: "Camión colectivo"
  },
  "gaseosas": {
    emoji: "🥤",
    color: "#EF5350",
    forma: "rectangulo",
    nombre: "Categoría gaseosas"
  },
  "aguas": {
    emoji: "💧",
    color: "#29B6F6",
    forma: "rectangulo",
    nombre: "Categoría aguas"
  },
  "jugos": {
    emoji: "🧃",
    color: "#FFA726",
    forma: "rectangulo",
    nombre: "Categoría jugos"
  }
};

/**
 * Representación por defecto cuando se consulta un asset desconocido.
 * Garantiza que el motor nunca falle por un asset ausente.
 */
export const VISUAL_POR_DEFECTO: RepresentacionVisual = {
  emoji: "📦",
  color: "#9E9E9E",
  forma: "cuadrado",
  nombre: "recurso"
};

/**
 * Determina si un id de asset está explícitamente registrado en el catálogo visual.
 */
export function tieneVisual(assetId: string): boolean {
  return Object.prototype.hasOwnProperty.call(CATALOGO_VISUAL, assetId);
}

/**
 * Resuelve un assetId a su representación visual { emoji, color, forma }.
 * Si el assetId no está registrado, devuelve una representación por defecto segura.
 */
export function resolverVisual(assetId: string): RepresentacionVisual {
  const visual = CATALOGO_VISUAL[assetId];
  if (visual) {
    return visual;
  }
  return {
    ...VISUAL_POR_DEFECTO,
    nombre: assetId
  };
}

/**
 * Convierte un color hexadecimal '#RRGGBB' o '0xRRGGBB' al valor numérico 0xRRGGBB
 * que utiliza Phaser.GameObjects.Graphics.
 */
export function colorHexANumero(hex: string): number {
  const limpio = hex.replace(/^#/, "").replace(/^0x/, "");
  const num = parseInt(limpio, 16);
  return isNaN(num) ? 0x9e9e9e : num;
}
