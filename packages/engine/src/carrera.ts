import "./polyfill.ts";
import Phaser from "phaser";
import type { GameSpec, ItemCarrera, Unidad } from "@brain-rush/gamespec";
import { UNIDADES } from "@brain-rush/gamespec";
import { EscenaBase, type ConfiguracionEscenaBase } from "./escena.ts";
import { resolverVisual } from "./visuales.ts";

/** Intentos por ítem antes de revelar la respuesta (ver docs/especificacion/08-contrato.md, sección 7). */
const MAX_INTENTOS_CARRERA = 2;

const FUENTE_SISTEMA = "'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', sans-serif";
const COLOR_TINTA = "#14201f";
const COLOR_MUTED = "#4a5c59";
const COLOR_NARANJA = "#f26a3d";
const COLOR_VERDE = "#1f7a6a";
const COLOR_LINEA = 0xe4dccd;
const COLOR_PAPEL = 0xfffcf6;
const COLOR_NARANJA_HEX = 0xf26a3d;
const COLOR_VERDE_HEX = 0x1f7a6a;

/**
 * Redondea un valor numérico a 6 decimales para evitar artefactos
 * de punto flotante en multiplicaciones y divisiones sucesivas.
 */
export function redondearValor(num: number): number {
  return Math.round((num + Number.EPSILON) * 1000000) / 1000000;
}

/**
 * Escena de la mecánica "Carrera" (N2, juego de complemento).
 *
 * Reglita convierte medidas usando los botones ×10 y ÷10, visualiza el
 * desplazamiento sobre la escalera métrica de unidades y arrastra el
 * resultado obtenido hacia la puerta del guardián.
 *
 * Emite los eventos del motor:
 * - 'inicio' al terminar el tutorial.
 * - 'respuesta' con correcto true/false, criterio y tiempo acumulado por ítem.
 * - 'fin' al completar todos los ítems de los niveles.
 */
export class MecanicaCarrera extends EscenaBase {
  public readonly items: ItemCarrera[];
  public indiceItemActual: number = 0;
  public itemActual: ItemCarrera | null = null;
  public valorActual: number = 0;
  public unidadActual: Unidad = "m";
  public unidadActualIndex: number = 3;
  public intentosItemActual: number = 1;
  public tiempoInicioItem: number = 0;
  public itemResuelto: boolean = false;

  // Contenedores y referencias a objetos gráficos de Phaser
  private contenedorContenido: Phaser.GameObjects.Container | null = null;
  private contenedorTarjetaResultado: Phaser.GameObjects.Container | null = null;
  private textoResultado: Phaser.GameObjects.Text | null = null;
  private spriteReglita: Phaser.GameObjects.Image | Phaser.GameObjects.Text | null = null;
  private graficosEscalera: Phaser.GameObjects.Graphics | null = null;
  private zonasDrop: Phaser.GameObjects.Zone[] = [];

  constructor(
    configOrSpec: ConfiguracionEscenaBase | GameSpec,
    maybeVersionId?: string,
    opciones?: Partial<ConfiguracionEscenaBase>
  ) {
    let conf: ConfiguracionEscenaBase;
    if (configOrSpec && typeof configOrSpec === "object" && "spec" in configOrSpec) {
      conf = {
        ...configOrSpec,
        key: configOrSpec.key ?? "MecanicaCarrera"
      };
    } else {
      conf = {
        spec: configOrSpec as GameSpec,
        versionId: maybeVersionId ?? "v1",
        key: "MecanicaCarrera",
        ...opciones
      };
    }

    super(conf);

    if (this.spec.mecanica !== "carrera") {
      throw new Error(
        `MecanicaCarrera requiere un GameSpec con mecanica "carrera", recibido: "${this.spec.mecanica}"`
      );
    }

    this.items = this.aplanarItems();

    if (this.items.length > 0) {
      this.cargarItem(0);
    }
  }

  /**
   * Extrae y aplana los ítems de carrera declarados en todos los niveles del spec.
   */
  protected aplanarItems(): ItemCarrera[] {
    if (!this.spec?.niveles || !Array.isArray(this.spec.niveles)) {
      return [];
    }
    const resultado: ItemCarrera[] = [];
    for (const nivel of this.spec.niveles) {
      if (nivel && Array.isArray(nivel.items)) {
        for (const item of nivel.items) {
          resultado.push(item as ItemCarrera);
        }
      }
    }
    return resultado;
  }

  /**
   * Ciclo de vida: inicializa el escenario base y arranca el tutorial.
   */
  public override create(): void {
    super.create();
    if (this.tutorialFinalizado && this.add) {
      this.renderizarItem();
    }
  }

