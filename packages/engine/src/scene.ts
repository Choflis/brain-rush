import Phaser from "phaser";

/** Visual layer only: academic rules and input stay in the controller/accessible host. */
export interface TiendaWorld {
  feedback(x: number, y: number, correct: boolean): void;
  loadBox(): void;
  pause(paused: boolean): void;
  destroy(): void;
}

export function mountTiendaWorld(parent: HTMLElement, reducedMotion: boolean): TiendaWorld {
  let ready = false;
  let paused = false;
  let mascot: Phaser.GameObjects.Image;
  let background: Phaser.GameObjects.Image;
  let ambient: Phaser.Tweens.Tween | undefined;
  class Shop extends Phaser.Scene {
    preload() {
      this.load.image("shop-room", "/juego/tiendita/tienda-fondo-calido.png");
      this.load.image("shop-guide", "/juego/tiendita/mascota.png");
    }
    create() {
      background = this.add.image(0, 0, "shop-room").setOrigin(.5);
      mascot = this.add.image(0, 0, "shop-guide").setOrigin(.5, 1);
      ready = true;
      parent.dataset.ready = "true";
      const resize = () => {
        const { width, height } = this.scale;
        const source = background.texture.getSourceImage() as HTMLImageElement;
        const scale = Math.max(width / source.width, height / source.height);
        background.setPosition(width / 2, height / 2).setScale(scale).setAlpha(.48);
        ambient?.stop();
        const h = Math.min(height * .53, width * .23, 290);
        const desktop = window.matchMedia("(min-width: 720px)").matches;
        mascot.setDisplaySize(h * .88, h).setPosition(width * .105, height - 44).setVisible(desktop);
        if (!reducedMotion && desktop) ambient = this.tweens.add({ targets: mascot, y: height - 51, duration: 1700, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      };
      resize();
      this.tweens.timeScale = paused ? 0 : 1;
      this.scale.on("resize", resize);
      this.events.once("shutdown", () => this.scale.off("resize", resize));
    }
  }
  const scene = new Shop();
  const game = new Phaser.Game({
    type: Phaser.CANVAS, parent, transparent: true, scene,
    width: Math.max(1, parent.clientWidth), height: Math.max(1, parent.clientHeight),
    scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
    render: { antialias: true }, audio: { noAudio: true },
    fps: { target: 45, forceSetTimeOut: true }, banner: false,
  });
  const observer = new ResizeObserver(() => {
    if (parent.clientWidth && parent.clientHeight) game.scale.resize(parent.clientWidth, parent.clientHeight);
  });
  observer.observe(parent);
  return {
    feedback(x, y, correct) {
      if (!ready || !scene.sys.isActive()) return;
      const count = reducedMotion ? 1 : correct ? 7 : 2;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        const dot = scene.add.star(x, y, 5, 3, correct ? 9 : 5, correct ? 0xc2dc75 : 0x1f7a6a).setAlpha(.95);
        scene.tweens.add({ targets: dot, x: x + Math.cos(angle) * (reducedMotion ? 0 : 55), y: y + Math.sin(angle) * (reducedMotion ? 0 : 45) - 20, alpha: 0, angle: 45, duration: reducedMotion ? 180 : 500, ease: "Cubic.easeOut", onComplete: () => dot.destroy() });
      }
    },
    loadBox() {
      if (!ready || !scene.sys.isActive() || reducedMotion) return;
      const { width, height } = scene.scale;
      const box = scene.add.rectangle(width * .65, height * .55, 24, 24, 0xf3c766).setStrokeStyle(2, 0xd29c45);
      scene.tweens.add({ targets: box, x: width * .12, y: height * .8, angle: -20, scale: .5, duration: 650, ease: "Cubic.easeIn", onComplete: () => box.destroy() });
      if (mascot.visible) scene.tweens.add({ targets: mascot, angle: -5, duration: 160, yoyo: true, repeat: 1 });
    },
    pause(value) { paused = value; if (ready) { scene.tweens.timeScale = paused ? 0 : 1; } },
    destroy() { ready = false; delete parent.dataset.ready; observer.disconnect(); game.destroy(true); },
  };
}
