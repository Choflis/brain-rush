# 03 · Arquitectura técnica

Objetivo: desplegar rápido, mantener costo bajo en la etapa piloto y poder jugar en la misma plataforma donde se genera el juego.

## 1. Decisiones principales

| Decisión | Elección | Motivo |
|---|---|---|
| Hosting web y API | **Cloudflare** (Pages para la web, Workers para la API) | Despliegue con un comando, HTTPS y CDN incluidos, plan gratuito generoso. |
| Base de datos | **Cloudflare D1** (SQLite) | Relacional, sin servidor que administrar, suficiente para piloto de decenas de colegios. |
| Archivos (juegos, versiones, PDFs, escaneos) | **Cloudflare R2** | Almacenamiento compatible con S3, sin cargo por salida de datos. |
| Generación de juegos y extracción de sesiones | **Mistral API** | Capa gratuita amplia para empezar. Salida en JSON estructurado. Se encapsula detrás de una interfaz (RNF-10). |
| Motor de juego en el navegador | **Phaser 3** (TypeScript) | 2D, maduro, funciona en móvil y en navegadores antiguos. Alternativa: PixiJS si se necesita algo más liviano. |
| Interfaz | **React + Vite + TypeScript + Tailwind** | Rápido de montar y de mantener. |
| Lectura de QR | **jsQR** (Apache-2.0) en el navegador | Sin servidor. Funciona con la cámara del celular. |
| Lectura de marcas en hojas | Detección por esquinas de registro + umbral de píxeles (propio) | Hoja de diseño fijo: basta con una lectura simple. OpenCV.js como respaldo. |
| Trabajos asíncronos (generar, validar, producir PDF) | **Cloudflare Queues** (fase 2). En MVP, llamada directa con reintento. | Evitar complejidad al inicio. |
| Salas en tiempo real (activación) | **Durable Objects** con WebSocket (fase 2) | Coordinación de una sala por aula. |

Todo corre en el plan gratuito o de bajo costo de Cloudflare durante el piloto. Los límites de cada servicio (Mistral, Workers, D1, R2) se verifican antes del despliegue, porque cambian con frecuencia.

## 2. Vista general

```
 Docente (navegador)            Alumno (navegador / celular)
        │                                  │
        ▼                                  ▼
 ┌──────────────────────────────────────────────────┐
 │ Cloudflare Pages: web (React + Phaser)           │
 └───────────────┬──────────────────────────────────┘
                 │ HTTPS / JSON
 ┌───────────────▼──────────────────────────────────┐
 │ Cloudflare Worker: API (Hono)                    │
 │  · Auth y roles                                  │
 │  · Sesiones (ingesta)                            │
 │  · Motor de juegos: generar, validar, versionar  │
 │  · Resultados, métricas y créditos               │
 └──┬─────────────────┬────────────────┬────────────┘
    │                 │                │
 ┌──▼───┐        ┌────▼────┐     ┌─────▼────────┐
 │  D1  │        │   R2    │     │ Mistral API  │
 │ datos│        │ juegos, │     │ (texto JSON, │
 └──────┘        │ PDFs,   │     │  OCR opc.)   │
                 │ escaneos│     └──────────────┘
                 └─────────┘
```

## 3. Estructura del repositorio (propuesta)

```
brain-rush/                       (raíz del repositorio)
├─ apps/
│  ├─ web/                        React: panel docente, panel alumno, reproductor
│  └─ api/                        Worker: Hono + rutas + servicios
├─ packages/
│  ├─ gamespec/                   Esquema (Zod/JSON Schema), tipos y validador compartidos
│  ├─ engine/                     Mecánicas en Phaser (recorrido, emparejar, clasificar)
│  ├─ assets/                     Biblioteca de ilustraciones SVG etiquetadas
│  ├─ print/                      Plantillas de hoja A4 (HTML/CSS @page) y diseño de marcas
│  └─ prompts/                    Prompts versionados (extracción, generación, ajustes)
├─ docs/                          Documentación y fuentes (sesiones, ejemplos, bases)
└─ wrangler.toml, package.json
```

## 4. Modelo de datos (D1, resumen)

| Tabla | Campos clave |
|---|---|
| `schools` | id, nombre, plan, creditos_saldo |
| `credit_ledger` | id, school_id, accion, creditos, tokens_in, tokens_out, costo_est, fecha |
| `users` | id, school_id, rol (admin, docente, alumno), nombre, correo (solo docentes) |
| `classes` | id, school_id, docente_id, grado, area, codigo_acceso |
| `students` | id, class_id, nombre_lista, identificador_interno |
| `sessions` | id, class_id, titulo, area, grado, competencia, capacidad, desempenos (JSON), criterios (JSON), instrumento, fuente_r2_key |
| `games` | id, session_id, tipo (activacion, complemento), mecanica, estado (borrador, publicado), version_actual |
| `game_versions` | id, game_id, numero, spec_r2_key, prompt, creado_por, creado_en |
| `attempts` | id, game_id, version_id, student_id, fuente (digital, papel, sala), puntaje, aciertos, duracion_ms, creado_en |
| `answers` | id, attempt_id, item_id, criterio, correcto, tiempo_ms |
| `paper_sheets` | id, game_id, version_id, sheet_code, escaneo_r2_key, estado (pendiente, confirmada) |