  /**
   * Inicia el tutorial; si la duración es 0, lo finaliza de inmediato.
   */
  public override iniciarTutorial(): void {
    super.iniciarTutorial();
    if (this.duracionTutorialMs === 0) {
      this.finalizarTutorial();
    }
  }

  /**
   * Finaliza el tutorial, emite 'inicio' y renderiza los elementos del juego.
   */
  public override finalizarTutorial(): void {
    super.finalizarTutorial();
    if (this.add) {
      this.renderizarItem();
    }
  }

  /**
   * Carga y prepara el ítem según el índice especificado.
   */
  public cargarItem(indice: number): void {
    const item = this.items[indice];
    if (!item) {
      return;
    }

    this.indiceItemActual = indice;
    this.itemActual = item;
    this.valorActual = item.cantidad;
    this.unidadActual = item.desde;

    const idx = UNIDADES.indexOf(item.desde);
    this.unidadActualIndex = idx >= 0 ? idx : 3;

    this.intentosItemActual = 1;
    this.tiempoInicioItem = Date.now();
    this.itemResuelto = false;

    if (this.add && this.tutorialFinalizado) {
      this.renderizarItem();
    }
  }

  /**
   * Multiplica el valor actual por 10 y desplaza la posición hacia una unidad menor
   * (hacia la derecha en la escalera métrica).
   */
  public multiplicarPor10(): number {
    if (!this.itemActual || this.itemResuelto) {
      return this.valorActual;
    }

    this.valorActual = redondearValor(this.valorActual * 10);
    if (this.unidadActualIndex < UNIDADES.length - 1) {
      this.unidadActualIndex++;
      const nuevaUnidad = UNIDADES[this.unidadActualIndex];
      if (nuevaUnidad) {
        this.unidadActual = nuevaUnidad;
      }
    }

    this.actualizarVisualesValor();
    return this.valorActual;
  }

  /**
   * Divide el valor actual entre 10 y desplaza la posición hacia una unidad mayor
   * (hacia la izquierda en la escalera métrica).
   */
  public dividirEntre10(): number {
    if (!this.itemActual || this.itemResuelto) {
      return this.valorActual;
    }

    this.valorActual = redondearValor(this.valorActual / 10);
    if (this.unidadActualIndex > 0) {
      this.unidadActualIndex--;
      const nuevaUnidad = UNIDADES[this.unidadActualIndex];
      if (nuevaUnidad) {
        this.unidadActual = nuevaUnidad;
      }
    }

    this.actualizarVisualesValor();
    return this.valorActual;
  }

  /**
   * Permite fijar directamente una de las opciones disponibles como valor actual.
   */
  public seleccionarOpcion(valorOIndice: number): number {
    if (!this.itemActual || this.itemResuelto) {
      return this.valorActual;
    }

    if (
      Number.isInteger(valorOIndice) &&
      valorOIndice >= 0 &&
      valorOIndice < this.itemActual.opciones.length
    ) {
      const opcion = this.itemActual.opciones[valorOIndice];
      if (opcion !== undefined) {
        this.valorActual = opcion;
      }
    } else {
      this.valorActual = valorOIndice;
    }

    this.unidadActual = this.itemActual.hasta;
    const idx = UNIDADES.indexOf(this.itemActual.hasta);
    if (idx >= 0) {
      this.unidadActualIndex = idx;
    }

    this.actualizarVisualesValor();
    return this.valorActual;
  }

  /**
   * Restablece el valor y la unidad al estado inicial del ítem.
   */
  public reiniciarItem(): void {
    if (!this.itemActual) return;
    this.valorActual = this.itemActual.cantidad;
    this.unidadActual = this.itemActual.desde;
    const idx = UNIDADES.indexOf(this.itemActual.desde);
    this.unidadActualIndex = idx >= 0 ? idx : 3;
    this.actualizarVisualesValor();
  }

  /**
   * Arrastra o envía el resultado hacia la puerta del guardián para su evaluación.
   */
  public arrastrarAPuerta(valorArrastrado?: number): boolean {
    return this.resolver(valorArrastrado);
  }

