# 08 · Contrato v1 entre API y clientes

**Estado:** v1, congelado el 4 de noviembre de 2026. Dueño: U. Consumidores: panel docente (U), reproductor de complemento (C), sala de activación (C), impresión y escaneo (C).

Este documento es la única forma en que se hablan el backend y el frontend. Si algo no está aquí, no se implementa: se propone un cambio de contrato y lo aprueban las dos personas.

- **GameSpec:** congelado en v2. La fuente de verdad es `packages/gamespec/src/schema.ts`; el validador es `packages/gamespec/src/validate.ts`. El cliente **no** valida el juego: confía en el spec publicado y dibuja sus campos.
- **Base de la API en local:** `http://localhost:8787`. La web corre en `http://localhost:5173` y lee `VITE_API_URL`.
- **Formato:** JSON en UTF-8, `Content-Type: application/json`.
- **Fechas:** ISO 8601 en UTC (`2026-11-04T18:30:00.000Z`). Duraciones en milisegundos.

## 1. Autenticación demo

En H1 no hay login real. Hay dos tokens fijos y un token por alumno. La forma de la cabecera no cambia cuando llegue la autenticación real.

```
Authorization: Bearer <token>
```

| Rol | Token en H1 | Quién lo usa |
|---|---|---|
| Docente | `demo-docente` (constante) | Panel docente, crear salas, publicar, avanzar |
| Alumno | `demo-alumno-<uuid>` (lo entrega la API) | Juego de complemento y sala |

Reglas:

1. Las rutas públicas (`/api/salud`, `/api/j/:codigo`, entrar a un juego, unirse a una sala) no piden token.
2. Las rutas de docente exigen `demo-docente`. Cualquier otro token recibe `401 NO_AUTORIZADO`.
3. Las rutas de alumno exigen un token `demo-alumno-*`; la API comprueba que el `alumnoId` del cuerpo o de la ruta coincida con el token.
4. El token se guarda en `localStorage` (`br.token`) y se envía en cada petición.
5. Cuando llegue la autenticación real, el token será un JWT firmado y el resto del contrato no cambia.

```http
POST /api/auth/demo
Content-Type: application/json

{ "rol": "docente" }
```

```json
{
  "token": "demo-docente",
  "usuario": { "id": "u-demo-docente", "rol": "docente", "nombre": "Docente demo" }
}
```

## 2. Errores

Todos los errores usan la misma forma y el código HTTP correspondiente.

```json
{
  "error": {
    "codigo": "NO_ENCONTRADO",
    "mensaje": "El juego no existe o no está publicado.",
    "detalles": { "campo": "codigo" }
  }
}
```

| Código | HTTP | Cuándo |
|---|---|---|
| `NO_AUTORIZADO` | 401 | Falta el token o no es válido |
| `SIN_PERMISO` | 403 | El token no tiene el rol necesario |
| `NO_ENCONTRADO` | 404 | Juego, sala, versión o intento inexistente |
| `VALIDACION` | 400 | Cuerpo inválido, GameSpec inválido o regla de negocio incumplida |
| `CONFLICTO` | 409 | La sala ya empezó, el código ya existe, la versión ya está publicada |
| `LIMITE` | 429 | Demasiadas peticiones o cupo de la sala lleno |
| `INTERNO` | 500 | Error no previsto; el mensaje no expone detalles técnicos |

`detalles` es opcional y solo contiene datos que el cliente puede mostrar o usar para corregir.

## 3. Juegos y sesiones

### 3.1. Listar juegos (docente)

```http
GET /api/juegos
Authorization: Bearer demo-docente
```

```json
{
  "juegos": [
    {
      "id": "juego-n1-tienda",
      "titulo": "La tiendita",
      "tipo": "activacion",
      "mecanica": "tienda",
      "nivel": "N1",
      "grados": [1, 2],
      "estado": "publicado",
      "versionActual": 1,
      "codigo": "TIENDA",
      "creadoEn": "2026-11-04T18:00:00.000Z"
    }
  ]
}
```

