# La tiendita de Reglita: diseño, funcionalidades y plan de pruebas

Fecha: 5 de noviembre de 2026.
Responsable de esta parte: Choflis (C).
Estado: propuesta de diseño revisada por un segundo agente, pendiente de revisión del usuario antes de implementar.
Enfoque elegido por el usuario: A, completar La tiendita antes de comenzar la carrera.
Este documento describe el producto y su aceptación; no contiene implementación del juego.

## 1. Qué vamos a entregar

Un minijuego web 2D de clasificación y conteo para 1.º y 2.º de primaria, que pueda jugarse de principio a fin con mouse o con el dedo. El niño organiza productos y prepara pedidos mientras ayuda a llenar un camión.

Primero se construye y prueba una versión local completa de C1 + C2, alimentada por el GameSpec existente. Es una demostración individual del motor de una actividad de aula. El multijugador y la proyección conectados se integran después, mediante C5 y la API de salas de U.

La meta del camión en la demostración se etiqueta «Prueba local». Su progreso representa actividades resueltas por quien prueba el motor. No se presenta como progreso real de varios alumnos.

### Incluido ahora

- Carga del GameSpec de tienda ya disponible.
- Presentación breve y tutorial visual.
- Clasificar productos y preparar pedidos.
- Tres dificultades y las 12 actividades actuales.
- Reglita, pistas, retroalimentación y celebración.
- Interacción por arrastre y alternativa de tocar producto y destino.
- Pausa, sonido opcional, salida y nueva partida.
- Eventos compatibles con el contrato para que otro componente registre resultados.
- Pantalla de prueba local con registro de eventos visible para el desarrollador.
- Pruebas de reglas, escenas y uso en un teléfono real.

### Entregas posteriores

La carrera, el jardín, el reproductor de complemento C4 con IndexedDB, la sala conectada C5, la impresión C6 y el escaneo C7. Tampoco se implementan aquí backend, panel docente, generación con Mistral ni pagos.

La IA participa en la generación de los datos del juego. Reglita guía con animaciones y pistas predefinidas; esta entrega no necesita conversación en vivo con IA.

## 2. Fuentes y decisiones que mandan

- Diseño general: [06 · Diseño de juegos](../../especificacion/06-diseno-de-juegos.md).
- Reparto y alcance: [07 · Trabajo del equipo](../../especificacion/07-plan-de-trabajo-equipo.md).
- Eventos e integración: [08 · Contrato](../../especificacion/08-contrato.md), especialmente secciones 7 y 13.
- Contenido real: [GameSpec de tienda](../../../fixtures/juegos/n1-tienda.json).
- Tipos de datos: [schema.ts](../../../packages/gamespec/src/schema.ts).
- Arte: [dirección de arte](../../arte-conceptual.md).

Se conserva el GameSpec y el contrato existentes. Si al implementar aparece una incompatibilidad, se documenta y se propone a U; no se cambia silenciosamente.

### Alternativas consideradas

- A, elegida: terminar y probar La tiendita antes de construir la carrera. Da una entrega jugable y valida la base reutilizable temprano.
- B: desarrollar ambos juegos por capas. Facilita comparar avances, pero pospone tener un juego completo para observar su uso.

Decisiones propuestas en este documento: pantalla local de prueba propia, arrastre más selección por toque, progreso por actividad, reglas exactas de intentos, medición del tiempo y representación de Reglita. Se distinguen de los requisitos ya confirmados del repositorio.

## 3. Experiencia del niño

Historia: «La tienda está desordenada. Ayuda a organizarla y preparar el reparto».

Secuencia de una partida:

1. Ve la tienda, a Reglita y un botón grande con símbolo de jugar.
2. Observa una demostración de clasificación que puede repetir.
3. Realiza las cuatro actividades fáciles.
4. Una transición breve celebra el avance sin pedir leer instrucciones.
5. Realiza las cuatro actividades medias y después las cuatro avanzadas.
6. Ve salir el camión y una celebración de lo que completó.
7. Puede empezar una nueva partida o salir.

Antes del primer pedido se muestra una segunda demostración específica de contar objetos hacia la bolsa. Haber visto el tutorial de clasificar no basta para explicar el pedido.