  /**
   * Evalúa la respuesta del alumno contra el GameSpec (opciones[correcta]).
   * Emite el evento de 'respuesta' y la retroalimentación gráfica correspondiente.
   */
  public resolver(
    valorEvaluado?: number,
    opciones?: { avanzar?: boolean }
  ): boolean {
    if (!this.itemActual || this.itemResuelto) {
      return false;
    }

    const item = this.itemActual;
    const valor = valorEvaluado !== undefined ? valorEvaluado : this.valorActual;
    const valorEsperado = item.opciones[item.correcta] ?? 0;
    const esCorrecto = Math.abs(valor - valorEsperado) < 1e-5;

    const tiempoMs =
      this.tiempoInicioItem > 0 ? Math.max(0, Date.now() - this.tiempoInicioItem) : 0;
    const intentos = this.intentosItemActual;
    const avanzar = opciones?.avanzar ?? true;

    if (esCorrecto) {
      this.itemResuelto = true;
      const feedbackOk = item.retro.ok; // "estrella" | "aplauso"
      this.feedback.mostrarAcierto(feedbackOk, {
        texto:
          feedbackOk === "aplauso"
            ? "¡Excelente trabajo! ¡Puerta abierta!"
            : "¡Muy bien! ¡Conversión lograda!"
      });

      this.emitirRespuesta({
        itemId: item.id,
        criterio: item.criterio,
        correcto: true,
        tiempoMs,
        intentos
      });

      this.animarAciertoPuerta(() => {
        if (avanzar) {
          this.siguienteItem();
        }
      });

      return true;
    }

    // Primer error: pista y un reintento sin penalización. La respuesta aún no se registra.
    if (this.intentosItemActual < MAX_INTENTOS_CARRERA) {
      this.intentosItemActual++;
      this.feedback.mostrarError(
        `Pista: de ${item.desde} a ${item.hasta}, observa la escalera.`
      );
      this.animarErrorPuerta(() => undefined);
      return false;
    }

    // Segundo error: se muestra la respuesta, se registra como incorrecta y se avanza.
    this.itemResuelto = true;
    this.feedback.mostrarError(`La respuesta era ${valorEsperado} ${item.hasta}.`);

    this.emitirRespuesta({
      itemId: item.id,
      criterio: item.criterio,
      correcto: false,
      tiempoMs,
      intentos
    });

    this.animarErrorPuerta(() => {
      if (avanzar) {
        this.siguienteItem();
      }
    });

    return false;
  }

  /**
   * Avanza al siguiente ítem de la secuencia o concluye la partida llamando a cerrarConFin().
   */
  public siguienteItem(): void {
    const siguienteIndice = this.indiceItemActual + 1;
    if (siguienteIndice >= this.items.length) {
      this.cerrarConFin({
        aciertos: this.aciertos,
        total: this.totalItems,
        completado: true
      });
      return;
    }
    this.cargarItem(siguienteIndice);
  }

  // --- Renderizado y Métodos Visuales de Phaser ---

  /**
   * Construye los elementos interactivos del juego para el ítem activo.
   */
  private renderizarItem(): void {
    if (!this.add) return;
    this.limpiarContenidoItem();

    const ancho = this.cameras?.main?.width ?? 800;

    this.contenedorContenido = this.add.container(0, 0);

    this.dibujarTarjetaEnunciado(ancho);
    this.dibujarEscalera(ancho);
    this.dibujarControlesResultado(ancho);
    this.dibujarOpciones(ancho);
    this.dibujarPuerta(ancho);
    this.configurarArrastreInteractivo();
  }

  /**
   * Dibuja la tarjeta con la consigna, el asset del objeto y el indicador de progreso.
   */
  private dibujarTarjetaEnunciado(ancho: number): void {
    if (!this.add || !this.contenedorContenido || !this.itemActual) return;

    const tarjeta = this.add.container(ancho / 2, 115);

    // Fondo redondeado de la tarjeta (#fffcf6, borde #e4dccd, radio 18px)
    const bg = this.add.graphics();
    bg.fillStyle(COLOR_PAPEL, 0.98);
    bg.fillRoundedRect(-360, -38, 720, 76, 18);
    bg.lineStyle(2, COLOR_LINEA, 1);
    bg.strokeRoundedRect(-360, -38, 720, 76, 18);
    tarjeta.add(bg);

    // Asset visual del objeto
    const assetId = this.itemActual.enunciado.asset ?? "objeto-lapiz";
    const visualObjeto = resolverVisual(assetId);

    const emojiObj = this.add
      .text(-310, -5, visualObjeto.emoji, { fontSize: "36px" })
      .setOrigin(0.5);
    tarjeta.add(emojiObj);

    const nombreObj = this.add
      .text(-310, 22, visualObjeto.nombre ?? "Objeto", {
        fontFamily: FUENTE_SISTEMA,
        fontSize: "11px",
        color: COLOR_MUTED,
        fontStyle: "bold",
        align: "center",
        wordWrap: { width: 110 }
      })
      .setOrigin(0.5);
    tarjeta.add(nombreObj);

    // Texto de la conversión solicitada (título peso 900, tinta #14201f)
    const textoConversion = this.add
      .text(
        -15,
        -7,
        `${this.itemActual.cantidad} ${this.itemActual.desde}  ➔  ¿cuántos ${this.itemActual.hasta}?`,
        {
          fontFamily: FUENTE_SISTEMA,
          fontSize: "22px",
          color: COLOR_TINTA,
          fontStyle: "900"
        }
      )
      .setOrigin(0.5);
    tarjeta.add(textoConversion);

    const subTexto = this.add
      .text(
        -15,
        19,
        "Usa ×10 y ÷10 con la escalera y arrastra el resultado a la puerta",
        {
          fontFamily: FUENTE_SISTEMA,
          fontSize: "12px",
          color: COLOR_MUTED
        }
      )
      .setOrigin(0.5);
    tarjeta.add(subTexto);

    // Progreso de ítems
    const textoProgreso = this.add
      .text(
        290,
        -7,
        `Ítem ${this.indiceItemActual + 1} / ${this.items.length}`,
        {
          fontFamily: FUENTE_SISTEMA,
          fontSize: "14px",
          color: COLOR_VERDE,
          fontStyle: "bold"
        }
      )
      .setOrigin(0.5);
    tarjeta.add(textoProgreso);

    const textoAciertos = this.add
      .text(290, 15, `Aciertos: ${this.aciertos}`, {
        fontFamily: FUENTE_SISTEMA,
        fontSize: "12px",
        color: COLOR_VERDE,
        fontStyle: "bold"
      })
      .setOrigin(0.5);
    tarjeta.add(textoAciertos);

    this.contenedorContenido.add(tarjeta);
  }