`estado` es `borrador` o `publicado`. `codigo` es el identificador corto que se usa en las URL del alumno.

### 3.2. Obtener un juego (docente)

```http
GET /api/juegos/:id
```

Devuelve la fila del juego más `versiones` (sin el spec completo) y `origenGeneracion`:

```json
{
  "id": "juego-n1-tienda",
  "titulo": "La tiendita",
  "estado": "publicado",
  "versionActual": 1,
  "sesionId": "ses-n1-productos",
  "origenGeneracion": {
    "generadoPor": "subagente",
    "promptVersion": "generacion/v2",
    "intentos": 1,
    "erroresPrimerIntento": []
  },
  "versiones": [
    { "id": "v1", "numero": 1, "creadoEn": "2026-11-04T18:00:00.000Z", "publicada": true }
  ]
}
```

### 3.3. Crear un juego desde una sesión (docente)

```http
POST /api/juegos
Authorization: Bearer demo-docente

{
  "sesionId": "ses-n1-productos",
  "tipo": "activacion",
  "mecanica": "tienda",
  "duracionMin": 10
}
```

La API extrae la sesión (si hace falta), renderiza el prompt, genera, valida con `validarGameSpec` y guarda una versión en estado `borrador`.

```json
{
  "juegoId": "juego-n1-tienda",
  "versionId": "v1",
  "estado": "borrador",
  "spec": { "specVersion": "1.0", "mecanica": "tienda", "...": "GameSpec completo" },
  "origenGeneracion": { "generadoPor": "subagente", "promptVersion": "generacion/v2", "intentos": 1 }
}
```

Si el GameSpec no valida después del reintento, responde `400 VALIDACION` con `detalles.errores` (lista de cadenas del validador) y no guarda nada.

### 3.4. Publicar (docente)

```http
POST /api/juegos/:id/publicar
Authorization: Bearer demo-docente

{ "versionId": "v1" }
```

```json
{ "juegoId": "juego-n1-tienda", "versionId": "v1", "estado": "publicado", "publicadoEn": "2026-11-04T18:10:00.000Z" }
```

Solo se publica una versión que pase la validación. Publicar una versión nueva no borra los intentos de las anteriores: los intentos guardan `versionId`.

### 3.5. Obtener el juego publicado por código (público)

Es la llamada que hace el reproductor de complemento al abrir `/j/:codigo`.

```http
GET /api/j/:codigo
```

```json
{
  "juegoId": "juego-n2-carrera",
  "codigo": "CARRERA",
  "versionId": "v1",
  "version": 1,
  "publicadoEn": "2026-11-04T18:10:00.000Z",
  "spec": { "specVersion": "1.0", "mecanica": "carrera", "...": "GameSpec completo" }
}
```

Errores: `404 NO_ENCONTRADO` si no existe o no está publicado.

### 3.6. Sesiones (docente)

```http
GET /api/sesiones
POST /api/sesiones           { "titulo", "area", "grado", "competencia", "criterios": [...], "texto" }
GET /api/sesiones/:id
```

La forma de la sesión extraída es la del prompt `packages/prompts/extraccion/v1.md`. La API no inventa criterios: si la sesión no los trae, responde `400 VALIDACION` con `detalles.errores: ["criterios: la sesión no declara criterios"]`.

## 4. Alumno y juego de complemento

### 4.1. Entrar al juego (público)

```http
POST /api/j/:codigo/entrar

{ "nombre": "Lucía" }
```

```json
{
  "alumnoId": "alu_7f3c",
  "token": "demo-alumno-7f3c",
  "juegoId": "juego-n2-carrera",
  "versionId": "v1",
  "spec": { "specVersion": "1.0", "mecanica": "carrera", "...": "GameSpec completo" }
}
```

