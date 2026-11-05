# Probar La tiendita — entrega C1+C2

La demo usa la estructura existente de BRAIN RUSH y los datos de fixtures/juegos/n1-tienda.json. No necesita API, Mistral ni credenciales para jugar localmente.

## Abrir la demo

Desde la raíz del repositorio:

1. Ejecutar npm ci.
2. Ejecutar npm run dev:tiendita -w apps/web.
3. Abrir http://127.0.0.1:5174/tiendita.html.
4. Pulsar «¡A jugar!» y completar la demostración.

La entrada es propia de la parte C y no reemplaza App.tsx, la landing ni el panel de U. El comando npm run dev:web sigue sirviendo la aplicación existente; con ese servidor también se puede abrir /tiendita.html.

Para revisar los eventos, añadir ?debug=1 a la URL. El registro se puede descargar como JSON. La UI infantil normal no incluye ese inspector.

## Qué se puede jugar

- Seis actividades de clasificación: llevar cada producto a su estante.
- Seis pedidos: preparar una bolsa con la cantidad solicitada.
- Tres dificultades, con dos categorías al inicio y hasta diez productos en avanzadas.
- Arrastre con mouse/dedo o selección de producto seguida del destino.
- Controles por teclado, tutorial distinto para cada acción, ayuda y pausa.
- Movimiento de la mascota, respuesta visual de objetos y traslado de cajas con Phaser.
- Sonido opcional y adaptación a movimiento reducido.
- Meta del camión leída del spec actual: 12 actividades.

La meta compartida se representa localmente y está identificada como «Prueba local». Esta entrega no afirma tener una sala real ni otros alumnos conectados.

## Mascota y recursos

El usuario eligió la mascota verde de su imagen adjunta, sustituyendo visualmente a la regla del primer diseño. El ID técnico personaje-reglita se conserva.

La imagen de referencia está en docs/design/tiendita/mascota-referencia.png. La adaptación transparente y el fondo fueron producidos con ImageGen y guardados en apps/web/public/juego/tiendita. Cada PNG tiene su prompt en el archivo .prompt.txt correspondiente. No se presenta ese material como arte original dibujado manualmente.

Los productos son gráficos geométricos, con forma, etiqueta e icono para distinguir agua, gaseosa y jugo.

## Comprobaciones

- npm test -w packages/engine: pruebas puras del controlador.
- npm run test:browser -w packages/engine: pruebas de interacción con Chromium; inicia Vite si no está abierto.
- npm run typecheck -w packages/engine
- npm run typecheck -w apps/web
- npm run build:tiendita -w apps/web: salida independiente en apps/web/dist-tiendita.

Las capturas y el informe de verificación se guardan en docs/qa/tiendita.

Si en el entorno del agente las conexiones localhost están aisladas, el servidor y las pruebas deben ejecutarse en el mismo contexto de red permitido. Eso no cambia el código ni desactiva protecciones del proyecto.

## Límites explícitos

- C4, C5, carrera, jardín, impresión y escaneo siguen en las entregas posteriores acordadas.
- Al recargar se empieza otra partida; no hay recuperación persistente ni envío real a la API.
- Una respuesta resuelta después de pistas sigue emitiendo correcto=true; intentos conserva las correcciones. No equivale a acertar al primer intento.
- Las pruebas emuladas de móvil no sustituyen una prueba con un teléfono físico ni observación con estudiantes.
- No se modificaron ni implementaron la API, el contrato compartido, el GameSpec o el panel docente.
