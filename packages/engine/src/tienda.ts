import "./polyfill.ts";
import Phaser from "phaser";
import type { GameSpec, ItemTienda } from "@brain-rush/gamespec";
import { EscenaBase, type ConfiguracionEscenaBase } from "./escena.ts";
import { colorHexANumero, resolverVisual } from "./visuales.ts";

export interface ConfiguracionTienda extends ConfiguracionEscenaBase {
  spec: GameSpec;
}

/**
 * Mecánica 'tienda' (N1, activación) para BRAIN RUSH.
 *
 * Responsabilidades:
 * - Extender EscenaBase recibiendo un GameSpec con mecanica 'tienda'.
 * - Fase 1 · Clasificación: arrastrar productos a las estanterías según su categoría.
 *   - Acierto: retroalimentación 'estrella', emite 'respuesta' con correcto: true.
 *   - Error: retroalimentación 'pista', emite 'respuesta' con correcto: false (reintentable sin penalización).
 * - Fase 2 · Pedido: si el ítem tiene pedido, arrastrar la cantidad solicitada a la bolsa.
 *   - Al completar el total solicitado, emite 'respuesta'.
 * - Fase 3 · Meta colectiva: barra del camión de reparto que avanza visualmente por cada acierto.
 * - Al completar todos los ítems del spec, llama a cerrarConFin().
 * - Soporte desacoplado: funciona con Phaser en navegador y en Node.js headless para pruebas unitarias.
 * - Estrictamente sin fetch, sin localStorage y sin dependencias de archivos SVG (usa resolverVisual).
 */
export class MecanicaTienda extends EscenaBase {
  public readonly todosLosItems: ItemTienda[] = [];
  public indiceItemActual: number = 0;
  public itemActual: ItemTienda | null = null;
  public readonly productosClasificados: Set<string> = new Set();
  public readonly productosEnBolsa: string[] = [];
  public progresoCamion: number = 0;
  public readonly objetivoCamion: number;
  public tiempoInicioItem: number = 0;
  public intentosItem: number = 1;

  private contenedorItemActual: Phaser.GameObjects.Container | null = null;
  private contenedorCamion: Phaser.GameObjects.Container | null = null;
  private textoCamion: Phaser.GameObjects.Text | null = null;
  private barraCamionGrafico: Phaser.GameObjects.Graphics | null = null;
  private textoBolsa: Phaser.GameObjects.Text | null = null;
  private mapaProductosVisuales: Map<string, Phaser.GameObjects.Container> = new Map();

  constructor(
    configOrSpec: ConfiguracionEscenaBase | GameSpec,
    maybeVersionId?: string,
    opciones?: Partial<ConfiguracionEscenaBase>
  ) {
    super(configOrSpec, maybeVersionId, opciones);

    if (this.spec.mecanica !== "tienda") {
      throw new Error(
        `MecanicaTienda requiere un GameSpec con mecanica 'tienda', recibido: '${this.spec.mecanica}'`
      );
    }

    // Aplanar los ítems de todos los niveles en orden
    if (Array.isArray(this.spec.niveles)) {
      for (const nivel of this.spec.niveles) {
        if (Array.isArray(nivel?.items)) {
          for (const it of nivel.items) {
            this.todosLosItems.push(it as ItemTienda);
          }
        }
      }
    }

    const metaSpec = (this.spec as any).meta;
    this.objetivoCamion =
      typeof metaSpec?.objetivo === "number" && metaSpec.objetivo > 0
        ? metaSpec.objetivo
        : this.totalItems || 10;

    // Inicializar el primer ítem para permitir interacción inmediata en entornos headless
    if (this.todosLosItems.length > 0) {
      this.itemActual = this.todosLosItems[0] ?? null;
      this.tiempoInicioItem = Date.now();
    }
  }

  /**
   * Ciclo de inicialización de Phaser Scene.
   */
  public override create(): void {
    super.create();
    this.crearMetaCamion();
    this.configurarArrastre();

    if (this.tutorialFinalizado) {
      this.cargarItem(this.indiceItemActual);
    }
  }

  /**
   * Sobrescribe la finalización del tutorial para cargar el escenario del ítem actual.
   */
  public override finalizarTutorial(): void {
    super.finalizarTutorial();
    this.cargarItem(this.indiceItemActual);
  }