Las métricas se calculan con consultas sobre `answers` y `attempts`. En piloto no hace falta una tabla de agregados.

## 5. Formato del juego: GameSpec

El juego **no es HTML generado por el modelo**. El modelo produce un documento JSON (GameSpec) que describe el juego, y el motor de cada mecánica lo renderiza. Esto da seguridad, consistencia visual, validación y la posibilidad de hacer la versión impresa desde la misma fuente.

Ejemplo reducido para la sesión "Unidades de longitud" (3.º de primaria):

```json
{
  "specVersion": "1.0",
  "tipo": "complemento",
  "grado": 3,
  "area": "Matemática",
  "competencia": "Resuelve problemas de forma, movimiento y localización",
  "criterios": [
    { "id": "C1", "texto": "Identifica las unidades de longitud" },
    { "id": "C3", "texto": "Realiza conversiones usando ×10 y ÷10" }
  ],
  "mecanica": "recorrido",
  "duracionMin": 8,
  "personaje": { "id": "guia-regla", "nombre": "Reglita" },
  "escenario": { "id": "patio-escuela", "tema": "patio" },
  "tutorial": { "animacion": "tren-unidades", "textoMax": 0 },
  "niveles": [
    {
      "dificultad": "facil",
      "items": [
        {
          "id": "n1-1",
          "criterio": "C3",
          "pregunta": { "tipo": "imagen", "asset": "tren-metros", "resaltado": "m" },
          "accion": "multiplicar",
          "factor": 10,
          "desde": "m",
          "hasta": "dm",
          "opciones": [
            { "valor": 30, "asset": "num-30" },
            { "valor": 3, "asset": "num-3" }
          ],
          "correcta": 0,
          "retroalimentacion": { "ok": "anim-estrella", "error": "anim-pista-escalera" }
        }
      ]
    }
  ],
  "evaluacion": { "eventos": ["inicio", "respuesta", "fin"], "minimoLogro": 0.6 }
}
```

Reglas de validación (antes de mostrar un juego):

1. El esquema cumple la versión declarada.
2. Cada `criterio` referenciado existe en la sesión.
3. Cada `asset` existe en la biblioteca.
4. Cada `correcta` apunta a una opción válida.
5. Cada nivel tiene un número de ítems dentro del rango de la duración.
6. Los textos pasan la lista de términos no permitidos (RNF-09) y el máximo de palabras por pantalla según el grado.
7. Si algo falla, se reintenta una vez con el error en el prompt. Si vuelve a fallar, se informa al docente.

## 6. Generación con IA

**Pipeline de extracción (sesión → datos estructurados)**

1. El docente sube o pega la sesión.
2. Si es .docx, se extrae texto. Si es PDF escaneado, se usa OCR de Mistral (verificar disponibilidad y costo al momento de implementar).
3. Un prompt de extracción devuelve JSON con los campos de RF-11.
4. El docente confirma y corrige (RF-12). La versión confirmada se guarda.

**Pipeline de generación**

1. Entrada: sesión confirmada + tipo + grado + duración + mecánica.
2. Se incluye en el prompt la lista de assets disponibles, filtrada por área y grado. El modelo solo puede usar esos assets.
3. Se pide GameSpec en JSON (modo de salida estructurada).
4. Validación (sección 5). Se guarda la versión en R2 y D1.

**Pipeline de iteración**

1. Entrada: GameSpec actual + pedido en lenguaje natural + restricciones (no cambiar criterios).
2. El modelo devuelve el GameSpec modificado completo.
3. Se calcula el diff contra la versión anterior para mostrarlo al docente.
4. Se valida y se guarda como nueva versión en borrador.

**Por qué no imágenes generadas por IA en el MVP**

- Costo y latencia por juego.
- Riesgo de contenido inadecuado o con errores de contenido visual.
- Consistencia: la biblioteca propia mantiene un estilo único.

La biblioteca tiene unos 150 a 200 ilustraciones SVG propias o con licencia verificada, etiquetadas por área, grado y tema. Es un trabajo de diseño que debe empezar cuanto antes. Si se usan íconos abiertos, verificar la licencia (CC BY o similar) y registrar la atribución.

**Control de costos**

- Cada llamada registra tokens de entrada y salida en `credit_ledger`.
- Se cachea la extracción por hash del texto de la sesión.
- Límite diario por colegio para evitar consumo descontrolado.
- Si el proveedor no responde, la cola reintenta con espera creciente. Nunca se pierde la solicitud del docente.

