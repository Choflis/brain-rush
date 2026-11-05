# @brain-rush/engine · Base del motor de juego (Phaser)

Base del motor educativo para BRAIN RUSH construido sobre **Phaser**. Permite inicializar y renderizar dinámicas a partir de especificaciones formales (`GameSpec`) y emitir eventos según el contrato v1 (`docs/especificacion/08-contrato.md`).

## Arquitectura y Archivos

- **`src/eventos.ts`**:
  Define el tipo estricto `EventoMotor` según la sección 7 del contrato (`inicio`, `respuesta`, `fin`) y la clase `EmisorEventosMotor` (`emitir`, `suscribir`, `desuscribir`) totalmente desacoplada de la red y sin efectos secundarios.

- **`src/visuales.ts`**:
  Resolvedor `assetId → { emoji, color, forma }` con cobertura para **todos** los identificadores utilizados en `fixtures/juegos/n1-tienda.json` y `fixtures/juegos/n2-carrera-unidades-longitud.json`, además del catálogo de assets de BRAIN RUSH. Incluye fallback seguro (`VISUAL_POR_DEFECTO`) para que el motor funcione y se dibuje sin requerir archivos SVG/PNG externos.

- **`src/feedback.ts`**:
  `CapaFeedback`: capa de retroalimentación gráfica sobre Phaser. Para aciertos muestra estrella (`⭐`) o aplauso (`👏`); para errores muestra pista (`💡`). Se dibuja mediante geometría vectorial (Phaser Graphics) y colores temáticos, asegurando que nunca falle por assets ausentes.

- **`src/escena.ts`**:
  `EscenaBase`: clase base que extiende `Phaser.Scene`.
  - Recibe un `GameSpec` y un identificador de versión (`versionId`).
  - Muestra un tutorial durante ~3 segundos (`duracionTutorialMs`) utilizando la animación declarada en el spec, sin requerir texto obligatorio.
  - Emite el evento `inicio` al concluir el tutorial.
  - Expone `emitirRespuesta(...)` para emitir el evento `respuesta` por ítem evaluado.
  - Expone `cerrarConFin(...)` para emitir el evento `fin`.
  - No realiza llamadas de red (`fetch`) ni accede a `localStorage`.

- **`src/polyfill.ts`**:
  Mocks mínimos del DOM (`window`, `document`, `HTMLCanvasElement`, `Image`) que permiten ejecutar y probar la escena de Phaser en Node.js sin navegador (modo headless) para pruebas unitarias.

- **`src/index.ts`**:
  Punto de entrada del paquete que reexporta la API pública completa.

---

## Cómo usar el motor

```ts
import Phaser from "phaser";
import { EscenaBase, crearEmisorEventos, type EventoMotor } from "@brain-rush/engine";
import type { GameSpec } from "@brain-rush/gamespec";

// 1. Crear el emisor y suscribir los manejadores del contenedor
const emisor = crearEmisorEventos();
emisor.suscribir((evento: EventoMotor) => {
  switch (evento.tipo) {
    case "inicio":
      console.log("Juego iniciado:", evento.juegoId, evento.iniciadoEn);
      break;
    case "respuesta":
      console.log("Item respondido:", evento.itemId, "Correcto:", evento.correcto);
      break;
    case "fin":
      console.log("Juego terminado. Aciertos:", evento.aciertos, "/", evento.total);
      break;
  }
});

// 2. Instanciar la escena con el GameSpec
const escena = new EscenaBase({
  spec: juegoSpec,
  versionId: "v1",
  alumnoId: "alu_123", // opcional
  salaId: "sala_abc",   // opcional
  emisor
});

// 3. Iniciar el juego en Phaser
const game = new Phaser.Game({
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  scene: [escena]
});
```

---

## Verificación y Pruebas

Los scripts de prueba se ejecutan directamente con el motor de pruebas nativo de Node.js (Node 24 ejecuta archivos TypeScript directamente; también puede usarse `node --experimental-strip-types --test` si el entorno lo requiere):

1. **Verificación de tipos (TypeScript estricto):**
   ```sh
   npm run typecheck -w packages/engine
   ```

2. **Pruebas de eventos y contrato:**
   ```sh
   cd packages/engine
   node --test src/eventos.test.ts
   # o: node --experimental-strip-types --test src/eventos.test.ts
   ```

3. **Pruebas del resolvedor visual (cobertura total de fixtures):**
   ```sh
   cd packages/engine
   node --test src/visuales.test.ts
   ```

4. **Pruebas de la escena base y ciclo de vida:**
   ```sh
   cd packages/engine
   node --test src/escena.test.ts
   ```

5. **Suite completa de tests:**
   ```sh
   cd packages/engine
   npm test
   ```

---

## Estado actual y qué queda para C2 y C3

### Implementado en C1 (Base del motor):
- Configuración de dependencias Phaser en el workspace.
- `tsconfig.json` estricto con `moduleResolution: "bundler"`.
- Tipos de eventos y emisor conforme a la Sección 7 del contrato v1.
- Resolvedor visual completo con soporte offline por geometría y emojis para todos los assets de fixtures.
- Capa de feedback vectorial resiliente a la falta de archivos de arte.
- Escena base con ciclo de tutorial (~3s), cálculo de métricas y métodos de emisión de respuesta y fin.

### Pendiente para C2 (Mecánica Tienda - N1):
- Subclase `EscenaTienda extends EscenaBase`.
- Sistema interactivo de arrastrar y soltar (Drag & Drop) de productos.
- Implementación de la acción `clasificar`: drop zones por estantería y verificación de correspondencia `producto.categoria === estanteria.id`.
- Implementación de la acción `pedido`: drop zone en bolsa/caja registradora y conteo de la cantidad pedida.
- Regla de negocio de C1: evaluación del ítem contra el spec y emisión de `respuesta` acumulando intentos al resolver.
- Integración visual de la meta colectiva (`meta.tipo = "camion"`).

### Pendiente para C3 (Mecánica Carrera - N2):
- Subclase `EscenaCarrera extends EscenaBase`.
- Dibujo interactivo de la escalera de unidades métricas (`km, hm, dam, m, dm, cm, mm`).
- Botones interactivos de salto `×10` y `÷10` que actualizan el valor de la medida.
- Selección o arrastre del resultado hacia la puerta del guardián.
- Validación de acierto contra `opciones[correcta]`.
- Animaciones de avance del personaje Reglita a través de la puerta guardián al acertar.