`nombre` es el nombre de lista o un alias elegido por el alumno; no se pide apellido ni documento. Si el mismo dispositivo vuelve a entrar, el cliente reutiliza el token guardado y no crea otro alumno (`409 CONFLICTO` solo si el nombre está vacío).

### 4.2. Enviar un intento

```http
POST /api/intentos
Authorization: Bearer demo-alumno-7f3c
Idempotency-Key: 6f1c2a9e-...

{
  "juegoId": "juego-n2-carrera",
  "versionId": "v1",
  "fuente": "digital",
  "iniciadoEn": "2026-11-04T18:30:00.000Z",
  "duracionMs": 420000,
  "items": [
    { "itemId": "f1", "criterio": "C3", "correcto": true,  "tiempoMs": 8200,  "intentos": 1 },
    { "itemId": "f2", "criterio": "C3", "correcto": false, "tiempoMs": 12500, "intentos": 2 }
  ]
}
```

- `fuente`: `digital`, `papel` o `sala`.
- `items` es la lista completa de ítems jugados, en orden. Un ítem puede repetirse si el niño reintentó; el servidor guarda la última marca y cuenta el intento.
- `Idempotency-Key` es un UUID que genera el cliente por intento. Si se repite, la API devuelve `200` con `duplicado: true` y el mismo `intentoId`, sin duplicar datos. Sin la cabecera, cada envío crea un intento nuevo.

```json
{
  "intentoId": "int_91bd",
  "juegoId": "juego-n2-carrera",
  "aciertos": 7,
  "total": 9,
  "minimoLogro": 0.6,
  "logrado": true,
  "duplicado": false
}
```

### 4.3. Enviar varios intentos (cola sin conexión)

Cuando el dispositivo recupera la conexión, envía la cola de IndexedDB en un solo lote. Cada elemento lleva su propia `claveIdempotencia`.

```http
POST /api/intentos/lote
Authorization: Bearer demo-alumno-7f3c

{
  "intentos": [
    { "claveIdempotencia": "6f1c...", "juegoId": "...", "versionId": "v1", "fuente": "digital", "iniciadoEn": "...", "duracionMs": 420000, "items": [] },
    { "claveIdempotencia": "9a2d...", "juegoId": "...", "versionId": "v1", "fuente": "digital", "iniciadoEn": "...", "duracionMs": 380000, "items": [] }
  ]
}
```

```json
{
  "resultados": [
    { "claveIdempotencia": "6f1c...", "estado": "guardado", "intentoId": "int_91bd" },
    { "claveIdempotencia": "9a2d...", "estado": "duplicado", "intentoId": "int_91bd" }
  ]
}
```

`estado` es `guardado`, `duplicado` o `rechazado` (con `motivo`). El cliente borra de la cola solo los `guardado` y los `duplicado`; los `rechazado` los marca para revisión y no los reintenta solo.

## 5. Sala de activación

La sala existe para la proyección en el aula: el docente abre la sala, los alumnos entran con un código corto, y la pantalla grande muestra el progreso colectivo. **No se muestran nombres ni puntajes individuales en la proyección.**

### 5.1. Crear sala (docente)

```http
POST /api/salas
Authorization: Bearer demo-docente

{ "juegoId": "juego-n1-tienda", "maxAlumnos": 40 }
```

```json
{
  "salaId": "sala_3f9a",
  "codigo": "A1B2C3",
  "estado": "esperando",
  "juegoId": "juego-n1-tienda",
  "versionId": "v1",
  "meta": { "tipo": "camion", "objetivo": 10 },
  "creadaEn": "2026-11-04T18:20:00.000Z"
}
```

`codigo` tiene 6 caracteres en mayúsculas, sin `0/O` ni `1/I`. Es único mientras la sala está abierta.

### 5.2. Unirse (público)

```http
POST /api/salas/:codigo/unirse

{ "nombre": "Equipo 3" }
```

```json
{
  "alumnoId": "alu_7f3c",
  "token": "demo-alumno-7f3c",
  "salaId": "sala_3f9a",
  "estado": "esperando",
  "participantes": 12,
  "meta": { "tipo": "camion", "objetivo": 10 }
}
```

