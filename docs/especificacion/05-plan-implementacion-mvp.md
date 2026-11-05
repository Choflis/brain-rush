# 05 · Plan de implementación del MVP del sistema

Este plan describe el MVP de BRAIN RUSH como **sistema funcional**, con la conexión a Mistral lista para generar juegos. Complementa el [MVP del hackathon](04-mvp-hack4edu.md).

## 1. Qué significa «MVP del sistema»

El MVP es un sistema que, a partir de una sesión de aprendizaje, produce un juego jugable, lo publica y muestra sus resultados. Tiene tres partes:

1. **Motor del sistema:** validación del GameSpec, prompts versionados, cliente de Mistral, pipeline de generación, motor de juego, sala de activación, juego de complemento, panel docente.
2. **Contenido:** los juegos concretos del MVP. Se generan de dos maneras:
   - **Con Mistral**, cuando el sistema tiene clave y cuota. Es la vía normal.
   - **Con subagentes**, siguiendo el mismo prompt versionado y la misma validación. Es la vía del MVP mientras se consiguen sesiones y se resuelve la clave.
3. **Trazabilidad:** cada juego registra cómo se generó (Mistral o subagente), con qué versión de prompt y cuántos intentos se usaron.

## 2. Alcance del MVP

Tres juegos, uno por nivel (decisión del equipo):

| Nivel | Grados | Juego | Tipo | Mecánica | Sesión | Estado |
|---|---|---|---|---|---|---|
| **N1** | 1.º y 2.º | Juego 1 | Activación | Trivia | Pendiente | ⏳ Falta sesión de 1.º o 2.º |
| **N2** | 3.º y 4.º | Juego 2 | Complemento | Recorrido | «Unidades de longitud» (3.º) | ✅ Generado y validado |
| **N3** | 5.º y 6.º | Juego 3 | Activación | Trivia | Pendiente | ⏳ Falta sesión de 5.º o 6.º |

Sesiones disponibles en `docs/sesiones/nivel-4/` (todas de 3.º de primaria, nivel N2): «Unidades de longitud», «Pictogramas», «Prevención de enfermedades respiratorias» e «Historieta». Por ahora se usa la primera para el juego N2. Las otras tres quedan disponibles para más juegos de ese nivel o para probar el pipeline.

**Criterio de éxito del MVP:** los tres juegos existen como GameSpec válidos, se juegan en el navegador, el de activación se juega en sala con varios alumnos, el de complemento se juega sin conexión, y el panel muestra los resultados de los tres.

## 3. Estado actual

| Componente | Estado | Ubicación |
|---|---|---|
| Esquema GameSpec (Zod), con reglas de texto, criterios, assets y ×10/÷10 | ✅ | `packages/gamespec/src/schema.ts`, `validate.ts` |
| Validador por línea de comandos | ✅ | `node packages/gamespec/src/cli.ts <juego.json>` |
| Catálogo de assets (N1 a N3, parcial) | ✅ parcial | `packages/assets/catalogo.json` |
| Prompts versionados (extracción, generación) | ✅ | `packages/prompts/extraccion/v1.md`, `generacion/v1.md` |
| Renderizador de prompt por nivel | ✅ | `packages/prompts/src/cli.ts` |
| Cliente de Mistral y pipeline de generación con reintento | ✅ listo, sin ejecutar | `apps/api/src/ai/` |
| Juego N2 generado y validado | ✅ | `fixtures/juegos/n2-unidades-longitud.json` |
| Motor de juego (trivia y recorrido) en Phaser | ⏳ | `packages/engine/` |
| Sala de activación | ⏳ | — |
| Juego de complemento con progreso sin conexión | ⏳ | — |
| Impresión y escaneo | ⏳ (opcional en MVP) | `packages/print/` |
| Panel docente | ⏳ | `apps/web/` |
| API en Worker, D1, R2 y despliegue | ⏳ | `apps/api/` |

## 4. Flujo de generación de un juego

El mismo flujo sirve para Mistral y para subagentes. Lo único que cambia es quién produce el JSON en el paso 3.