  /**
   * Dibuja la escalera animada de unidades de longitud (icono-escalera-unidades).
   */
  private dibujarEscalera(ancho: number): void {
    if (!this.add || !this.contenedorContenido || !this.itemActual) return;

    const contenedorEscalera = this.add.container(ancho / 2, 220);

    // Marco exterior de la escalera (#fffcf6, borde #e4dccd, radio 18px)
    const fondo = this.add.graphics();
    fondo.fillStyle(COLOR_PAPEL, 0.98);
    fondo.fillRoundedRect(-360, -45, 720, 138, 18);
    fondo.lineStyle(2, COLOR_LINEA, 1);
    fondo.strokeRoundedRect(-360, -45, 720, 138, 18);
    contenedorEscalera.add(fondo);

    // Título de la escalera métrica (peso 900, tinta #14201f)
    const titulo = this.add
      .text(0, -38, "Escalera de Unidades de Longitud", {
        fontFamily: FUENTE_SISTEMA,
        fontSize: "13px",
        color: COLOR_TINTA,
        fontStyle: "900"
      })
      .setOrigin(0.5);
    contenedorEscalera.add(titulo);

    // Capa de gráficos dinámica para los peldaños
    this.graficosEscalera = this.add.graphics();
    contenedorEscalera.add(this.graficosEscalera);

    const xBase = -300;
    const pasoX = 100;

    for (let i = 0; i < UNIDADES.length; i++) {
      const xPaso = xBase + i * pasoX;
      const unidad = UNIDADES[i] ?? "";
      const esOrigen = unidad === this.itemActual.desde;
      const esMeta = unidad === this.itemActual.hasta;

      // Etiqueta de la unidad en el peldaño
      const textoUnidad = this.add
        .text(xPaso, 3, unidad, {
          fontFamily: FUENTE_SISTEMA,
          fontSize: "16px",
          color: COLOR_TINTA,
          fontStyle: "bold"
        })
        .setOrigin(0.5);
      contenedorEscalera.add(textoUnidad);

      // Indicadores de Inicio y Meta
      if (esOrigen) {
        const tagInicio = this.add
          .text(xPaso, -20, "Inicio", {
            fontFamily: FUENTE_SISTEMA,
            fontSize: "11px",
            color: COLOR_VERDE,
            fontStyle: "bold"
          })
          .setOrigin(0.5);
      contenedorEscalera.add(tagInicio);
      }
      if (esMeta) {
        const tagMeta = this.add
          .text(xPaso, -20, "Meta", {
            fontFamily: FUENTE_SISTEMA,
            fontSize: "11px",
            color: COLOR_VERDE,
            fontStyle: "bold"
          })
          .setOrigin(0.5);
        contenedorEscalera.add(tagMeta);
      }

      // Flechas de dirección entre peldaños
      if (i < UNIDADES.length - 1) {
        const flechaX = xPaso + 50;
        const flechaDer = this.add
          .text(flechaX, -8, "➔ ×10", {
            fontFamily: FUENTE_SISTEMA,
            fontSize: "11px",
            color: COLOR_NARANJA,
            fontStyle: "bold"
          })
          .setOrigin(0.5);
        const flechaIzq = this.add
          .text(flechaX, 14, "⬅ ÷10", {
            fontFamily: FUENTE_SISTEMA,
            fontSize: "11px",
            color: COLOR_VERDE,
            fontStyle: "bold"
          })
          .setOrigin(0.5);
        contenedorEscalera.add(flechaDer);
        contenedorEscalera.add(flechaIzq);
      }
    }

    // La compañera camina bajo las unidades, con espacio propio y proporción original.
    const xReglita = xBase + this.unidadActualIndex * pasoX;
    if (this.textures && this.textures.exists("mascota-tiendita")) {
      const mascota = this.add.image(xReglita, 49, "mascota-tiendita");
      mascota.setDisplaySize(82, 75);
      mascota.setOrigin(0.5);
      this.spriteReglita = mascota;
    } else {
      try {
        const mascota = this.add.image(xReglita, 49, "mascota-tiendita");
        mascota.setDisplaySize(82, 75);
        mascota.setOrigin(0.5);
        this.spriteReglita = mascota;
      } catch {
        this.spriteReglita = this.add
          .text(xReglita, 49, "Reglita", { fontSize: "18px", color: COLOR_VERDE })
          .setOrigin(0.5);
      }
    }
    contenedorEscalera.add(this.spriteReglita);

    this.redibujarPeldanosEscalera();
    this.contenedorContenido.add(contenedorEscalera);
  }

