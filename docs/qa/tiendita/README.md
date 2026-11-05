# Verificación de La tiendita C1+C2

Fecha: 5 de noviembre de 2026.
Ámbito: motor, recursos visuales, host local y escena de La tiendita. No se afirma que esté terminada toda la plataforma.

## Resultado

- 22 pruebas de controlador y recursos: correctas.
- 9 pruebas de navegador Chromium: correctas, suite completa en 1,2 minutos.
- Typecheck de apps/web y packages/engine: correcto.
- Build independiente de La tiendita: correcto.
- Build original de apps/web: correcto.

## Pruebas de navegador ejecutadas

1. Partida de principio a fin: 12 respuestas únicas, un inicio y un fin.
2. Arrastre real, categoría errónea y pausa/reanudación.
3. Pedido pictográfico, repetición de ayuda y descarga de eventos.
4. Recurso PNG ausente: error recuperable antes de jugar.
5. Selección por teclado y foco contenido en el tutorial.
6. Teléfono emulado 390×844: diez productos, controles táctiles y ausencia de desbordamiento.
7. Cancelación con Escape y aislamiento de punteros.
8. Pista única temporal y tablero pausado.
9. Horizontal 844×390: diez productos y destinos visibles, áreas de al menos 56×56.

El test horizontal espera a que termine la notificación anterior antes de guardar la imagen. Esto afecta a la evidencia visual, no a la evaluación de respuestas.

## Hallazgos corregidos en revisión

- Snapshot del controlador aislado mediante copia profunda.
- Duraciones emitidas como enteros; tiempo por respuesta limitado a una hora según el contrato.
- Arrastres asociados a su pointerId y cancelación que no selecciona de nuevo ni cuenta un error educativo.
- Pistas dirigidas al destino correcto y con caducidad.
- Pausa conservada aunque Phaser termine de cargar después.
- Representación resuelta por asset del GameSpec, independiente del ID lógico de categoría.
- Adaptación de poca altura para que destinos y productos puedan verse juntos.

Un revisor independiente volvió a comprobar los hallazgos y aprobó C1+C2 en ese alcance. No se reinterpreta como aprobación de C4/C5.

## Capturas reales del juego

- [Portada de escritorio](portada-desktop.png).
- [Clasificación de escritorio](clasificacion-desktop.png).
- [Pedido](pedido-desktop.png).
- [Final de partida](final-desktop.png).
- [Portada móvil](portada-mobile.png).
- [Clasificación móvil](clasificacion-mobile.png).
- [Clasificación horizontal](clasificacion-horizontal.png).

Las capturas proceden de la aplicación ejecutada. Son diferentes de los mockups conceptuales anteriores.

## Límites de la evidencia

No se ejecutó prueba física en Android/iOS, Firefox, observación con estudiantes ni medición de rendimiento en un celular de gama baja. La prueba móvil es emulada con Chromium.

El plan de diseño enumera 38 criterios de aceptación; estas suites agrupan varios, pero no se declara que los 38 se hayan probado en todos los dispositivos.

La suite global anterior tenía un script de gamespec que apunta a un directorio test inexistente, y la API carece de su configuración completa. No se modificaron esas partes ni se declara una suite global verde. Se verificaron explícitamente los paquetes de esta entrega.

## Reproducir

Consultar [Probar La tiendita](../../PROBAR-TIENDITA.md). El servidor local está en http://127.0.0.1:5174/tiendita.html.

La generación visual utilizó ImageGen. Los archivos finales y prompts exactos están en apps/web/public/juego/tiendita. La mascota procede de la referencia aportada por el usuario y se preparó con transparencia.