```
1. Sesión (.docx / texto)
      │
2. Extracción → JSON de sesión (extraccion/v1)      → fixtures/sesiones/<id>.json
      │
3. Renderizado del prompt por nivel y mecánica       → node packages/prompts/src/cli.ts ...
      │
4. Generación → JSON de GameSpec                     → Mistral  |  subagente
      │
5. Validación (esquema, criterios, assets, texto, ×10/÷10)
      │   └─ si falla: un reintento con los errores en el prompt
      │
6. Guardar versión + registro de origen              → fixtures/juegos/<id>.json  (y R2/D1 en el sistema)
```

**Trazabilidad:** cada juego guarda `generadoPor` (`mistral:<modelo>` o `subagente`), la versión del prompt, el número de intentos y los errores del primer intento. En el panel se muestra el origen, sin ocultarlo.

**Regla para subagentes:** deben seguir el prompt renderizado sin consultar otros materiales del repositorio. Así su salida se compara con la de Mistral y el sistema puede cambiar de generador sin cambiar el resultado.

## 5. Paquetes de trabajo pendientes

Cada paquete indica archivos y criterio de terminado. Las horas son estimaciones para una persona.

### WP-A · Motor de juego en Phaser (≈5 h)

`packages/engine/src/`:

- **`trivia.ts`** (N1 y N3): pregunta con imagen grande y opciones con pictograma, barra de tiempo, estrella o pista según la respuesta. Emite `inicio`, `respuesta`, `fin`.
- **`recorrido.ts`** (N2): escalera de unidades. El alumno elige la opción y Reglita avanza. Tutorial con `anim-tutorial-escalera`.
- **`tutorial.ts`** y **`feedback.ts`**: animación corta sin texto y respuestas visuales.

**Criterio:** los juegos de `fixtures/juegos/` se juegan completos en celular y en computadora.

### WP-B · Sala de activación (≈3 h)

Versión con polling (sin WebSocket):

- `POST /api/salas` crea la sala para una versión publicada y devuelve un código de 4 letras.
- `POST /api/salas/:codigo/unirse` entra con nombre de la lista (sin correo).
- `GET /api/salas/:codigo/estado` se consulta cada segundo.
- `POST /api/salas/:codigo/respuesta` registra una respuesta por pregunta.
- `POST /api/salas/:codigo/avanzar` (solo docente).
- Vista de proyección sin datos personales.

**Criterio:** cinco alumnos responden un juego de activación y el panel muestra los resultados por criterio.

### WP-C · Juego de complemento (≈2 h)

- Ruta `/j/:codigo`, entrada con código de aula y nombre de la lista.
- Progreso en IndexedDB y envío al reconectar.
- Pantalla final con insignias, sin notas numéricas.

**Criterio:** el juego N2 se juega sin red y el resultado llega al panel al reconectar.

### WP-D · API, base de datos y despliegue (≈4 h)

- Worker de Cloudflare con rutas de sesiones, juegos, versiones, salas, intentos y créditos. Lee las claves de Mistral como secreto.
- Esquema de D1 en `apps/api/migrations/`: colegios, aulas, alumnos, sesiones, juegos, versiones, intentos, respuestas y créditos.
- R2 para GameSpec por versión.
- Ruta `POST /api/juegos` que llama a `generarJuego()` de `apps/api/src/ai/generar.ts`.
- Despliegue con `wrangler deploy`.

**Criterio:** un juego creado con `fixtures/juegos/` se publica y se puede jugar en la URL de demo.

### WP-E · Panel docente (≈3 h)

- Acceso con cuenta demo.
- Sesiones: revisar campos extraídos y confirmar.
- Juegos: ver el GameSpec por criterio, pedir un ajuste en lenguaje natural (crea versión nueva), publicar, mostrar el origen de generación.
- Resultados: participación, aciertos por criterio, lista de riesgo y CSV.
- Créditos simulados.

**Criterio:** un docente recorre el flujo completo sin ayuda técnica.

### WP-F · Impresión y escaneo del N2 (≈2 h, opcional)

- Hoja A4 con marcas de registro, QR (`gameId`, `versionId`, `sheetCode`) y casillas.
- Escaneo con jsQR y confirmación manual.