  /**
   * Redibuja los recuadros de cada peldaño destacando la posición activa con colores tiendita.
   */
  private redibujarPeldanosEscalera(): void {
    if (!this.graficosEscalera || !this.itemActual) return;

    this.graficosEscalera.clear();
    const xBase = -300;
    const pasoX = 100;

    for (let i = 0; i < UNIDADES.length; i++) {
      const xPaso = xBase + i * pasoX;
      const esActivo = i === this.unidadActualIndex;
      const esOrigen = UNIDADES[i] === this.itemActual.desde;
      const esMeta = UNIDADES[i] === this.itemActual.hasta;

      if (esActivo) {
        this.graficosEscalera.fillStyle(0xdff2ec, 1);
        this.graficosEscalera.fillRoundedRect(xPaso - 32, -18, 64, 40, 10);
        this.graficosEscalera.lineStyle(3, COLOR_VERDE_HEX, 1);
        this.graficosEscalera.strokeRoundedRect(xPaso - 32, -18, 64, 40, 10);
      } else {
        this.graficosEscalera.fillStyle(COLOR_PAPEL, 1);
        this.graficosEscalera.fillRoundedRect(xPaso - 30, -16, 60, 36, 8);

        if (esMeta) {
          this.graficosEscalera.lineStyle(2, COLOR_VERDE_HEX, 1);
          this.graficosEscalera.strokeRoundedRect(xPaso - 30, -16, 60, 36, 8);
        } else if (esOrigen) {
          this.graficosEscalera.lineStyle(2, COLOR_NARANJA_HEX, 1);
          this.graficosEscalera.strokeRoundedRect(xPaso - 30, -16, 60, 36, 8);
        } else {
          this.graficosEscalera.lineStyle(1, COLOR_LINEA, 1);
          this.graficosEscalera.strokeRoundedRect(xPaso - 30, -16, 60, 36, 8);
        }
      }
    }
  }