Las dificultades se recorren en el orden del GameSpec: facil, medio, avanzado. No hay tiempo límite ni pérdida de vidas. Los 10 minutos del spec son una referencia de duración, no una cuenta regresiva.

## 4. Pantalla y dirección visual

Referencia conceptual: [pantalla de pedido](../../../docs/design/tiendita/pedido-concepto-v1.png).

- Juego de tienda con profundidad ligera y sprites suaves; no requiere un motor 3D.
- Fondo crema, marca morada y acentos lima, coherentes con la dirección de arte.
- Reglita es una regla original morada con marcas de medición, ojos y brazos. Su papel es mostrar la siguiente acción, sin cubrir los objetos.
- Las categorías conservan la identificación del catálogo: gaseosa roja, agua azul y jugo naranja. También se distinguen por envase, icono y forma.
- La escena ocupa la mayor parte del espacio. No se rodea el juego con paneles de administración ni un chat.
- Arriba: nombre breve del juego, progreso gráfico del camión, sonido y pausa.
- Centro: dos o tres estanterías y, durante pedidos, pictograma del producto y cantidad.
- Abajo: bandeja de productos activos y bolsa de pedido cuando corresponda.
- Objetos decorativos de fondo no se confunden con productos que se pueden mover.

La imagen muestra una propuesta de un pedido de tres aguas, basada en f3; no es una captura de software ni contiene sprites ya exportados para el motor.

### Adaptación y accesibilidad

- En computadora o tablet horizontal se aprovecha la escena ancha.
- En teléfono vertical las estanterías van arriba, la bandeja al centro y la bolsa abajo; se redistribuye el contenido, sin encoger todo el escritorio.
- Cada zona interactiva tiene un mínimo propuesto de 56 × 56 píxeles CSS, superior al mínimo de 44 del diseño general.
- Hasta 10 productos se distribuyen en una cuadrícula; todos deben poder alcanzarse sin que el dedo tape el destino.
- No se exige girar el teléfono.
- No se depende solo del color o del audio. La clasificación se explica con iconos y envases.
- El texto de la consigna no supera ocho palabras; la acción se entiende visualmente.
- Sonido apagado inicialmente. Se habilita desde un control explícito después de interactuar.
- Tutorial animado de hasta tres segundos, repetible con el icono de ayuda. Con movimiento reducido, se muestran pasos estáticos con las mismas pistas.
- Alternativa de teclado: seleccionar producto con foco y Enter/Espacio, avanzar al destino y confirmar; Escape cancela. Se prevén controles DOM equivalentes, con etiquetas y foco visible, sin depender solo del canvas.

## 5. Contenido exacto de la primera partida

La fuente es el fixture, no una copia de actividades escrita dentro del motor.

Criterios del fixture:

- C1: organizar productos al clasificarlos por categoría.
- C2: representar las clases de productos mediante cantidades hasta 10.

Hay seis actividades de clasificación y seis de pedido:

- Fácil: f1 clasifica cuatro productos en dos categorías; f2 repite con otras dos categorías; f3 pide tres aguas; f4 pide dos gaseosas.
- Medio: m1 clasifica seis productos en tres categorías; m2 clasifica siete; m3 pide cuatro aguas; m4 pide cuatro gaseosas.
- Avanzado: a1 y a2 clasifican diez productos; a3 pide seis gaseosas; a4 pide siete jugos.

La meta actual es 12. No se fija el valor 10 por lo que dicen documentos anteriores. Se lee meta.objetivo; si el contenido cambia, la escena usa el nuevo valor.

## 6. Funcionalidades y reglas de interacción

### F01 · Inicio y tutoriales

La portada presenta el objetivo con tienda, camión y Reglita. El tutorial usa objetos de demostración separados de la actividad. No aumenta progreso ni genera respuestas académicas.

El tutorial de cada acción puede repetirse. Si se pide ayuda durante una actividad, vuelve al mismo estado al terminar, sin mover productos ni reiniciar los intentos.

### F02 · Clasificar

