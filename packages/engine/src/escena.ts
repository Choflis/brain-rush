import "./polyfill.ts";
import Phaser from "phaser";
import type { GameSpec } from "@brain-rush/gamespec";
import {
  EmisorEventosMotor,
  type EventoFin,
  type EventoInicio,
  type EventoRespuesta
} from "./eventos.ts";
import { CapaFeedback } from "./feedback.ts";
import { colorHexANumero, resolverVisual } from "./visuales.ts";

export interface ConfiguracionEscenaBase {
  spec: GameSpec;
  versionId: string;
  juegoId?: string;
  alumnoId?: string;
  salaId?: string;
  emisor?: EmisorEventosMotor;
  duracionTutorialMs?: number;
  key?: string;
}

/**
 * Escena base de Phaser para los juegos educativos de BRAIN RUSH.
 *
 * Responsabilidades:
 * - Recibir el GameSpec y el identificador de versión.
 * - Mostrar el tutorial durante ~3 segundos usando la animación del spec (sin texto obligatorio).
 * - Emitir 'inicio' al terminar el tutorial.
 * - Exponer métodos para emitir 'respuesta' y cerrar con 'fin'.
 * - Proveer la capa visual de retroalimentación (CapaFeedback).
 * - Estrictamente sin fetch ni uso de localStorage.
 */
export class EscenaBase extends Phaser.Scene {
  public readonly spec: GameSpec;
  public readonly versionId: string;
  public readonly juegoId: string;
  public readonly alumnoId?: string;
  public readonly salaId?: string;
  public readonly emisor: EmisorEventosMotor;
  public readonly duracionTutorialMs: number;
  public readonly feedback: CapaFeedback;

  public tutorialFinalizado: boolean = false;
  public tiempoInicioTutorial: number = 0;
  public tiempoInicioJuego: number = 0;
  public aciertos: number = 0;
  public totalItems: number = 0;
  public readonly respuestasEmitidas: EventoRespuesta[] = [];

  private tutorialContainer: Phaser.GameObjects.Container | null = null;
  private tutorialTimerId: unknown = null;

  constructor(
    configOrSpec: ConfiguracionEscenaBase | GameSpec,
    maybeVersionId?: string,
    opciones?: Partial<ConfiguracionEscenaBase>
  ) {
    let conf: ConfiguracionEscenaBase;

    if (configOrSpec && typeof configOrSpec === "object" && "spec" in configOrSpec) {
      conf = configOrSpec;
    } else {
      const spec = configOrSpec as GameSpec;
      conf = {
        spec,
        versionId: maybeVersionId ?? "v1",
        ...opciones
      };
    }

    super({ key: conf.key ?? "EscenaBase" });

    this.spec = conf.spec;
    this.versionId = conf.versionId ?? "v1";
    this.juegoId = conf.juegoId ?? this.spec?.titulo ?? "juego";
    this.alumnoId = conf.alumnoId;
    this.salaId = conf.salaId;
    this.emisor = conf.emisor ?? new EmisorEventosMotor();
    this.duracionTutorialMs = conf.duracionTutorialMs ?? 3000;
    this.feedback = new CapaFeedback(this);

    // Calcular el total de ítems declarados en todos los niveles
    this.totalItems = this.calcularTotalItems();
  }

  /**
   * Precarga la mascota de tiendita para usarla como guía en todos los juegos.
   */
  preload(): void {
    if (this.load && typeof this.load.image === "function") {
      this.load.image("mascota-tiendita", "/juego/tiendita/mascota.png");
    }
  }

  /**
   * Ciclo de inicialización de Phaser Scene.
   */
  create(): void {
    this.crearEscenario();
    this.iniciarTutorial();
  }