  /**
   * Dibuja los botones interactivos ×10 (naranja) y ÷10 (verde) con radio 18px y sombra,
   * junto con la tarjeta arrastrable del resultado.
   */
  private dibujarControlesResultado(ancho: number): void {
    if (!this.add || !this.contenedorContenido) return;

    const contenedorControles = this.add.container(ancho / 2, 335);

    // Botón Dividir entre 10: radio 18px, fondo verde #1f7a6a, con sombra
    const btnDividir = this.add.container(-190, 0);
    const bgDividir = this.add.graphics();
    bgDividir.fillStyle(0x14201f, 0.15);
    bgDividir.fillRoundedRect(-60, -20, 120, 48, 18);
    bgDividir.fillStyle(COLOR_VERDE_HEX, 1);
    bgDividir.fillRoundedRect(-60, -24, 120, 48, 18);
    bgDividir.lineStyle(2, 0x165b4f, 0.6);
    bgDividir.strokeRoundedRect(-60, -24, 120, 48, 18);
    btnDividir.add(bgDividir);

    const txtDividir = this.add
      .text(0, -2, "➗ ÷10", {
        fontFamily: FUENTE_SISTEMA,
        fontSize: "17px",
        color: "#ffffff",
        fontStyle: "900"
      })
      .setOrigin(0.5);
    btnDividir.add(txtDividir);

    btnDividir.setSize(120, 48);
    btnDividir.setInteractive({ useHandCursor: true });
    btnDividir.on("pointerdown", () => this.dividirEntre10());
    this.aplicarEfectoHover(btnDividir);
    contenedorControles.add(btnDividir);

    // Tarjeta arrastrable con el resultado actual (#fffdf7, borde naranja, radio 18px con sombra)
    this.contenedorTarjetaResultado = this.add.container(0, 0);

    const bgResultado = this.add.graphics();
    bgResultado.fillStyle(0x493126, 0.12);
    bgResultado.fillRoundedRect(-100, -24, 200, 56, 18);
    bgResultado.fillStyle(0xfffdf7, 1);
    bgResultado.fillRoundedRect(-100, -28, 200, 56, 18);
    bgResultado.lineStyle(3, COLOR_NARANJA_HEX, 1);
    bgResultado.strokeRoundedRect(-100, -28, 200, 56, 18);
    this.contenedorTarjetaResultado.add(bgResultado);

    this.textoResultado = this.add
      .text(0, -8, `${this.valorActual} ${this.unidadActual}`, {
        fontFamily: FUENTE_SISTEMA,
        fontSize: "22px",
        color: COLOR_NARANJA,
        fontStyle: "900"
      })
      .setOrigin(0.5);
    this.contenedorTarjetaResultado.add(this.textoResultado);

    const subtituloArrastrar = this.add
      .text(0, 14, "🖐️ Arrastra a la puerta", {
        fontFamily: FUENTE_SISTEMA,
        fontSize: "11px",
        color: COLOR_MUTED,
        fontStyle: "bold"
      })
      .setOrigin(0.5);
    this.contenedorTarjetaResultado.add(subtituloArrastrar);

    this.contenedorTarjetaResultado.setSize(200, 56);
    this.contenedorTarjetaResultado.setInteractive({
      draggable: true,
      useHandCursor: true
    });
    this.contenedorTarjetaResultado.setData("valor", this.valorActual);
    this.contenedorTarjetaResultado.setData("startX", 0);
    this.contenedorTarjetaResultado.setData("startY", 0);

    contenedorControles.add(this.contenedorTarjetaResultado);

    // Botón Multiplicar por 10: radio 18px, fondo naranja #f26a3d, con sombra
    const btnMultiplicar = this.add.container(190, 0);
    const bgMultiplicar = this.add.graphics();
    bgMultiplicar.fillStyle(0xd94f24, 0.25);
    bgMultiplicar.fillRoundedRect(-60, -20, 120, 48, 18);
    bgMultiplicar.fillStyle(COLOR_NARANJA_HEX, 1);
    bgMultiplicar.fillRoundedRect(-60, -24, 120, 48, 18);
    bgMultiplicar.lineStyle(2, 0xd94f24, 0.6);
    bgMultiplicar.strokeRoundedRect(-60, -24, 120, 48, 18);
    btnMultiplicar.add(bgMultiplicar);

    const txtMultiplicar = this.add
      .text(0, -2, "✖️ ×10", {
        fontFamily: FUENTE_SISTEMA,
        fontSize: "17px",
        color: COLOR_TINTA,
        fontStyle: "900"
      })
      .setOrigin(0.5);
    btnMultiplicar.add(txtMultiplicar);

    btnMultiplicar.setSize(120, 48);
    btnMultiplicar.setInteractive({ useHandCursor: true });
    btnMultiplicar.on("pointerdown", () => this.multiplicarPor10());
    this.aplicarEfectoHover(btnMultiplicar);
    contenedorControles.add(btnMultiplicar);

    this.contenedorContenido.add(contenedorControles);
  }

  /**
   * Muestra las opciones declaradas en el spec como fichas arrastrables y seleccionables.
   */
  private dibujarOpciones(ancho: number): void {
    if (!this.add || !this.contenedorContenido || !this.itemActual) return;

    const contenedorOpciones = this.add.container(ancho / 2, 420);

    const labelOpciones = this.add
      .text(-320, 0, "Opciones:", {
        fontFamily: FUENTE_SISTEMA,
        fontSize: "13px",
        color: COLOR_TINTA,
        fontStyle: "900"
      })
      .setOrigin(0, 0.5);
    contenedorOpciones.add(labelOpciones);

    const opciones = this.itemActual.opciones;
    const totalOpciones = opciones.length;
    const anchoChip = 100;
    const espacio = 20;
    const inicioX = -((totalOpciones - 1) * (anchoChip + espacio)) / 2 + 30;

    for (let i = 0; i < totalOpciones; i++) {
      const opc = opciones[i];
      if (opc === undefined) continue;
      const xChip = inicioX + i * (anchoChip + espacio);

      const chip = this.add.container(xChip, 0);

      const bgChip = this.add.graphics();
      bgChip.fillStyle(COLOR_PAPEL, 0.98);
      bgChip.fillRoundedRect(-anchoChip / 2, -18, anchoChip, 36, 14);
      bgChip.lineStyle(2, COLOR_LINEA, 1);
      bgChip.strokeRoundedRect(-anchoChip / 2, -18, anchoChip, 36, 14);
      chip.add(bgChip);

      const textoChip = this.add
        .text(0, 0, `${opc} ${this.itemActual.hasta}`, {
          fontFamily: FUENTE_SISTEMA,
          fontSize: "13px",
          color: COLOR_TINTA,
          fontStyle: "bold"
        })
        .setOrigin(0.5);
      chip.add(textoChip);

      chip.setSize(anchoChip, 36);
      chip.setInteractive({ draggable: true, useHandCursor: true });
      chip.setData("valor", opc);
      chip.setData("startX", xChip);
      chip.setData("startY", 0);

      const valorOpcion = opc;
      chip.on("pointerdown", () => this.seleccionarOpcion(valorOpcion));
      this.aplicarEfectoHover(chip);

      contenedorOpciones.add(chip);
    }

    this.contenedorContenido.add(contenedorOpciones);
  }