## 7. Motor de juego (web)

- Una sola aplicación web sirve para docente, alumno y reproductor. El reproductor se carga por ruta `/j/:codigo`.
- Cada mecánica es un módulo independiente que recibe el GameSpec y emite eventos (`inicio`, `respuesta`, `fin`).
- Los eventos se guardan en una cola local (IndexedDB) y se envían al API cuando hay conexión (RNF-04).
- Modo proyección (activación): la misma escena en pantalla grande, sin datos personales visibles, con el código de la sala.
- Tamaño objetivo: menos de 1 MB sin assets y carga diferida por nivel.

## 8. Versión imprimible

**Generación del PDF**

- MVP: plantilla HTML con CSS `@page` A4. El docente imprime o guarda como PDF desde el navegador. Sin costo de servidor.
- Fase 2: renderizado en servidor con Cloudflare Browser Rendering (verificar límites), para generar PDF con un clic y guardarlo en R2.

**Diseño de la hoja**

- Marcas de registro en las cuatro esquinas (cuadrados negros) para corregir la perspectiva.
- Código QR con `gameId`, `versionId` y `sheetCode` (código único por alumno y por hoja).
- Cada respuesta es un círculo grande con número o ilustración. El alumno colorea o marca con una X.
- Ilustraciones iguales a las del juego digital: mismo personaje y mismos íconos.
- Sin texto obligatorio para el alumno. Un pequeño texto para el adulto (nombre, grado, fecha).

**Escaneo desde el celular**

1. El docente entra a `/escanear` y permite la cámara.
2. Se detecta el QR y se identifica la hoja y el alumno.
3. Se detectan las marcas de registro y se corrige la perspectiva.
4. Se lee cada círculo (proporción de píxeles oscuros). Se muestra un resumen con las respuestas detectadas, con las dudosas resaltadas.
5. El docente confirma o corrige con un toque. Se guarda como `attempt` con `fuente = papel`.

Si la lectura automática falla por mala luz o un papel doblado, el docente marca las respuestas en la misma pantalla (RF-54).

## 9. Seguridad y privacidad

- **Acceso docente:** correo institucional con enlace mágico (sin contraseña propia) o contraseña con hash fuerte. La cuenta de demostración del prototipo actual no debe llegar a producción.
- **Acceso alumno:** código de aula + selección de su nombre en la lista. Sin correo ni contraseña. Un docente puede reiniciar el acceso de un alumno.
- **Aislamiento:** cada consulta filtra por `school_id`. Pruebas automáticas de acceso cruzado entre colegios.
- **Datos de menores:** se guarda solo el nombre de lista y un identificador interno. No se guardan fotos de los alumnos (las hojas escaneadas se borran o se recortan a la zona de respuestas tras confirmar).
- **Retención:** configurable por colegio. Por defecto, resultados por el año escolar.
- **Secretos:** claves de Mistral solo en el Worker (`wrangler secret`). Nunca en el cliente.
- **Registros:** no se registran textos de sesiones ni respuestas completas en los logs.

## 10. Despliegue

- Repositorio en GitHub. GitHub Actions ejecuta pruebas y despliega:
  - `main` → producción.
  - Cada pull request → vista previa.
- Entornos: `dev` (local con `wrangler dev`), `staging` (demo), `prod`.
- Migraciones de D1 versionadas en el repositorio.
- Backups: exportación diaria de D1 a R2.

## 11. Pruebas mínimas

- **Validación de GameSpec:** pruebas unitarias con ejemplos válidos e inválidos.
- **Generación:** conjunto fijo de 10 sesiones de referencia; se revisa que cada juego cumpla las reglas de la sección 5.
- **Escaneo:** 20 hojas impresas y fotografiadas en condiciones reales (mala luz, papel doblado). Se mide el porcentaje de lecturas correctas.
- **Juego:** prueba en un celular de gama baja y en tablet, con conexión desconectada y reconectada.
- **Permisos:** prueba de acceso cruzado entre colegios y entre roles.

## 12. Riesgos técnicos

| Riesgo | Mitigación |
|---|---|
| Límites del plan gratuito de Mistral | Caché, límite diario, cola con reintento, posibilidad de cambiar de proveedor. |
| JSON inválido del modelo | Modo de salida estructurada, validación, reintento con el error. |
| Lectura de hojas poco confiable | Diseño de hoja con marcas grandes, confirmación manual siempre disponible. |
| Juego lento en celulares baratos | Assets SVG ligeros, carga por nivel, pruebas en equipo de gama baja. |
| Contenido generado incorrecto | Validación de criterios, revisión docente obligatoria antes de publicar. |
| Costo mayor al previsto | Medición desde el piloto, créditos que cubren el costo variable (04-modelo). |