El cupo se controla con `maxAlumnos` (`429 LIMITE` si está lleno). Si la sala ya terminó, `409 CONFLICTO`.

### 5.3. Consultar estado (polling)

```http
GET /api/salas/:codigo/estado?desde=12
Authorization: Bearer demo-alumno-7f3c
```

```json
{
  "salaId": "sala_3f9a",
  "estado": "jugando",
  "ronda": { "indice": 2, "total": 9, "itemId": "m1" },
  "progreso": { "actual": 7, "objetivo": 10 },
  "participantes": 18,
  "seq": 15,
  "eventos": [
    { "seq": 14, "tipo": "acierto", "itemId": "m1" },
    { "seq": 15, "tipo": "meta", "actual": 10, "objetivo": 10 }
  ]
}
```

- `estado`: `esperando`, `jugando`, `pausada`, `terminada`.
- `seq` es un entero que solo crece. `desde` es el último `seq` que el cliente ya vio; la API devuelve solo los eventos posteriores y como máximo 20.
- `eventos[].tipo`: `union` (entró un alumno), `acierto`, `meta` (se llenó la meta colectiva), `ronda` (cambió la ronda) o `fin`.
- Los eventos **no incluyen nombres** de alumnos. `acierto` lleva `itemId` y `seq`, nada más.
- El cliente consulta cada 1,5 s mientras la sala está activa y se detiene al recibir `estado: "terminada"`.

### 5.4. Responder (alumno)

```http
POST /api/salas/:codigo/respuesta
Authorization: Bearer demo-alumno-7f3c

{ "itemId": "m1", "criterio": "C1", "correcto": true, "tiempoMs": 4300 }
```

```json
{ "aceptada": true, "seq": 16, "progreso": { "actual": 8, "objetivo": 10 } }
```

La API guarda la respuesta como parte del intento de ese alumno en esa sala (`fuente: "sala"`). El cliente no envía el intento completo al final: la sala ya lo construyó.

### 5.5. Avanzar y cerrar (docente)

```http
POST /api/salas/:codigo/avanzar
Authorization: Bearer demo-docente

{ "ronda": 3 }
```

```json
{ "salaId": "sala_3f9a", "estado": "jugando", "ronda": { "indice": 3, "total": 9, "itemId": "a1" }, "seq": 17 }
```

```http
POST /api/salas/:codigo/cerrar
Authorization: Bearer demo-docente
```

```json
{ "salaId": "sala_3f9a", "estado": "terminada", "seq": 18, "participantes": 18 }
```

Al cerrar, la API calcula los intentos de la sala y los deja disponibles en el panel.

## 6. Panel docente

```http
GET /api/panel/:juegoId
Authorization: Bearer demo-docente
```

```json
{
  "juego": {
    "id": "juego-n1-tienda",
    "titulo": "La tiendita",
    "tipo": "activacion",
    "mecanica": "tienda",
    "nivel": "N1",
    "origenGeneracion": { "generadoPor": "subagente", "promptVersion": "generacion/v2" }
  },
  "participacion": { "intentos": 24, "alumnos": 22, "completados": 19 },
  "porCriterio": [
    { "criterio": "C1", "texto": "Organiza productos en grupos", "aciertos": 40, "total": 48, "porcentaje": 0.83 },
    { "criterio": "C2", "texto": "Cuenta hasta 10 con objetos", "aciertos": 21, "total": 30, "porcentaje": 0.7 }
  ],
  "riesgo": [
    { "alumnoId": "alu_7f3c", "nombre": "Lucía", "aciertos": 2, "total": 9, "criteriosBajos": ["C2"] }
  ],
  "generadoEn": "2026-11-04T19:00:00.000Z"
}
```

