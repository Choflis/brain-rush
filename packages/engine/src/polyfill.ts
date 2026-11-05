/**
 * Polyfill mínimo para permitir importar y ejecutar el motor Phaser en entornos
 * sin navegador (Node.js en modo headless para pruebas unitarias).
 * En el navegador, este archivo no realiza ninguna modificación.
 */

if (typeof window === "undefined") {
  class MockHTMLCanvasElement {
    style: Record<string, string> = {};
    parentNode = {
      removeChild: () => {}
    };
    getContext(): Record<string, unknown> {
      return {
        fillStyle: "",
        fillRect: () => {},
        getImageData: () => ({ data: [0, 0, 0, 0] }),
        putImageData: () => {},
        createImageData: () => ({ data: [] })
      };
    }
  }

  class MockImage {}

  const g = globalThis as unknown as Record<string, unknown>;
  g.HTMLCanvasElement = MockHTMLCanvasElement;
  g.Image = MockImage;
  g.window = globalThis;

  const canvasInstance = new MockHTMLCanvasElement();
  g.document = {
    createElement: () => canvasInstance,
    documentElement: { style: {} },
    body: {
      appendChild: () => {},
      removeChild: () => {}
    }
  };
}

export {};