- Cada producto tiene identidad propia aunque comparta imagen con otro.
- Se arrastra a una estantería o se selecciona y se toca el destino.
- Un destino correcto coloca y bloquea el producto, con una confirmación visual breve.
- Un destino de otra categoría lo devuelve a su origen, conserva los demás productos y ofrece una pista.
- Soltar fuera de cualquier destino, cancelar con Escape o perder el contacto devuelve el objeto sin marcar un error educativo.
- La actividad termina cuando todos sus productos están correctamente colocados.
- Una acción ya aceptada no puede volver a contar.

### F03 · Preparar pedidos

- La consigna se representa con el pictograma del producto, cantidad y espacios visuales para contar.
- Se llevan a la bolsa objetos de la categoría solicitada; los demás funcionan como distractores.
- Cada objeto válido llena un espacio. Se cuenta cada identidad una sola vez.
- Una categoría incorrecta vuelve a su origen y produce una pista.
- La actividad termina automáticamente al completar la cantidad exacta.
- La entrada queda bloqueada antes de iniciar la celebración: un toque o arrastre tardío no añade un producto extra.
- Los productos que no se necesitan pueden quedarse en la bandeja.
- En esta primera versión no se añade caja registradora, precios, cálculo de vuelto ni dinero.

### F04 · Ayuda y retroalimentación

El error permite seguir: Reglita señala la diferencia de envase o la silueta del destino. La pista no coloca el objeto automáticamente.

Tras dos errores educativos en el mismo ítem, se destaca brevemente el destino o el pictograma solicitado. La ayuda también se puede solicitar voluntariamente.

Un producto correcto se confirma en aproximadamente 200–350 ms. Un ítem completado tiene una celebración de hasta un segundo. Los productos no caen continuamente ni exigen reflejos: se presentan en una bandeja estable.

### F05 · Dificultad y progreso

No se adapta la dificultad automáticamente: se ejecuta el orden del spec. Las transiciones pueden mostrar los iconos de categorías y una estrella.

En prueba local se suma una unidad por ítem completado, no por botella ni por intento. El progreso se limita a meta.objetivo. Con el fixture actual hay 12 ítems y objetivo 12.

La partida termina al recorrer todos los ítems, aunque una futura meta tenga otro valor. Llenar el camión no descarta actividades aún pendientes. La celebración final distingue completar la partida de alcanzar la meta.

En la integración posterior, el progreso compartido lo suministra la sala del servidor; no se suman simultáneamente puntos locales y remotos.

### F06 · Pausa, salida y nueva partida

- Pausa congela interacción, animaciones y medición de tiempo activo. Si hay un arrastre en curso, lo cancela y devuelve ese producto al origen sin error; conserva productos ya colocados, conteos y una selección por toque que aún no se confirmó.
- Volver a la pestaña después de ocultarla muestra pausa y exige reanudar.
- Sonido y repetición de tutorial no reinician la partida.
- Salir por el control del juego pide confirmar si hay una partida activa.
- Reiniciar cierra la partida actual como incompleta y abre una nueva con progreso cero.
- Recargar la página inicia una partida nueva en esta entrega local; la recuperación persistente de C4 está fuera de alcance.
- Un cierre de pestaña puede perder el último aviso: no se promete entrega fiable de un evento durante el cierre del navegador.

### F07 · Registro compatible con la API

El motor emite inicio, respuesta y fin según el contrato. No hace fetch, no contiene tokens ni conoce Mistral.

La pantalla local recibe los eventos y permite inspeccionarlos o descargarlos como JSON para comprobar integración. El visor es una herramienta de desarrollo, no parte de la pantalla infantil.

- inicio: una vez al comenzar la primera actividad real, después del tutorial.
- respuesta: exactamente una por ítem resuelto.
- fin: una vez al completar la partida o confirmar una salida/reinicio; si se abandona antes de resolver un ítem, ese ítem no genera respuesta.
- alumnoId y salaId pueden omitirse en la prueba local.
- juegoId, versionId y un identificador interno de ejecución se fijan al abrir la partida. El identificador interno evita mezclar estados, pero no se añade al payload congelado.

Reglas propuestas para intentos y tiempo:

