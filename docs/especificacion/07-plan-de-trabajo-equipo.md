# 07 · Plan de trabajo del equipo

Reparto del plan de implementación ([05](05-plan-implementacion-mvp.md)) entre dos personas, sin tareas compartidas. Los nombres de las tareas se usan en los commits y en los PR (`U1`…`U9` y `C1`…`C7`).

- **U** = yo (gustadev121): backend, contenido, datos, despliegue y panel docente.
- **C** = Choflis: motor de juego, experiencia del alumno, sala de activación en pantalla e impresión.

## 1. Horizontes

| Horizonte | Fecha | Qué incluye |
|---|---|---|
| **H1 · Entrega del hackathon** | 5 de noviembre, 23:59 | Juego N1 (tienda, activación con meta colectiva) y juego N2 (carrera, complemento sin conexión). Panel docente mínimo con resultados. API. **Todo funciona en localhost.** |
| **H2 · MVP completo** | Después de la entrega | Juego N3 (opción propuesta: el jardín en equilibrio), sala de activación completa, impresión y escaneo, créditos, panel completo, y despliegue con credenciales. |

**Riesgo declarado:** el alcance de H2 no cabe en menos de dos días. El plan lo separa para que H1 sea una demostración real y no un prototipo incompleto. Si H1 se cumple antes de tiempo, se avanza a H2 en el mismo orden.

## 2. Propiedad de archivos

Cada ruta tiene un único dueño. Si alguien necesita cambiar un archivo ajeno, abre un issue o un PR a su dueño. No se edita directamente.

| Ruta | Dueño |
|---|---|
| `packages/gamespec/`, `packages/prompts/`, `packages/assets/` | U |
| `apps/api/` (Worker, D1, R2, Mistral, salas en el servidor) | U |
| `fixtures/`, `docs/sesiones/` (local), `docs/especificacion/08-contrato.md` | U |
| `apps/web/src/app/` (shell, rutas, login demo), `apps/web/src/main.tsx` | U |
| `apps/web/src/docente/` (panel docente) | U |
| `wrangler.toml`, `package.json` raíz, `tsconfig.base.json` | U |
| `packages/engine/` (Phaser: tienda, carrera, tutorial, feedback) | C |
| `apps/web/src/juego/` (reproductor de complemento, progreso sin conexión) | C |
| `apps/web/src/sala/` (vista del alumno y vista de proyección) | C |
| `packages/print/` y `apps/web/src/escaner/` (impresión y escaneo) | C |

**Reglas de convivencia:**
1. El **contrato** (`08-contrato.md`, que escribe U en la primera hora) es la única forma en que se hablan el backend y el frontend. Si cambia, se versiona y los dos lo aprueban.
2. Cambios en archivos ajenos solo por PR o issue.
3. Ramas: `feat/u-<tarea>` y `feat/c-<tarea>`. Se integra a `main` por PR. No se reescribe el historial publicado.
4. Sincronización de 15 minutos al inicio de cada bloque, para decir qué se integró y qué se bloquea.

## 3. Contrato (primera tarea del equipo)

**U1 · Contrato v1 (1 h, U).** ✅ Publicado en `docs/especificacion/08-contrato.md`. Contiene:

- **GameSpec:** referencia a `packages/gamespec` como fuente. Congelado en v2.
- **API:** rutas y formas de petición y respuesta de:
  - Juegos: listar, obtener versión publicada, publicar.
  - Intentos: `POST /api/intentos` con respuestas por ítem (criterio, correcta, tiempo, fuente `digital` o `papel`).
  - Salas: crear, unirse, estado (polling), responder, avanzar.
  - Panel: resultados por criterio, lista de riesgo y CSV.
- **Eventos del motor:** `inicio`, `respuesta` y `fin`, con su payload. Son lo que el motor de C emite y lo que la API guarda.
- **Autenticación demo:** cómo se identifica el docente y el alumno en cada petición.

**Objetivo de H1: localhost.** Todo se prueba con `wrangler dev` (D1 y R2 locales) y el juego de respaldo de `fixtures/`. Las credenciales de Cloudflare y de Mistral se integran al final, en H2.

**Puerta de entrada:** C no empieza C4 ni C5 hasta que U1 esté publicado. C1, C2 y C3 pueden empezar con el GameSpec ya congelado.

## 4. Tareas de U (yo)