  /**
   * Configura los eventos de arrastre e interacción de Phaser.
   */
  private configurarArrastre(): void {
    if (!this.input) return;

    this.input.on(
      "drag",
      (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Container, dragX: number, dragY: number) => {
        gameObject.x = dragX;
        gameObject.y = dragY;
      }
    );

    this.input.on(
      "drop",
      (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Container, dropZone: Phaser.GameObjects.Zone) => {
        const productoId = gameObject.getData("productoId");
        if (!productoId) return;

        if (dropZone.getData("esBolsa")) {
          const exito = this.arrastrarABolsa(productoId);
          if (exito) {
            gameObject.setData("colocado", true);
          }
        } else {
          const estanteriaId = dropZone.getData("estanteriaId");
          if (estanteriaId) {
            const exito = this.clasificarProducto(productoId, estanteriaId);
            if (exito) {
              gameObject.setData("colocado", true);
            }
          }
        }
      }
    );

    this.input.on(
      "dragend",
      (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Container) => {
        if (!gameObject.getData("colocado")) {
          if (this.tweens) {
            this.tweens.add({
              targets: gameObject,
              x: gameObject.getData("origX"),
              y: gameObject.getData("origY"),
              duration: 200,
              ease: "Power2"
            });
          } else {
            gameObject.x = gameObject.getData("origX");
            gameObject.y = gameObject.getData("origY");
          }
        }
      }
    );
  }

  /**
   * Carga y prepara el ítem del juego por su índice.
   */
  public cargarItem(indice: number): void {
    if (indice >= this.todosLosItems.length) {
      this.cerrarConFin();
      return;
    }

    this.indiceItemActual = indice;
    this.itemActual = this.todosLosItems[indice] ?? null;
    this.productosClasificados.clear();
    this.productosEnBolsa.length = 0;
    this.intentosItem = 1;
    this.tiempoInicioItem = Date.now();

    this.renderizarItem();
  }

  /**
   * Fase 1 · Clasificación:
   * Arrastrar cada producto a la estantería correspondiente (coincidencia por categoría con estanteriaId).
   * - Acierto: feedback 'estrella', emite 'respuesta' con correcto: true.
   * - Error: feedback 'pista', emite 'respuesta' con correcto: false (sin penalización, puede reintentar).
   */
  public clasificarProducto(productoId: string, estanteriaId: string): boolean {
    const item = this.itemActual;
    if (!item) {
      return false;
    }

    const producto = item.productos.find((p) => p.id === productoId);
    if (!producto) {
      return false;
    }

    if (this.productosClasificados.has(productoId)) {
      return false;
    }

    const tiempoMs = this.tiempoInicioItem > 0 ? Math.max(0, Date.now() - this.tiempoInicioItem) : 0;
    const esCorrecto = producto.categoria === estanteriaId;

    if (esCorrecto) {
      this.productosClasificados.add(productoId);
      const visualObj = this.mapaProductosVisuales.get(productoId);
      if (visualObj) {
        visualObj.setData("colocado", true);
        visualObj.setVisible(false);
      }

      this.feedback.mostrarAcierto(item.retro?.ok ?? "estrella");
      this.emitirRespuesta({
        itemId: item.id,
        criterio: item.criterio,
        correcto: true,
        tiempoMs,
        intentos: this.intentosItem
      });

      this.avanzarMetaCamion();

      // Si se clasificaron todos los productos del ítem actual, avanzar al siguiente
      if (this.productosClasificados.size >= item.productos.length) {
        this.avanzarSiguienteItem();
      }

      return true;
    } else {
      this.feedback.mostrarError(item.retro?.error ?? "pista");
      this.emitirRespuesta({
        itemId: item.id,
        criterio: item.criterio,
        correcto: false,
        tiempoMs,
        intentos: this.intentosItem
      });

      this.intentosItem++;
      return false;
    }
  }