  /**
   * Dibuja los elementos base del escenario (color de fondo y personaje).
   */
  protected crearEscenario(): void {
    if (!this.add) return;

    const ancho = this.cameras?.main?.width ?? 800;
    const alto = this.cameras?.main?.height ?? 600;

    // Fondo del escenario
    const visualEscenario = resolverVisual(this.spec.escenario.id);
    const colorFondo = colorHexANumero(visualEscenario.color);

    const bg = this.add.graphics();
    bg.fillStyle(0xfbfbef, 1);
    bg.fillRect(0, 0, ancho, alto);
    bg.fillStyle(colorFondo, 0.15);
    bg.fillRect(0, 0, ancho, alto);

    // Barra superior con título y personaje
    const barra = this.add.graphics();
    barra.fillStyle(0xfffcf6, 0.95);
    barra.fillRoundedRect(16, 12, ancho - 32, 50, 10);
    barra.lineStyle(2, 0xe4dccd, 1);
    barra.strokeRoundedRect(16, 12, ancho - 32, 50, 10);

    // Mascota de tiendita como guía visual
    if (this.textures && this.textures.exists("mascota-tiendita")) {
      const mascota = this.add.image(46, 37, "mascota-tiendita");
      mascota.setDisplaySize(40, 40);
      mascota.setOrigin(0.5);
    } else {
      const visualPersonaje = resolverVisual(this.spec.personaje.id);
      this.add
        .text(32, 37, `${visualPersonaje.emoji} ${this.spec.personaje.nombre}`, {
          fontSize: "18px",
          color: "#4a5c59",
          fontStyle: "bold"
        })
        .setOrigin(0, 0.5);
    }

    this.add
      .text(ancho / 2, 37, this.spec.titulo, {
        fontSize: "18px",
        color: "#14201f",
        fontStyle: "bold"
      })
      .setOrigin(0.5, 0.5);
  }

  /**
   * Muestra la pantalla del tutorial durante ~3 segundos y luego emite 'inicio'.
   */
  public iniciarTutorial(): void {
    this.tiempoInicioTutorial = Date.now();
    this.tutorialFinalizado = false;

    if (!this.add) {
      // Entorno headless: programar finalización mediante temporizador estándar
      this.programarFinTutorial();
      return;
    }

    const ancho = this.cameras?.main?.width ?? 800;
    const alto = this.cameras?.main?.height ?? 600;

    this.tutorialContainer = this.add.container(ancho / 2, alto / 2);

    // Capa de atenuación oscura
    const fondoOscuro = this.add.graphics();
    fondoOscuro.fillStyle(0x000000, 0.65);
    fondoOscuro.fillRect(-ancho / 2, -alto / 2, ancho, alto);
    this.tutorialContainer.add(fondoOscuro);

    // Tarjeta del tutorial
    const visualAnim = resolverVisual(this.spec.tutorial.animacion);
    const colorTarjeta = colorHexANumero(visualAnim.color);

    const tarjeta = this.add.graphics();
    tarjeta.fillStyle(0xffffff, 1);
    tarjeta.fillRoundedRect(-220, -140, 440, 280, 16);
    tarjeta.lineStyle(4, colorTarjeta, 1);
    tarjeta.strokeRoundedRect(-220, -140, 440, 280, 16);
    this.tutorialContainer.add(tarjeta);

    // Animación / representación visual del tutorial
    const animEmoji = this.add
      .text(0, -50, visualAnim.emoji, {
        fontSize: "64px",
        align: "center"
      })
      .setOrigin(0.5);
    this.tutorialContainer.add(animEmoji);

    // Animación suave del emoji para simular la dinámica del tutorial
    if (this.tweens) {
      this.tweens.add({
        targets: animEmoji,
        y: -40,
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut"
      });
    }

    // Nombre de la animación o acción
    const labelAnim = this.add
      .text(0, 20, visualAnim.nombre ?? "Tutorial", {
        fontSize: "18px",
        color: "#14201f",
        fontStyle: "bold",
        align: "center"
      })
      .setOrigin(0.5);
    this.tutorialContainer.add(labelAnim);

    // Texto opcional del tutorial (solo si está presente en el spec)
    if (this.spec.tutorial.texto) {
      const textoTutorial = this.add
        .text(0, 60, this.spec.tutorial.texto, {
          fontSize: "16px",
          color: "#4a5c59",
          align: "center",
          wordWrap: { width: 380 }
        })
        .setOrigin(0.5);
      this.tutorialContainer.add(textoTutorial);
    }

    // Indicador sutil de inicio automático
    const pieTutorial = this.add
      .text(0, 110, "¡Preparados!", {
        fontSize: "14px",
        color: "#4a5c59",
        fontStyle: "italic",
        align: "center"
      })
      .setOrigin(0.5);
    this.tutorialContainer.add(pieTutorial);

    this.programarFinTutorial();
  }