| ID | Tarea | Horas | Prioridad | Depende de |
|---|---|---|---|---|
| U1 | Contrato v1 | 1 | H1 | ✅ Hecho |
| U2 | Esqueleto de `apps/web` (Vite, React, rutas, login demo) | 1 | H1 | ✅ Hecho |
| U3 | Re-extraer la sesión de 1.º con sus criterios de evidencia y regenerar el juego N1 | 1 | H1 | ✅ Hecho |
| U3b | Extraer la sesión de N3 (ecosistemas) y generar su juego con el mismo flujo, cuando se confirme la opción A | 1.5 | H2 | Confirmación de la opción |
| U4 | D1: esquema y migraciones. Worker con rutas de juegos, versiones, intentos y panel | 4 | H1 | U1 |
| U5 | Pipeline de Mistral: ejecución real, caché y registro de tokens | 2 | H2 (credenciales al final) | U4 |
| U6 | Salas de activación en el servidor: crear, unirse, estado, responder, avanzar | 1.5 | H2 (H1 si da tiempo) | U1, U4 |
| U7 | Panel docente: revisar sesión, ver juego, publicar, resultados por criterio, riesgo y CSV | 4 | H1 (mínimo) | U2, U4 |
| U8 | Despliegue en Cloudflare: `wrangler`, D1, R2, secretos, URL y prueba de humo | 1.5 | H2 (al final, con credenciales) | U4 |
| U9 | Juego N3: generación, validación y guardado (U3b) | Variable | H2 | U3b |

**Total H1:** ≈ 12,5 h. **Total con H2:** ≈ 18 h.

## 5. Tareas de C (Choflis)

| ID | Tarea | Horas | Prioridad | Depende de |
|---|---|---|---|---|
| C1 | Base de Phaser: escena genérica, tutorial corto sin texto, retroalimentación y eventos | 1.5 | H1 | ✅ Hecho (portado) |
| C2 | Mecánica tienda: arrastrar a estantería, pedido en bolsa, barra del camión (meta colectiva) | 3 | H1 | C1 |
| C3 | Mecánica carrera: Reglita, botones ×10 y ÷10, escalera animada, arrastrar el resultado | 3 | H1 | C1 |
| C4 | Juego de complemento: `/j/:codigo`, ingreso del alumno, progreso en IndexedDB, envío al reconectar | 2 | H1 | U1, C1 |
| C5 | Sala de activación en el celular del alumno y vista de proyección sin datos personales | 2 | H2 | U1, U6, C1 |
| C6 | Hoja imprimible de la carrera (A4, QR, casillas, marcas de registro) | 2 | H2 | C3 |
| C7 | Escaneo con cámara, lectura de QR y confirmación manual | 2 | H2 | C6, U4 |

**Total H1:** ≈ 9,5 h. **Total con H2:** ≈ 15,5 h.

**Balance:** U tiene más trabajo de backend en H1 (≈ 12,5 h frente a ≈ 9,5 h de C). Para equilibrar, si C termina H1 antes, toma **U6** (salas en el servidor) o pasa a **C5** y **C6**.

## 6. Cronograma

**Hoy (4 de noviembre, noche)**

| Persona | Trabajo |
|---|---|
| U | U1 (contrato) y U2 (esqueleto web). Después U3. |
| C | C1 (base de Phaser) con el GameSpec congelado. Después C2. |

**Mañana (5 de noviembre), primera mitad**

| Persona | Trabajo |
|---|---|
| U | U4 (D1 y Worker). Después U7 en versión mínima. |
| C | C2 y C3 terminados. C4 cuando U1 esté publicado. |

**Mañana (5 de noviembre), segunda mitad**

| Persona | Trabajo |
|---|---|
| U | Prueba de humo en localhost con los juegos N1 y N2. |
| C | Integración con la API en localhost. Corrección de errores de la prueba de humo. |

**Último tramo (5 de noviembre)**

- Ensayo de la demo con el plan B de [04 · MVP](04-mvp-hack4edu.md).
- Grabación del video (3 min).
- Repositorio público, README final y entrega antes de las 23:59.

Si al cierre de la mañana H1 no está integrado, se recorta en este orden: panel docente a una vista de resultados, después la sala de activación (se usa el juego N1 en modo proyección del docente), y después U5.

## 7. Criterios de terminado de H1

- **N1:** el juego de la tiendita se juega completo en celular y computadora, con la meta del camión y los resultados visibles en el panel por criterio.
- **N2:** la carrera se juega sin conexión y el progreso llega al panel al reconectar.
- **Panel:** muestra participación y aciertos por criterio de los dos juegos, con el origen de generación.
- **Localhost:** la aplicación corre en `localhost` y se prueba desde un celular en la misma red.

## 8. Pendientes que bloquean

| Pendiente | Responsable | Bloquea |
|---|---|---|
| Clave de Mistral | Coordinación | U5. Se entrega al final; H1 usa los fixtures. |
| Cuenta de Cloudflare y `wrangler login` | U | U8. Se entrega al final; H1 corre en localhost con `wrangler dev`. |
| Confirmación de la opción N3 | Equipo | U3b y U9 |
| Usuario de GitHub de Choflis confirmado como colaborador | U | Inicio de C |