  /**
   * Fase 2 · Pedido:
   * Arrastrar productos de la categoría solicitada a la bolsa.
   * Al completar el total requerido, emite 'respuesta' con correcto: true.
   */
  public arrastrarABolsa(productoId: string): boolean {
    const item = this.itemActual;
    if (!item) {
      return false;
    }

    if (!item.pedido && item.accion !== "pedido") {
      return false;
    }

    const producto = item.productos.find((p) => p.id === productoId);
    if (!producto) {
      return false;
    }

    if (this.productosEnBolsa.includes(productoId)) {
      return false;
    }

    const tiempoMs = this.tiempoInicioItem > 0 ? Math.max(0, Date.now() - this.tiempoInicioItem) : 0;
    const categoriaEsperada = item.pedido?.categoria;
    const esCorrecto = Boolean(categoriaEsperada && producto.categoria === categoriaEsperada);

    if (!esCorrecto) {
      this.feedback.mostrarError(item.retro?.error ?? "pista");
      this.emitirRespuesta({
        itemId: item.id,
        criterio: item.criterio,
        correcto: false,
        tiempoMs,
        intentos: this.intentosItem
      });

      this.intentosItem++;
      return false;
    }

    this.productosEnBolsa.push(productoId);
    const visualObj = this.mapaProductosVisuales.get(productoId);
    if (visualObj) {
      visualObj.setData("colocado", true);
      visualObj.setVisible(false);
    }

    const cantidadRequerida = item.pedido?.cantidad ?? 1;
    this.actualizarVisualBolsa();

    if (this.productosEnBolsa.length >= cantidadRequerida) {
      this.feedback.mostrarAcierto(item.retro?.ok ?? "aplauso");
      this.emitirRespuesta({
        itemId: item.id,
        criterio: item.criterio,
        correcto: true,
        tiempoMs,
        intentos: this.intentosItem
      });

      this.avanzarMetaCamion();
      this.avanzarSiguienteItem();
    }

    return true;
  }

  /**
   * Alias de arrastrarABolsa para compatibilidad.
   */
  public colocarEnBolsa(productoId: string): boolean {
    return this.arrastrarABolsa(productoId);
  }

  /**
   * Pasa al siguiente ítem de la tienda o finaliza si no quedan más ítems.
   */
  public avanzarSiguienteItem(): void {
    const siguienteIndice = this.indiceItemActual + 1;
    if (siguienteIndice >= this.todosLosItems.length) {
      this.cerrarConFin();
    } else {
      this.cargarItem(siguienteIndice);
    }
  }

  /**
   * Fase 3 · Meta colectiva:
   * La barra del camión avanza visualmente por cada respuesta correcta.
   */
  public avanzarMetaCamion(): void {
    this.progresoCamion++;
    this.actualizarMetaCamion();
  }

  /**
   * Cierra el juego emitiendo el evento 'fin' con aciertos y total coherentes.
   */
  public override cerrarConFin(datos?: {
    aciertos?: number;
    total?: number;
    duracionMs?: number;
    completado?: boolean;
  }): void {
    const total = datos?.total ?? this.totalItems;
    const aciertos = datos?.aciertos ?? Math.min(this.aciertos, total);
    const duracionMs =
      datos?.duracionMs ??
      (this.tiempoInicioJuego > 0 ? Math.max(0, Date.now() - this.tiempoInicioJuego) : 0);
    const completado = datos?.completado ?? aciertos >= total;

    super.cerrarConFin({
      aciertos,
      total,
      duracionMs,
      completado
    });
  }

  /**
   * Dibuja la barra superior del camión de reparto para la meta colectiva.
   */
  protected crearMetaCamion(): void {
    if (!this.add) return;

    const ancho = this.cameras?.main?.width ?? 800;
    const xBase = ancho - 210;
    const yBase = 68;

    this.contenedorCamion = this.add.container(xBase, yBase);

    const bg = this.add.graphics();
    bg.fillStyle(0xffffff, 0.9);
    bg.fillRoundedRect(0, 0, 194, 32, 8);
    bg.lineStyle(2, 0xffa726, 0.8);
    bg.strokeRoundedRect(0, 0, 194, 32, 8);
    this.contenedorCamion.add(bg);

    const visualCamion = resolverVisual("camion-reparto");
    const icono = this.add
      .text(12, 16, visualCamion.emoji, { fontSize: "18px" })
      .setOrigin(0, 0.5);
    this.contenedorCamion.add(icono);

    const barraFondo = this.add.graphics();
    barraFondo.fillStyle(0xeeeeee, 1);
    barraFondo.fillRoundedRect(42, 10, 80, 12, 6);
    this.contenedorCamion.add(barraFondo);

    this.barraCamionGrafico = this.add.graphics();
    this.contenedorCamion.add(this.barraCamionGrafico);

    this.textoCamion = this.add
      .text(130, 16, `${this.progresoCamion}/${this.objetivoCamion}`, {
        fontSize: "12px",
        color: "#333333",
        fontStyle: "bold"
      })
      .setOrigin(0, 0.5);
    this.contenedorCamion.add(this.textoCamion);

    this.actualizarMetaCamion();
  }