  /**
   * Dibuja la puerta del guardián (puerta-guardian) como tarjeta con fondo #fffcf6, borde #e4dccd, radio 18px.
   */
  private dibujarPuerta(ancho: number): void {
    if (!this.add || !this.contenedorContenido) return;

    const contenedorPuerta = this.add.container(ancho / 2, 520);

    const visualPuerta = resolverVisual("puerta-guardian");

    const bgPuerta = this.add.graphics();
    bgPuerta.fillStyle(0x493126, 0.1);
    bgPuerta.fillRoundedRect(-120, -34, 240, 76, 18);
    bgPuerta.fillStyle(COLOR_PAPEL, 1);
    bgPuerta.fillRoundedRect(-120, -38, 240, 76, 18);
    bgPuerta.lineStyle(2, COLOR_LINEA, 1);
    bgPuerta.strokeRoundedRect(-120, -38, 240, 76, 18);
    contenedorPuerta.add(bgPuerta);

    const textoPuerta = this.add
      .text(0, -9, `${visualPuerta.emoji} ${visualPuerta.nombre ?? "Puerta del Guardián"}`, {
        fontFamily: FUENTE_SISTEMA,
        fontSize: "16px",
        color: COLOR_TINTA,
        fontStyle: "900"
      })
      .setOrigin(0.5);
    contenedorPuerta.add(textoPuerta);

    const subtituloPuerta = this.add
      .text(0, 15, "Suelta aquí el resultado para abrir", {
        fontFamily: FUENTE_SISTEMA,
        fontSize: "12px",
        color: COLOR_MUTED,
        fontStyle: "bold"
      })
      .setOrigin(0.5);
    contenedorPuerta.add(subtituloPuerta);

    contenedorPuerta.setSize(240, 76);
    contenedorPuerta.setInteractive({ useHandCursor: true });
    contenedorPuerta.on("pointerdown", () => this.arrastrarAPuerta());
    this.aplicarEfectoHover(contenedorPuerta);

    // Zona receptora (dropZone) para Phaser
    const dropZone = this.add
      .zone(ancho / 2, 520, 260, 90)
      .setRectangleDropZone(260, 90);
    this.zonasDrop.push(dropZone);

    this.contenedorContenido.add(contenedorPuerta);
  }

  /**
   * Configura los eventos de arrastre interactivo (drag & drop) sobre la escena de Phaser.
   */
  private configurarArrastreInteractivo(): void {
    if (!this.input) return;

    this.input.off("dragstart");
    this.input.off("drag");
    this.input.off("dragend");
    this.input.off("drop");

    this.input.on(
      "drag",
      (
        _pointer: Phaser.Input.Pointer,
        gameObject: Phaser.GameObjects.Container,
        dragX: number,
        dragY: number
      ) => {
        gameObject.x = dragX;
        gameObject.y = dragY;
      }
    );

    this.input.on(
      "dragend",
      (
        pointer: Phaser.Input.Pointer,
        gameObject: Phaser.GameObjects.Container,
        dropped: boolean
      ) => {
        if (!dropped) {
          if (this.estaSobrePuerta(pointer.x, pointer.y)) {
            this.procesarDropEnPuerta(gameObject);
            return;
          }
          this.devolverAOrigen(gameObject);
        }
      }
    );

    this.input.on(
      "drop",
      (
        _pointer: Phaser.Input.Pointer,
        gameObject: Phaser.GameObjects.Container,
        _targetZone: Phaser.GameObjects.Zone
      ) => {
        this.procesarDropEnPuerta(gameObject);
      }
    );
  }

  /**
   * Determina si las coordenadas del puntero se encuentran dentro del área de la puerta.
   */
  private estaSobrePuerta(x: number, y: number): boolean {
    const ancho = this.cameras?.main?.width ?? 800;
    const minX = ancho / 2 - 130;
    const maxX = ancho / 2 + 130;
    const minY = 475;
    const maxY = 565;
    return x >= minX && x <= maxX && y >= minY && y <= maxY;
  }