- intentos empieza en 1 por ítem y aumenta con cada producto soltado en una categoría educativa incorrecta.
- No aumenta por tocar, repetir ayuda, soltar fuera de destino, cancelar o pausar.
- tiempoMs mide el tiempo activo del ítem, desde que puede jugarse hasta resolverlo. Excluye tutoriales, ayuda en reproducción y pausa; incluye pensar y corregir.
- duracionMs mide el tiempo activo de los ítems, usando un reloj monotónico para duraciones e ISO para iniciadoEn.
- No hay doble emisión al terminar animaciones, hacer doble toque, cambiar tamaño o desmontar vistas.

Límite analítico del contrato: correcto indica resolución final. Como el niño puede corregir hasta resolver, una partida completada puede emitir correcto=true en todos los ítems aunque haya errores previos. No se anuncia «dominio al primer intento» ni un diagnóstico de aprendizaje con ese dato. Se conservan intentos para que el equipo pueda acordar una interpretación posterior; no se inventa un campo de primeros aciertos ni se modifica el contrato.

### F08 · Recursos faltantes

El catálogo actual contiene identificadores y descripciones, pero no ilustraciones exportadas. La imagen conceptual no sustituye esa biblioteca.

Para la prueba del motor, se propone un registro visual local en engine con dibujos originales simples y reconocibles para los IDs actuales. Los recursos definitivos y los cambios del catálogo se coordinan con U.

Si falta un recurso al cargar, el host de prueba explica al desarrollador qué ID falta y no inicia una escena vacía ni sustituye silenciosamente una categoría por otra.

## 7. Estados y límites del motor

Estados previstos: cargando, portada, tutorial, jugando, mostrando ayuda, confirmando ítem, transición de dificultad, pausa y resultado.

- Solo jugando permite mover productos.
- Cada producto está disponible, en movimiento o colocado; no puede pertenecer a dos destinos.
- Una nueva actividad usa una clave compuesta por nivel e itemId; los p1 repetidos entre actividades no comparten estado.
- Tutorial, sonido y resize no destruyen el estado académico.
- Una escena desmontada libera listeners, canvas, temporizadores y audio.
- El desmontaje técnico de una vista no genera una nueva partida ni una respuesta falsa. La salida académica explícita se solicita al controlador antes de destruirlo.
- El motor acepta un GameSpec publicado de mecánica tienda; no duplica el validador de negocio. El host local verifica el fixture con el validador existente antes de montarlo.

## 8. Tu parte y los puntos de coordinación

Choflis es responsable de:

- Base de Phaser y ciclo de vida: C1.
- Reglas, entrada, tutoriales, feedback y escena de tienda: C2.
- Host de desarrollo propio para jugar el fixture sin API.
- Pruebas de reglas, escena, recursos y dispositivos.
- Preparar los eventos para que C5 pueda conectar la sala posteriormente.

Rutas previstas dentro de tu propiedad:

- packages/engine/src/: controlador de tienda, reglas, escena Phaser, tutorial y feedback.
- packages/engine/dev/: pantalla local de prueba y recursos provisionales del motor.
- packages/engine/tests/: pruebas del motor y de su host de desarrollo.

Es un mapa de responsabilidades, no una estructura implementada. La implementación posterior definirá firmas y archivos exactos.

No se necesitan cambios en apps/web/src/app, el contrato, el esquema, fixtures ni el catálogo para demostrar C1+C2. El preview se ejecutará desde engine. Cualquier montaje posterior en las rutas React existentes se coordina con U mediante PR. La actualización inevitable del package-lock por una dependencia nueva se entrega por PR a su dueño; no se crea un segundo lockfile ni se fuerza su integración.

El primer entregable no espera claves de Mistral, credenciales de Cloudflare ni backend disponible.

## 9. Entregas de construcción y aceptación

Este es el orden funcional para el plan de implementación posterior; ninguna tarea se marca como hecha por tener solo una pantalla dibujada.

### E1 · Una ronda de clasificación jugable

Base del motor, host de prueba, tutorial y actividad f1.
Aceptación: se puede resolver con mouse y con dedo; se producen un inicio y una respuesta; una colocación errónea se corrige sin duplicar productos.

### E2 · Un pedido jugable

Actividad f3 con pictogramas y tres aguas.
Aceptación: acepta exactamente las tres aguas, rechaza jugos, conserva el progreso parcial y genera una sola respuesta al completar.

### E3 · Partida completa