  /**
   * Actualiza el progreso visual de la meta colectiva del camión.
   */
  protected actualizarMetaCamion(): void {
    if (this.textoCamion) {
      this.textoCamion.setText(`${this.progresoCamion}/${this.objetivoCamion}`);
    }

    if (this.barraCamionGrafico) {
      this.barraCamionGrafico.clear();
      const pct = Math.min(1, Math.max(0, this.progresoCamion / Math.max(1, this.objetivoCamion)));
      const anchoRelleno = Math.max(4, 80 * pct);
      const color = pct >= 1 ? 0x4caf50 : 0xffa726;
      this.barraCamionGrafico.fillStyle(color, 1);
      this.barraCamionGrafico.fillRoundedRect(42, 10, anchoRelleno, 12, 6);
    }
  }

  /**
   * Renderiza el ítem actual de la tienda: consigna, estanterías, bolsa y productos.
   */
  protected renderizarItem(): void {
    if (!this.add || !this.itemActual) return;

    this.limpiarItemVisual();

    const ancho = this.cameras?.main?.width ?? 800;
    this.contenedorItemActual = this.add.container(0, 0);

    const item = this.itemActual;

    // 1. Consigna visual (si existe)
    if (item.consigna) {
      const consignaBox = this.add.graphics();
      consignaBox.fillStyle(0xffffff, 0.95);
      consignaBox.fillRoundedRect(ancho / 2 - 130, 68, 260, 36, 10);
      consignaBox.lineStyle(2, 0x42a5f5, 0.8);
      consignaBox.strokeRoundedRect(ancho / 2 - 130, 68, 260, 36, 10);
      this.contenedorItemActual.add(consignaBox);

      let textoConsigna = "";
      if (item.consigna.asset) {
        const visualAsset = resolverVisual(item.consigna.asset);
        textoConsigna += `${visualAsset.emoji} `;
      }
      if (item.consigna.texto) {
        textoConsigna += item.consigna.texto;
      }

      const txt = this.add
        .text(ancho / 2, 86, textoConsigna, {
          fontSize: "16px",
          color: "#1e88e5",
          fontStyle: "bold"
        })
        .setOrigin(0.5);
      this.contenedorItemActual.add(txt);
    }

    // 2. Estanterías
    const numEstanterias = item.estanterias.length;
    const anchoEstanteria = numEstanterias === 2 ? 240 : 190;
    const altoEstanteria = 110;
    const yEstanteria = 175;
    const espaciado = (ancho - 80) / numEstanterias;

    item.estanterias.forEach((est, idx) => {
      const xEst = 40 + espaciado * idx + espaciado / 2;
      const visualEst = resolverVisual(est.asset);
      const colorEst = colorHexANumero(visualEst.color);

      const contenedorEst = this.add.container(xEst, yEstanteria);

      const bgEst = this.add.graphics();
      bgEst.fillStyle(0xffffff, 0.9);
      bgEst.fillRoundedRect(
        -anchoEstanteria / 2,
        -altoEstanteria / 2,
        anchoEstanteria,
        altoEstanteria,
        12
      );
      bgEst.lineStyle(3, colorEst, 0.9);
      bgEst.strokeRoundedRect(
        -anchoEstanteria / 2,
        -altoEstanteria / 2,
        anchoEstanteria,
        altoEstanteria,
        12
      );
      contenedorEst.add(bgEst);

      const emojiEst = this.add
        .text(0, -22, visualEst.emoji, { fontSize: "36px" })
        .setOrigin(0.5);
      contenedorEst.add(emojiEst);

      const nombreEst = this.add
        .text(0, 26, visualEst.nombre ?? est.id, {
          fontSize: "13px",
          color: "#333333",
          fontStyle: "bold",
          wordWrap: { width: anchoEstanteria - 20 },
          align: "center"
        })
        .setOrigin(0.5);
      contenedorEst.add(nombreEst);

      const zona = this.add
        .zone(xEst, yEstanteria, anchoEstanteria, altoEstanteria)
        .setRectangleDropZone(anchoEstanteria, altoEstanteria);
      zona.setData("estanteriaId", est.id);

      this.contenedorItemActual?.add(contenedorEst);
      this.contenedorItemActual?.add(zona);
    });

    // 3. Bolsa de pedido
    if (item.accion === "pedido" || item.pedido) {
      const xBolsa = ancho / 2;
      const yBolsa = 295;
      const anchoBolsa = 180;
      const altoBolsa = 64;

      const contenedorBolsa = this.add.container(xBolsa, yBolsa);

      const bgBolsa = this.add.graphics();
      bgBolsa.fillStyle(0xfff8e1, 0.95);
      bgBolsa.fillRoundedRect(-anchoBolsa / 2, -altoBolsa / 2, anchoBolsa, altoBolsa, 12);
      bgBolsa.lineStyle(3, 0xffa000, 0.9);
      bgBolsa.strokeRoundedRect(-anchoBolsa / 2, -altoBolsa / 2, anchoBolsa, altoBolsa, 12);
      contenedorBolsa.add(bgBolsa);

      const emojiBolsa = this.add.text(-40, 0, "🛍️", { fontSize: "32px" }).setOrigin(0.5);
      contenedorBolsa.add(emojiBolsa);

      const cantidadReq = item.pedido?.cantidad ?? 1;
      this.textoBolsa = this.add
        .text(15, 0, `${this.productosEnBolsa.length} / ${cantidadReq}`, {
          fontSize: "20px",
          color: "#d84315",
          fontStyle: "bold"
        })
        .setOrigin(0.5);
      contenedorBolsa.add(this.textoBolsa);

      const zonaBolsa = this.add
        .zone(xBolsa, yBolsa, anchoBolsa, altoBolsa)
        .setRectangleDropZone(anchoBolsa, altoBolsa);
      zonaBolsa.setData("esBolsa", true);

      this.contenedorItemActual?.add(contenedorBolsa);
      this.contenedorItemActual?.add(zonaBolsa);
    }

    // 4. Productos interactivos
    const productosVisibles = item.productos.filter(
      (p) => !this.productosClasificados.has(p.id) && !this.productosEnBolsa.includes(p.id)
    );

    const numProd = productosVisibles.length;
    const yBaseProd = item.accion === "pedido" || item.pedido ? 410 : 360;
    const filas = numProd > 5 ? 2 : 1;
    const porFila = Math.ceil(numProd / filas);

    productosVisibles.forEach((p, idx) => {
      const fila = Math.floor(idx / porFila);
      const col = idx % porFila;
      const espaciadoX = ancho / (porFila + 1);
      const posX = espaciadoX * (col + 1);
      const posY = yBaseProd + fila * 75;

      const visualProd = resolverVisual(p.asset);
      const colorProd = colorHexANumero(visualProd.color);

      const contProd = this.add.container(posX, posY);

      const bgProd = this.add.graphics();
      bgProd.fillStyle(colorProd, 0.9);
      bgProd.fillCircle(0, 0, 26);
      bgProd.lineStyle(2, 0xffffff, 1);
      bgProd.strokeCircle(0, 0, 26);
      contProd.add(bgProd);

      const emojiProd = this.add
        .text(0, 0, visualProd.emoji, { fontSize: "24px" })
        .setOrigin(0.5);
      contProd.add(emojiProd);

      contProd.setSize(52, 52);
      contProd.setInteractive();
      if (this.input) {
        this.input.setDraggable(contProd);
      }

      contProd.setData("productoId", p.id);
      contProd.setData("origX", posX);
      contProd.setData("origY", posY);

      this.mapaProductosVisuales.set(p.id, contProd);
      this.contenedorItemActual?.add(contProd);
    });
  }

  /**
   * Actualiza el indicador visual de la cantidad en la bolsa.
   */
  protected actualizarVisualBolsa(): void {
    if (this.textoBolsa && this.itemActual?.pedido) {
      this.textoBolsa.setText(
        `${this.productosEnBolsa.length} / ${this.itemActual.pedido.cantidad}`
      );
    }
  }

  /**
   * Limpia los elementos visuales del ítem actual.
   */
  protected limpiarItemVisual(): void {
    if (this.contenedorItemActual) {
      try {
        this.contenedorItemActual.destroy();
      } catch {
        // Ignorar
      }
      this.contenedorItemActual = null;
    }
    this.mapaProductosVisuales.clear();
    this.textoBolsa = null;
  }
}

export { MecanicaTienda as EscenaTienda };