  /**
   * Procesa la entrega del objeto arrastrado sobre la puerta.
   */
  private procesarDropEnPuerta(gameObject: Phaser.GameObjects.Container): void {
    const valor = gameObject?.getData?.("valor") ?? this.valorActual;
    this.devolverAOrigen(gameObject);
    this.arrastrarAPuerta(valor);
  }

  /**
   * Devuelve un objeto gráfico arrastrado a su posición original mediante una animación suave.
   */
  private devolverAOrigen(gameObject: Phaser.GameObjects.Container): void {
    const startX = gameObject.getData("startX") ?? 0;
    const startY = gameObject.getData("startY") ?? 0;

    if (this.tweens) {
      this.tweens.add({
        targets: gameObject,
        x: startX,
        y: startY,
        duration: 200,
        ease: "Power2"
      });
    } else {
      gameObject.x = startX;
      gameObject.y = startY;
    }
  }

  /**
   * Actualiza los textos y la posición de Reglita al modificarse el valor o la unidad.
   */
  private actualizarVisualesValor(): void {
    if (this.textoResultado) {
      this.textoResultado.setText(`${this.valorActual} ${this.unidadActual}`);
    }
    if (this.contenedorTarjetaResultado) {
      this.contenedorTarjetaResultado.setData("valor", this.valorActual);
    }

    this.redibujarPeldanosEscalera();

    if (this.spriteReglita) {
      const xBase = -300;
      const pasoX = 100;
      const destinoX = xBase + this.unidadActualIndex * pasoX;

      const reducir = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      const figura = this.spriteReglita;
      this.tweens?.killTweensOf?.(figura);
      figura.y = 49;
      figura.angle = 0;
      if (this.tweens && !reducir && figura.x !== destinoX) {
        this.tweens.add({ targets: figura, x: destinoX, duration: 420, ease: "Cubic.easeOut" });
        this.tweens.add({ targets: figura, y: 46, angle: -4, duration: 70, yoyo: true, repeat: 2, ease: "Sine.easeInOut", onComplete: () => { figura.y = 49; figura.angle = 0; } });
      } else {
        figura.x = destinoX;
      }
    }
  }

  /**
   * Agrega un efecto interactivo sutil de escalado al pasar el puntero sobre un contenedor.
   */
  private aplicarEfectoHover(contenedor: Phaser.GameObjects.Container): void {
    contenedor.on("pointerover", () => {
      if (this.tweens) {
        this.tweens.add({
          targets: contenedor,
          scaleX: 1.05,
          scaleY: 1.05,
          duration: 150,
          ease: "Sine.easeOut"
        });
      } else {
        contenedor.setScale(1.05);
      }
    });

    contenedor.on("pointerout", () => {
      if (this.tweens) {
        this.tweens.add({
          targets: contenedor,
          scaleX: 1,
          scaleY: 1,
          duration: 150,
          ease: "Sine.easeOut"
        });
      } else {
        contenedor.setScale(1);
      }
    });
  }

  /**
   * Efecto visual de salto del personaje hacia la puerta al acertar.
   */
  private animarAciertoPuerta(alTerminar: () => void): void {
    if (!this.add || !this.tweens) {
      alTerminar();
      return;
    }

    if (this.spriteReglita) {
      this.tweens.add({
        targets: this.spriteReglita,
        y: this.spriteReglita.y - 25,
        duration: 180,
        yoyo: true,
        repeat: 1,
        ease: "Sine.easeInOut"
      });
    }

    if (this.time) {
      this.time.delayedCall(450, () => alTerminar());
    } else {
      setTimeout(() => alTerminar(), 450);
    }
  }

  /**
   * Efecto visual de desajuste cuando se comete un error.
   */
  private animarErrorPuerta(alTerminar: () => void): void {
    if (!this.add || !this.tweens) {
      alTerminar();
      return;
    }

    if (this.time) {
      this.time.delayedCall(350, () => alTerminar());
    } else {
      setTimeout(() => alTerminar(), 350);
    }
  }

  /**
   * Remueve y destruye los contenedores gráficos del ítem anterior.
   */
  private limpiarContenidoItem(): void {
    if (this.spriteReglita) this.tweens?.killTweensOf?.(this.spriteReglita);
    for (const z of this.zonasDrop) {
      try {
        z.destroy();
      } catch {
        // Ignorar
      }
    }
    this.zonasDrop = [];

    if (this.contenedorContenido) {
      try {
        this.contenedorContenido.destroy();
      } catch {
        // Ignorar
      }
      this.contenedorContenido = null;
    }

    this.contenedorTarjetaResultado = null;
    this.textoResultado = null;
    this.spriteReglita = null;
    this.graficosEscalera = null;
  }
}

/**
 * Alias de MecanicaCarrera para compatibilidad de nomenclatura.
 */
export const EscenaCarrera = MecanicaCarrera;
export type EscenaCarrera = MecanicaCarrera;