Los 12 ítems del fixture, tres dificultades, dos tutoriales, camión, pausa, ayuda y final.
Aceptación: todo el contenido se recorre sin datos escritos a mano; una partida ideal genera 1 inicio, 12 respuestas y 1 fin completado.

### E4 · Integración local verificable

Registro y exportación de eventos, limpieza al desmontar, recursos reconocibles y prueba responsive.
Aceptación: los eventos cumplen el contrato y se pueden revisar sin servidor; reiniciar no mezcla ejecuciones; funciona en un teléfono real.

### E5 · Listo para conectar la sala

Documentación del punto de montaje y ejemplos de eventos, con los límites de simulación claramente visibles.
Aceptación: U y C conocen qué consume el motor y qué emite; la demo no se presenta como multijugador implementado.

## 10. Plan de pruebas

Son pruebas futuras de aceptación. No se han ejecutado contra un motor implementado.

### Reglas de clasificación

- T01: completar f1 colocando p1/p3 en gaseosas y p2/p4 en aguas; resultado: cuatro identidades colocadas y una sola respuesta para f1.
- T02: soltar un agua en gaseosas; resultado: vuelve al origen, no avanza la meta e intentos pasa a 2.
- T03: soltar fuera de destinos; resultado: vuelve sin aumentar intentos.
- T04: volver a tocar o soltar un producto ya colocado; resultado: no duplica su conteo ni la respuesta.
- T05: cargar f2 después de f1, donde se repiten IDs p1; resultado: el nuevo p1 empieza disponible.
- T06: cancelar un arrastre al perder el foco, recibir pointercancel o usar Escape; resultado: no quedan objetos flotando ni bloqueados.

### Reglas de pedido

- T07: completar f3 con las tres aguas; resultado: bolsa con tres productos y una respuesta C2.
- T08: intentar un jugo en f3; resultado: rechazo con pista, bolsa sin cambio e intentos incrementado.
- T09: repetir el drop de la misma identidad; resultado: el conteo no aumenta.
- T10: dos drops durante el último espacio; resultado: se acepta una sola finalización y se bloquea la entrada a tiempo.
- T11: completar a4 con siete jugos entre diez objetos; resultado: siete aceptados, los distractores no se exigen y no se recortan objetivos fuera de pantalla.
- T12: tocar un producto y luego la bolsa; resultado: misma regla y evento que con arrastre.

### Tutorial, pausa y accesibilidad

- T13: terminar o repetir los tutoriales; resultado: cero respuestas y cero progreso por demostración.
- T14: terminar f2 y llegar a f3; resultado: aparece el tutorial de pedido antes de la nueva acción.
- T15: pausar a mitad de f1 y reanudar; resultado: conserva colocaciones, selección por toque y conteos, cancela un arrastre inconcluso sin error y no cuenta tiempo pausado.
- T16: ocultar y volver a la pestaña; resultado: pantalla pausada y ninguna interacción accidental.
- T17: resolver con sonido apagado y movimiento reducido; resultado: conserva todas las pistas necesarias.
- T18: completar f1 y f3 usando teclado; resultado: foco visible, selección y destinos operables sin arrastrar.
- T19: usar solo envases e iconos, sin distinguir colores; resultado: se reconocen categorías y pedido.
- T20: solicitar ayuda tras dos errores; resultado: muestra pista sin resolver ni emitir respuesta.

### Partida y eventos

- T21: resolver todo sin errores; resultado: 1 inicio, 12 respuestas únicas, 1 fin, total=12, aciertos=12, completado=true e intentos=1 en cada respuesta.
- T22: equivocarse dos veces en un ítem y resolver; resultado: una respuesta con intentos=3, correcto=true y tiempo activo no negativo.
- T23: salir tras resolver f1 y empezar f2; resultado: fin con total=1, aciertos=1 y completado=false, sin respuesta de f2. total representa ítems evaluados en esta propuesta; ver nota de compatibilidad.
- T24: reiniciar y volver a completar f1; resultado: eventos de dos ejecuciones separados, sin progreso arrastrado entre partidas.
- T25: redimensionar y montar/desmontar dos veces; resultado: sin canvas duplicados, listeners sobrantes ni eventos académicos espontáneos.
- T26: terminar dos veces por callback repetido; resultado: un solo fin.
- T27: cambiar solo meta.objetivo a 8 en una copia de prueba, sin modificar el fixture; resultado: la barra se limita a 8 y la partida sigue hasta sus 12 actividades.
- T28: cerrar pestaña abruptamente; resultado: no prometer recepción del último fin. La prueba registra ese límite explícito.