- `porCriterio` incluye todos los criterios del spec, tengan o no respuestas.
- `riesgo` lista alumnos con menos de `evaluacion.minimoLogro` de aciertos y al menos un criterio bajo. Se ordena de menor a mayor porcentaje y se corta en 20.
- `participacion.completados` cuenta intentos con todos los ítems del spec presentes.

### 6.1. Exportar CSV

```http
GET /api/panel/:juegoId.csv
Authorization: Bearer demo-docente
```

```csv
alumno_id,nombre,intento_id,version_id,fuente,item_id,criterio,correcto,tiempo_ms,fecha
alu_7f3c,Lucía,int_91bd,v1,digital,f1,C3,1,8200,2026-11-04T18:30:00.000Z
```

Cabecera `text/csv; charset=utf-8` y `Content-Disposition: attachment; filename="brain-rush-<juego>.csv"`.

## 7. Eventos del motor

El motor de Phaser (`packages/engine/`) no hace peticiones de red: **emite eventos** y el contenedor decide qué hacer con ellos. Así el mismo motor sirve para la sala, el complemento y las pruebas.

```ts
export type EventoMotor =
  | {
      tipo: "inicio";
      juegoId: string;
      versionId: string;
      mecanica: "tienda" | "carrera";
      alumnoId?: string;
      salaId?: string;
      iniciadoEn: string; // ISO
    }
  | {
      tipo: "respuesta";
      itemId: string;
      criterio: string;
      correcto: boolean;
      tiempoMs: number;
      intentos: number; // 1 en el primer intento del ítem
    }
  | {
      tipo: "fin";
      aciertos: number;
      total: number;
      duracionMs: number;
      completado: boolean;
    };
```

| Evento | Qué hace el reproductor de complemento (C4) | Qué hace la sala (C5) |
|---|---|---|
| `inicio` | Guarda `iniciadoEn` y arranca el cronómetro | Se registra en la sala |
| `respuesta` | Acumula en memoria y en IndexedDB | `POST /api/salas/:codigo/respuesta` |
| `fin` | `POST /api/intentos` con la cola; si falla, queda en IndexedDB | No envía nada: la sala ya tiene las respuestas |

Reglas del motor:

1. `respuesta` se emite **una vez por ítem jugado**, no por toque. Si el niño reintenta, se incrementa `intentos` y se emite al resolver.
2. `correcto` es la evaluación del motor contra el GameSpec (`categoria` para tienda, `opciones[correcta]` para carrera). El cliente no recalcula en el servidor.
3. `fin` se emite también si el niño abandona y vuelve: `completado: false`.
4. Los eventos no llevan texto libre ni nombres.

## 8. Modo sin conexión

1. Al entrar, el reproductor guarda `spec`, `juegoId`, `versionId`, `alumnoId` y `token` en `localStorage`/IndexedDB.
2. Cada `respuesta` se guarda en IndexedDB (base `brain-rush`, almacén `respuestas`) con la clave `versionId:itemId`.
3. Al recibir `fin`, se arma el intento y se guarda en el almacén `intentos` con su `claveIdempotencia`.
4. Si `navigator.onLine` es falso o la petición falla, el intento queda en la cola. Se reintenta al recuperar `online`, al volver a abrir el juego y cada 30 s mientras haya cola.
5. El lote se envía con `POST /api/intentos/lote`. Solo se borra lo `guardado` o `duplicado`.
6. La UI muestra un estado discreto: «Guardado» o «Se enviará al reconectar». Nunca bloquea el juego.

## 9. Códigos y URL del alumno

| Ruta web | Qué muestra | Datos |
|---|---|---|
| `/j/:codigo` | Juego de complemento individual | `GET /api/j/:codigo` y `POST /api/j/:codigo/entrar` |
| `/s/:codigo` | Sala: vista del alumno | `POST /api/salas/:codigo/unirse` y polling de estado |
| `/proyectar/:codigo` | Sala: vista de proyección | Polling de estado con token de docente |
| `/docente` | Panel | Rutas de docente |