  private programarFinTutorial(): void {
    if (this.time && typeof this.time.delayedCall === "function") {
      this.time.delayedCall(this.duracionTutorialMs, () => {
        this.finalizarTutorial();
      });
    } else {
      this.tutorialTimerId = setTimeout(() => {
        this.finalizarTutorial();
      }, this.duracionTutorialMs);
    }
  }

  /**
   * Finaliza el tutorial, retira sus elementos visuales y emite el evento 'inicio'.
   */
  public finalizarTutorial(): void {
    if (this.tutorialFinalizado) {
      return;
    }
    this.tutorialFinalizado = true;
    this.tiempoInicioJuego = Date.now();

    if (this.tutorialTimerId) {
      clearTimeout(this.tutorialTimerId as any);
      this.tutorialTimerId = null;
    }

    if (this.tutorialContainer) {
      if (this.tweens) {
        this.tweens.add({
          targets: this.tutorialContainer,
          alpha: 0,
          duration: 300,
          ease: "Power2",
          onComplete: () => {
            try {
              this.tutorialContainer?.destroy();
              this.tutorialContainer = null;
            } catch {
              // Ignorar
            }
          }
        });
      } else {
        try {
          this.tutorialContainer.destroy();
          this.tutorialContainer = null;
        } catch {
          // Ignorar
        }
      }
    }

    // Emisión del evento de inicio según el contrato
    const eventoInicio: EventoInicio = {
      tipo: "inicio",
      juegoId: this.juegoId,
      versionId: this.versionId,
      mecanica: this.spec.mecanica,
      iniciadoEn: new Date(this.tiempoInicioJuego).toISOString()
    };

    if (this.alumnoId) {
      eventoInicio.alumnoId = this.alumnoId;
    }
    if (this.salaId) {
      eventoInicio.salaId = this.salaId;
    }

    this.emisor.emitir(eventoInicio);
  }

  /**
   * Emite un evento de 'respuesta' al resolver un ítem.
   * Regla del contrato: se emite una vez por ítem jugado, con su criterio,
   * evaluación de correcto/incorrecto, tiempo en ms e intentos acumulados.
   */
  public emitirRespuesta(datos: {
    itemId: string;
    criterio: string;
    correcto: boolean;
    tiempoMs: number;
    intentos: number;
  }): void {
    const evento: EventoRespuesta = {
      tipo: "respuesta",
      itemId: datos.itemId,
      criterio: datos.criterio,
      correcto: datos.correcto,
      tiempoMs: datos.tiempoMs,
      intentos: datos.intentos
    };

    this.respuestasEmitidas.push(evento);
    if (datos.correcto) {
      this.aciertos++;
    }

    this.emisor.emitir(evento);
  }

  /**
   * Emite el evento de 'fin' cerrando la sesión del juego.
   * Si no se proporcionan datos específicos, utiliza los acumulados por la escena.
   */
  public cerrarConFin(datos?: {
    aciertos?: number;
    total?: number;
    duracionMs?: number;
    completado?: boolean;
  }): void {
    const total = datos?.total ?? this.totalItems;
    const aciertos = datos?.aciertos ?? this.aciertos;
    const duracionMs =
      datos?.duracionMs ??
      (this.tiempoInicioJuego > 0 ? Math.max(0, Date.now() - this.tiempoInicioJuego) : 0);
    const completado = datos?.completado ?? aciertos >= total;

    const evento: EventoFin = {
      tipo: "fin",
      aciertos,
      total,
      duracionMs,
      completado
    };

    this.emisor.emitir(evento);
  }

  /**
   * Calcula el número total de ítems sumando los ítems de todos los niveles del spec.
   */
  public calcularTotalItems(): number {
    if (!this.spec?.niveles || !Array.isArray(this.spec.niveles)) {
      return 0;
    }
    return this.spec.niveles.reduce((acumulado, nivel) => {
      const cantidad = Array.isArray(nivel?.items) ? nivel.items.length : 0;
      return acumulado + cantidad;
    }, 0);
  }
}
