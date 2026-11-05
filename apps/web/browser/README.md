# Comprobación del diseño

Con la web y la API local encendidas (`npm run dev:web` y `npm run dev:api`), desde la raíz:

```bash
npx playwright test --config apps/web/browser/playwright.config.ts
```

Usa Chrome del sistema en Linux si está disponible; también admite `CHROME_PATH` o Chromium instalado por Playwright. Los resultados temporales se guardan en `/tmp/brain-rush-design-tests`.

Cubre mirada y saludo de Reglita, movimiento reducido, pintura por teclado y toque, controles táctiles de al menos 44 px, reflujo a 320/390/768/1366 px, acceso docente, tarjetas de sesiones y ventanas de métricas/previsualización. El mosaico también se prueba a 441 px para detectar problemas entre breakpoints.

La suite existente del juego permite aislar capturas y usar Chrome del sistema:

```bash
CHROME_PATH=/usr/bin/google-chrome-stable BRAINRUSH_SCREENSHOT_DIR=/tmp/brain-rush-ti PLAYWRIGHT_OUTPUT_DIR=/tmp/brain-rush-engine-tests npm run test:browser -w packages/engine
```