El código de juego es estable y legible (`TIENDA`, `CARRERA`). El código de sala es temporal y se genera al crearla.

## 10. Límites y comportamiento

- Tamaño máximo de cuerpo: 256 KB por petición (un GameSpec completo entra de sobra).
- Un intento tiene entre 1 y 60 ítems.
- `items[].tiempoMs` es un entero entre 0 y 3 600 000.
- El polling de sala devuelve como máximo 20 eventos.
- Todas las rutas aceptan `OPTIONS` para CORS. Orígenes permitidos en local: `http://localhost:5173` y `http://127.0.0.1:5173`.
- No se registran nombres de docentes ni de estudiantes en logs.

## 11. Qué queda fuera de v1

Se implementa después de H1, sin cambiar las rutas existentes:

- Login real y roles por colegio.
- WebSocket para la sala (v1 usa polling). Si se cambia, se agrega; no se quita el polling.
- Impresión y escaneo: `POST /api/hojas`, `GET /api/hojas/:codigo` y `POST /api/hojas/:codigo/escaneo`.
- Créditos y consumo de tokens.

## 12. Resumen de rutas

| Método | Ruta | Auth | Implementa | Consume |
|---|---|---|---|---|
| GET | `/api/salud` | — | U | C |
| POST | `/api/auth/demo` | — | U | U, C |
| GET | `/api/juegos` | docente | U | U |
| GET | `/api/juegos/:id` | docente | U | U |
| POST | `/api/juegos` | docente | U | U |
| POST | `/api/juegos/:id/publicar` | docente | U | U |
| GET | `/api/j/:codigo` | — | U | C |
| POST | `/api/j/:codigo/entrar` | — | U | C |
| POST | `/api/intentos` | alumno | U | C |
| POST | `/api/intentos/lote` | alumno | U | C |
| GET | `/api/sesiones` | docente | U | U |
| POST | `/api/sesiones` | docente | U | U |
| GET | `/api/sesiones/:id` | docente | U | U |
| POST | `/api/salas` | docente | U | U, C |
| POST | `/api/salas/:codigo/unirse` | — | U | C |
| GET | `/api/salas/:codigo/estado` | alumno/docente | U | C |
| POST | `/api/salas/:codigo/respuesta` | alumno | U | C |
| POST | `/api/salas/:codigo/avanzar` | docente | U | U, C |
| POST | `/api/salas/:codigo/cerrar` | docente | U | U, C |
| GET | `/api/panel/:juegoId` | docente | U | U |
| GET | `/api/panel/:juegoId.csv` | docente | U | U |

## 13. Lo que Choflis puede empezar ya

Con este contrato y el GameSpec congelado, C4 y C5 no esperan a la API:

1. **C1, C2, C3:** el motor consume `fixtures/juegos/n1-tienda.json` y `fixtures/juegos/n2-carrera-unidades-longitud.json` directamente.
2. **C4:** implementa la máquina de estados del reproductor (entrar → jugar → fin → cola) contra un adaptador `ApiCliente` con estas firmas:

```ts
interface ApiCliente {
  obtenerJuego(codigo: string): Promise<JuegoPublicado>;
  entrar(codigo: string, nombre: string): Promise<SesionAlumno>;
  enviarIntento(intento: IntentoEntrada): Promise<IntentoResultado>;
  enviarLote(intentos: IntentoEntrada[]): Promise<LoteResultado>;
  unirseASala(codigo: string, nombre: string): Promise<SesionSala>;
  estadoSala(codigo: string, desde: number): Promise<EstadoSala>;
  responderSala(codigo: string, respuesta: RespuestaSala): Promise<RespuestaAceptada>;
}
```

3. **C5:** usa el mismo `ApiCliente`; la diferencia es que las respuestas se envían una por una y el estado se consulta cada 1,5 s.

Mientras la API no exista, el adaptador devuelve fixtures y guarda en memoria. Cuando U4 esté listo, se cambia la implementación sin tocar la UI.
