# La tiendita · identidad visual

La tiendita es un juego de clasificación y conteo para primero y segundo de primaria. Su superficie funciona como una pequeña bodega ilustrada: estantes, envases, una bolsa de papel y un camión que reúne las actividades completadas. El propósito de la interfaz es que el niño reconozca qué puede mover, encuentre su destino y vea el resultado de su acción con poca lectura.

## Dirección aprobada

La tienda continúa la identidad de la landing: crema `#fbf7ef`, naranja `#f26a3d`, verde `#1f7a6a`, verde claro `#dff2ec` y tinta `#14201f`. Los bordes principales usan radio de 18 px, las líneas `#e4dccd` y el texto secundario `#4a5c59`. El naranja identifica la entrada y las acciones principales; el verde acompaña instrucciones, foco y estados aceptados. La madera miel conecta estantes, bandeja y bolsa con la tienda física. La mascota verde original se presenta recortada y expresiva. Sus imágenes locales son `/juego/tiendita/mascota.png` y `/juego/tiendita/tienda-fondo-calido.png`.

La tipografía comparte la misma familia de la landing: `Segoe UI`, `system-ui`, `-apple-system`, `Helvetica Neue`, `sans-serif`. Los títulos tienen peso alto, interlínea compacta y espaciado ligeramente cerrado; instrucciones y controles mantienen un tamaño cómodo. Las cantidades usan numerales tabulares para que el progreso sea estable.

El modo de esta superficie es **Experience**: la tienda ocupa el escenario y los controles acompañan el juego. No se usa una composición de panel administrativo. Los bloques representan objetos del mundo: el pedido es un recibo, el destino es una estantería o una bolsa, los productos descansan en un mostrador de madera. Se evitan gradientes, emojis, fondos fotográficos para envases y decoraciones que parezcan objetivos interactivos.

## Portada

La portada de escritorio combina dos columnas: el nombre «La tiendita», una invitación breve y el botón naranja a la izquierda; la mascota dentro de una arquitectura de tienda con arco, toldo, letrero abierto, recibo y camión a la derecha. En teléfono el texto precede a la escena y el botón queda antes de la ilustración. El personaje conserva su transparencia; el arco es arquitectura de fondo y no una máscara que recorta al personaje.

## Escena y jerarquía

La cabecera agrupa ayuda, sonido y pausa. El camión comunica actividades resueltas y se etiqueta como prueba local. La barra no representa tiempo restante ni competencia.

El canvas Phaser llena todo `.game-stage` y no recibe eventos de puntero. El contenido DOM accesible se superpone a él. En escritorio, el 20 % izquierdo se reserva para la mascota del canvas y su frase; estantes, pedido y mostrador ocupan el espacio restante. El toldo tiene un área propia arriba para que no cubra instrucciones. La escena crece con el contenido.

Dos o tres estantes se reconocen mediante la forma del envase, el pictograma, el nombre y el color de categoría. Agua, gaseosa y jugo mantienen sus colores azul, rojo y naranja respectivamente. Los productos colocados aparecen en su estante y conservan una marca de aceptación en el origen. Selección, pista y error tienen señales adicionales al color.

El pedido muestra cantidad, envase y puntos contables. La representación numérica utiliza etiquetas de papel con números del 0 al 10, foco visible y estado seleccionado con elevación, giro y borde naranja. La frase se centra sobre las etiquetas y «Pegar etiqueta» ofrece un destino mínimo de 56 px. El ajuste a varias filas conserva el tamaño táctil en teléfonos. La bolsa conserva espacios visuales para los productos solicitados y un conteo parcial. En escritorio amplio caben diez productos en una fila. En tamaños intermedios y teléfonos se distribuyen en un máximo de cinco columnas y dos filas. Ningún producto necesario se recorta.

## Interacción y accesibilidad

Los controles principales y las fichas tienen un mínimo de 56 píxeles de ancho. El foco de teclado utiliza un contorno verde de 4 píxeles con separación; las acciones se pueden realizar por selección y confirmación además del arrastre. El sonido comienza apagado, según el estado de la pantalla React.

`touch-action: none` se limita a las fichas arrastrables. El resto de la página permite desplazamiento cuando el contenido excede la altura del dispositivo. La figura que acompaña un arrastre es fija, ignora eventos y usa `translate(-50%, -75%)` para dejar visible el punto de destino.

Las elevaciones usan sombras suaves con desplazamiento físico. Las transiciones aclaran selección, recepción y aceptación. La mascota de portada respira y se eleva suavemente; cada actividad presenta sus productos con una entrada escalonada breve. Seleccionar una ficha la levanta y anima discretamente los pictogramas de destino. Al completar una actividad, el camión recibe una sacudida de carga; en el resultado llega acompañado de estrellas escalonadas. Ninguna animación bloquea la entrada.

El tutorial enseña en un recorrido repetido el movimiento del producto y la mano hacia el destino. El tutorial de pedido dibuja una bolsa distinta del estante. La preferencia de movimiento reducido elimina animaciones y mantiene una demostración estática con contorno de destino. Ayuda y pausa protegen el foco visual con un diálogo central legible y botones grandes.

## Adaptación y revisión

El diseño contempla escritorio de 1366 × 768 y teléfono de 390 × 844 y 360 × 800. Bajo 720 píxeles desaparece el margen reservado al personaje del canvas y la frase incluye una miniatura de mascota. El contenido conserva su tamaño táctil; se permite desplazamiento vertical antes que ocultar funciones.

La verificación visual en navegador debe cubrir portada, clasificación de tres categorías y diez productos, pedido de siete productos, tutorial, pausa y resultado. La comprobación técnica de CSS no sustituye probar arrastre en un teléfono real ni observar comprensión infantil. Esta documentación describe decisiones implementadas en la hoja de estilo, no certifica esas pruebas de uso.

## Registro para docentes

El informe docente usa un `details` al final de la página, en el flujo normal y fuera del área de juego. Su resumen ocupa al menos 56 px; el cuerpo presenta las métricas C1 y C2 en una tabla semántica, con numerales tabulares y encabezados verdes suaves. El pie agrupa las acciones de exportación. En móviles la tabla admite texto partido y el pie se apila. No se añaden contadores docentes, paneles flotantes ni instrucciones administrativas dentro de la partida.