Nota de compatibilidad para T23: el contrato define total sin precisar su significado en un abandono. Se propone total=ítems resueltos/evaluados para que coincida con los items que recibirá el contenedor. Esta decisión local debe confirmarse con U antes de integración; el total previsto=12 sigue siendo información del spec, no un campo nuevo del evento.

### Integración y recursos

- T29: impedir toda petición de red desde el motor en la prueba local; resultado: se puede completar el juego con el fixture y recursos locales.
- T30: retirar un recurso requerido del registro visual de prueba; resultado: error de carga dirigido al desarrollador, sin iniciar una actividad imposible.
- T31: cargar un GameSpec de carrera en el host de tienda; resultado: el host lo rechaza antes de montar, sin modificar el esquema compartido.
- T32: usar una variante válida de tienda con otra cantidad o meta; resultado: cambia lo mostrado desde los datos, sin editar reglas del motor.
- T33: cambiar un sprite por otro sin alterar su ID; resultado: la evaluación sigue dependiendo de identidad/categoría y no del nombre del archivo gráfico.

### Dispositivos y comprensión

- T34: probar 360×800, 390×844, 768×1024, 1366×768 y 844×390; resultado: productos y destinos accesibles, controles sin solapamiento y texto legible.
- T35: probar en un Android real con navegador y un dedo; resultado: arrastrar no desplaza accidentalmente la página y cancelar no bloquea la ronda.
- T36: probar Chrome/Chromium y Firefox de escritorio; resultado: completar clasificación, pedido, pausa y final en ambos.
- T37: observar a un adulto que no conozca la interfaz, y si el colegio lo facilita a un estudiante con su acompañamiento habitual; resultado esperado: después de la demostración comprende dónde mover el primer producto. Se anotan ayudas externas necesarias, no se afirma comprensión infantil solo por una prueba técnica.
- T38: sesión completa de 10 minutos en el teléfono usado para la demo; resultado: entrada estable, sin cierres ni crecimiento continuo de canvas/listeners. Se mide el rendimiento en ese equipo y se reduce decoración si afecta al arrastre.

## 11. Criterio de terminado de tu primera entrega

- Las 12 actividades se pueden completar en computadora y teléfono real.
- Los dos tutoriales enseñan acciones diferentes.
- No hay respuestas ni progreso duplicados.
- Los eventos mantienen itemId, criterio, intentos y tiempos coherentes.
- La prueba local funciona sin backend y deja claro su alcance.
- El camión usa la meta del spec.
- Se documentan las pruebas ejecutadas con dispositivo, fecha, resultado y defectos pendientes.
- No se presenta como terminada una sala compartida, recuperación persistente o métrica académica que aún no existe.

## 12. Decisiones para revisión antes de programar

Este diseño propone una tienda ilustrada 2D con profundidad suave, la secuencia completa de 12 actividades, alternativa de toque y teclado, camión local por actividad y ausencia de recuperación tras recargar en C1+C2.

La implementación no comienza hasta revisar este documento y la imagen. Una vez aprobado, se escribe el plan técnico con archivos exactos, dependencias, pasos de construcción y comandos de prueba.

Punto a coordinar con U antes de integrar: semántica de total en fin incompleto y uso educativo de correcto e intentos; no bloquea el diseño visual ni las dos mecánicas locales.

Revisión de construcción: un segundo agente leyó este documento y no encontró preguntas importantes pendientes para planificar las mecánicas locales. Esta revisión es documental; no sustituye la aprobación del diseño ni demuestra que las pruebas del juego pasen.

## 13. Registro del arte conceptual

La imagen se generó con la herramienta integrada ImageGen y se guardó en docs/design/tiendita/pedido-concepto-v1.png. El [prompt utilizado](../../design/tiendita/pedido-concepto-v1.prompt.txt) se conserva junto a la imagen.

Es una referencia de composición, controles y dirección artística. Ningún elemento de la imagen implica que exista código, recurso final o funcionalidad implementada.
