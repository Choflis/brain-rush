# Comprobación del diseño

Con la web y la API local encendidas (`npm run dev:web` y `npm run dev:api`), desde la raíz:

```bash
npx playwright test --config apps/web/browser/playwright.config.ts
```

Usa Chrome del sistema en Linux si está disponible; también admite `CHROME_PATH` o Chromium instalado por Playwright. Los resultados temporales se guardan en `/tmp/brain-rush-design-tests`.

Cubre mirada y saludo de Reglita, movimiento reducido, pintura por teclado y toque, controles táctiles de al menos 44 px, reflujo a 320/390/768/1366 px, acceso docente, tarjetas de sesiones y ventanas de métricas/previsualización. El mosaico también se prueba a 441 px para detectar problemas entre breakpoints. `student-login.spec.ts` cubre escritura y posición del cursor, reconocimiento sin tildes, invitado con nombre, salón y rol, miniatura móvil y franja inferior completa.

La suite existente del juego permite aislar capturas y usar Chrome del sistema:

```bash
CHROME_PATH=/usr/bin/google-chrome-stable BRAINRUSH_SCREENSHOT_DIR=/tmp/brain-rush-ti PLAYWRIGHT_OUTPUT_DIR=/tmp/brain-rush-engine-tests npm run test:browser -w packages/engine
```

`teacher.spec.ts` comprueba filtros del resumen, búsqueda y vistas de sesiones, selección de alumnos, switches persistidos, referencia documental y guardado, contadores reactivos, navegación plegable, búsqueda global, foco/Escape y ayuda de Reglita, así como nombre docente y reflujo móvil/tablet/escritorio.

`game-design.spec.ts` comprueba tamaño y presencia de Reglita en partida, pasos y celebración, pausa y movimiento reducido; verifica también tamaño/movimiento en Carrera y reversión rápida de conversiones sin perder la unidad visual. La suite de interfaz contiene 34 pruebas.