**Criterio:** una hoja impresa se escanea y el resultado aparece en el panel.

### WP-G · Pruebas del pipeline con Mistral (≈1 h, cuando haya clave)

- Generar el juego N2 con Mistral usando el mismo prompt y comparar con la versión de subagente.
- Medir tokens por generación para el modelo de créditos.
- Registrar en `credit_ledger`.

## 6. Contenido del MVP: cómo se produce cada juego

Para cada juego pendiente (N1 y N3) el procedimiento es el mismo que para el N2:

1. Recibir la sesión (`.docx` o texto) en `docs/sesiones/`.
2. Extraer el JSON de la sesión con `extraccion/v1` y guardarlo en `fixtures/sesiones/`.
3. Renderizar el prompt: `node packages/prompts/src/cli.ts --sesion <json> --nivel N1|N3 --tipo activacion --mecanica trivia --duracion 8`.
4. Generar el GameSpec (subagente o Mistral).
5. Validar con `node packages/gamespec/src/cli.ts <juego.json>`.
6. Guardar en `fixtures/juegos/` y el intento en `fixtures/juegos/intentos/`.

**Estado de los juegos:**

| Juego | Sesión | Paso alcanzado |
|---|---|---|
| N2 complemento (recorrido) | Unidades de longitud | ✅ Validado en el primer intento |
| N1 activación (trivia) | Pendiente | Esperando sesión de 1.º o 2.º |
| N3 activación (trivia) | Pendiente | Esperando sesión de 5.º o 6.º |

Las sesiones de nivel N2 restantes (Pictogramas, Enfermedades respiratorias, Historieta) pueden usarse para generar juegos de prueba del pipeline o para versiones alternativas del N2. Esto no cambia el alcance de tres juegos salvo que el equipo lo decida.

## 7. Calendario

Hoy es 4 de noviembre y la entrega del hackathon es el 5 a las 23:59. Prioridades:

| Prioridad | Trabajo | Dependencia |
|---|---|---|
| **P0** | Motor de juego (WP-A) con el juego N2 | Juego N2 ya validado |
| **P0** | Juego N2 de complemento sin red (WP-C) | WP-A |
| **P0** | Panel mínimo con resultados del juego N2 (WP-E parcial) | Resultados guardados |
| **P1** | Trivia para N1 y N3 (WP-A) | Sesiones de 1.º–2.º y 5.º–6.º |
| **P1** | Sala de activación (WP-B) | Trivia |
| **P1** | API y despliegue (WP-D) | Pantallas listas |
| **P2** | Impresión y escaneo (WP-F) | Juego N2 |
| **P2** | Pruebas con Mistral (WP-G) | Clave de Mistral |

Si las sesiones de N1 y N3 no llegan a tiempo, el hackathon se presenta con un juego de activación real (N2 en modo proyección) y dos juegos de activación más en estado «en preparación», explicándolo con honestidad en el pitch.

## 8. Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| No hay sesiones de N1 y N3 a tiempo | Alta | Alto | Pipeline listo; se usa la sesión que llegue. Se declara en el pitch. |
| Mistral sin clave o sin cuota | Alta hoy | Medio | Subagentes con el mismo prompt. Validación igual. |
| Diferencias entre la salida de subagente y la de Mistral | Media | Bajo | Validador común; se compara al hacer WP-G. |
| Juegos generados con texto demasiado largo para el nivel | Media | Medio | Límites de palabras en el validador. |
| Sala de activación con muchos alumnos a la vez | Baja | Medio | Polling cada segundo y prueba con cinco alumnos. |

## 9. Lo que necesito de ti

1. **Sesiones de 1.º o 2.º** (para el juego N1) y **de 5.º o 6.º** (para el juego N3). Se procesan con el mismo flujo que el N2.
2. **Confirmar** si las sesiones de nivel 4 pueden usarse también para juegos adicionales de N2 o solo para pruebas.
3. **Clave de Mistral** cuando esté disponible, para ejecutar WP-G.
4. **Cuenta de Cloudflare** para WP-D.
