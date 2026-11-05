import "./polyfill.ts";
import Phaser from "phaser";
import { colorHexANumero } from "./visuales.ts";

export type TipoFeedbackOk = "estrella" | "aplauso";
export type TipoFeedbackError = "pista";
export type TipoFeedback = TipoFeedbackOk | TipoFeedbackError;

export interface OpcionesFeedback {
  x?: number;
  y?: number;
  texto?: string;
  duracionMs?: number;
}

export interface ConfiguracionVisualFeedback {
  emoji: string;
  colorHex: string;
  forma: "estrella" | "circulo" | "rectangulo";
  textoPorDefecto: string;
}

export const CONFIG_FEEDBACK: Record<TipoFeedback, ConfiguracionVisualFeedback> = {
  estrella: {
    emoji: "⭐",
    colorHex: "#FFD700",
    forma: "estrella",
    textoPorDefecto: "¡Muy bien!"
  },
  aplauso: {
    emoji: "👏",
    colorHex: "#4CAF50",
    forma: "circulo",
    textoPorDefecto: "¡Excelente!"
  },
  pista: {
    emoji: "💡",
    colorHex: "#FFA726",
    forma: "rectangulo",
    textoPorDefecto: "Pista: ¡intenta otra vez!"
  }
};

/**
 * Capa visual de retroalimentación en Phaser.
 * Acierto: estrella o aplauso.
 * Error: pista.
 * Utiliza formas geométricas y colores sin depender de archivos de imagen externos,
 * garantizando que nunca falle por un asset ausente.
 */
export class CapaFeedback {
  private escena: Phaser.Scene;

  constructor(escena: Phaser.Scene) {
    this.escena = escena;
  }

  /**
   * Muestra la retroalimentación visual en pantalla.
   */
  mostrar(tipo: TipoFeedback, opciones?: OpcionesFeedback): Phaser.GameObjects.Container | null {
    // Si la escena no tiene subsistema de objetos gráficos (por ejemplo en entorno de pruebas headless),
    // no emitimos error.
    if (!this.escena?.add) {
      return null;
    }

    const conf = CONFIG_FEEDBACK[tipo] ?? CONFIG_FEEDBACK.estrella;
    const duracion = opciones?.duracionMs ?? 1600;
    const textoMostrar = opciones?.texto ?? conf.textoPorDefecto;

    const anchoCamara = this.escena.cameras?.main?.width ?? 800;
    const altoCamara = this.escena.cameras?.main?.height ?? 600;
    const x = opciones?.x ?? anchoCamara / 2;
    const y = opciones?.y ?? altoCamara / 2;

    const contenedor = this.escena.add.container(x, y);
    contenedor.setDepth(1000);

    // Fondo y borde vectoriales
    const colorNum = colorHexANumero(conf.colorHex);
    const graficos = this.escena.add.graphics();

    // Fondo semitransparente oscuro detrás del cartel
    graficos.fillStyle(0x000000, 0.4);
    graficos.fillRoundedRect(-140, -60, 280, 120, 20);

    // Placa de color del feedback
    graficos.fillStyle(colorNum, 0.95);
    graficos.fillRoundedRect(-135, -55, 270, 110, 16);
    graficos.lineStyle(3, 0xffffff, 1);
    graficos.strokeRoundedRect(-135, -55, 270, 110, 16);

    contenedor.add(graficos);

    // Emoji central
    const textoEmoji = this.escena.add
      .text(0, -18, conf.emoji, {
        fontSize: "36px",
        align: "center"
      })
      .setOrigin(0.5);
    contenedor.add(textoEmoji);

    // Texto de retroalimentación
    const textoMensaje = this.escena.add
      .text(0, 25, textoMostrar, {
        fontSize: "18px",
        color: "#ffffff",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 3,
        align: "center"
      })
      .setOrigin(0.5);
    contenedor.add(textoMensaje);

    // Animación de entrada y salida con tweens si está disponible
    if (this.escena.tweens) {
      contenedor.setScale(0.3);
      contenedor.setAlpha(0);

      this.escena.tweens.add({
        targets: contenedor,
        scale: 1,
        alpha: 1,
        duration: 250,
        ease: "Back.easeOut",
        onComplete: () => {
          if (this.escena.time) {
            this.escena.time.delayedCall(duracion, () => {
              this.desvanecerYDestruir(contenedor);
            });
          } else {
            setTimeout(() => {
              this.desvanecerYDestruir(contenedor);
            }, duracion);
          }
        }
      });
    } else {
      setTimeout(() => {
        try {
          contenedor.destroy();
        } catch {
          // Ignorar si ya fue destruido
        }
      }, duracion);
    }

    return contenedor;
  }

  /**
   * Atajo para mostrar acierto ("estrella" o "aplauso").
   */
  mostrarAcierto(tipo: TipoFeedbackOk = "estrella", opciones?: OpcionesFeedback): Phaser.GameObjects.Container | null {
    return this.mostrar(tipo, opciones);
  }

  /**
   * Atajo para mostrar error ("pista").
   */
  mostrarError(pista?: string, opciones?: OpcionesFeedback): Phaser.GameObjects.Container | null {
    return this.mostrar("pista", { ...opciones, texto: pista });
  }

  private desvanecerYDestruir(contenedor: Phaser.GameObjects.Container): void {
    if (this.escena.tweens) {
      this.escena.tweens.add({
        targets: contenedor,
        alpha: 0,
        scale: 0.8,
        duration: 250,
        ease: "Power2",
        onComplete: () => {
          try {
            contenedor.destroy();
          } catch {
            // Ignorar
          }
        }
      });
    } else {
      try {
        contenedor.destroy();
      } catch {
        // Ignorar
      }
    }
  }
}
