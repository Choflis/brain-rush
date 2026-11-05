# Revisión visual e interactiva · 5 de noviembre de 2026

La bienvenida, el acceso y el portal infantil conservan crema, naranja, verde y la mascota local original. Nunito Variable se sirve desde las dependencias locales. El panel docente mantiene su organización, con navegación compacta en teléfono, rejillas fluidas y tablas con desplazamiento propio.

## Criterios consultados

- [NN/g: Children’s UX](https://www.nngroup.com/articles/childrens-websites-usability-issues/): diferencias entre edades, capacidades motrices y comprensión de la navegación. Aplicación: instrucciones breves, grados visibles, botón de juego explícito y navegación reconocible.
- [WCAG 2.1](https://www.w3.org/TR/WCAG21/): objetivos táctiles, foco y movimiento reducible. Aplicación: mosaico con casillas de al menos 44 px según ancho del componente, selección por teclado y foco visible; `prefers-reduced-motion` detiene el seguimiento y las animaciones ornamentales.
- [OpenDesign](https://github.com/nexu-io/open-design): skills `frontend-design`, `animate` y `redesign-skill`. Se reutilizó el stack React/CSS y se mantuvieron las reglas y contratos de los juegos.

## Comportamiento

Reglita permite saludar mediante clic, toque o teclado. Las pupilas siguen el cursor con un desplazamiento limitado, sin provocar renderizados React por cada movimiento. Los eventos, temporizadores y frames se limpian al desmontar. La mirada vuelve al centro al perder el puntero o activar movimiento reducido.

El mosaico es un recreo opcional fuera de las partidas. Admite pintar con cursor, toque, Enter o espacio; las flechas recorren las filas según las columnas visibles. Los colores tienen nombre y selección accesible. Borrar permite empezar de nuevo. No registra puntuaciones educativas ni modifica datos de alumnos.

## Validación local

- 10 pruebas nuevas de navegador: interacciones de la mascota y mosaico, teclado, toque, movimiento reducido, tamaños táctiles, reflujo y ausencia de errores JS y recursos locales fallidos, acceso docente, tarjetas y ventanas móviles.
- 10 pruebas existentes de navegador de La Tiendita: partida completa de 12 actividades, arrastre, error educativo, pausa/reanudación, pedidos, ayudas, teclado, foco, móvil táctil, horizontal y exportación.
- 66 pruebas existentes de motor y GameSpec, revisión de tipos y compilación de producción.
- Revisión de capturas de bienvenida en escritorio/móvil, portal infantil y panel docente; capturas temporales en `/tmp/brain-rush-*.png`.

Se corrigieron las tarjetas de sesiones que quedaban recortadas en teléfonos, y el mosaico que inicialmente reducía demasiado sus casillas en tablet. Las comprobaciones de tamaño usan las cajas reales de los controles, además del ancho del documento.

Esta revisión usa navegador automatizado y emulación táctil. La comprensión y comodidad del diseño con niños reales y dispositivos físicos queda por observar con el equipo. No se han cambiado API, datos ni reglas educativas. No se realizó push.

## Iteración del acceso de estudiantes

La huella de color ocupa una franja a todo el ancho al final de la bienvenida y del portal. El acceso de alumnos utiliza un cuaderno ilustrado, salones con SVG y tarjetas de animales dibujados en SVG en lugar de emojis. El acceso general abre estudiantes; `/docente/login` conserva el rol docente.

Reglita acompaña la posición del cursor al escribir el nombre. En teléfono aparece una miniatura decorativa junto al campo para conservar esa respuesta visual cuando la cabecera queda fuera de vista. Movimiento reducido centra ambas miradas. La búsqueda reconoce los nombres existentes incluso sin tildes; un invitado conserva el nombre que escribe y el salón seleccionado. El panel docente conserva su diseño.

Se añadieron nueve pruebas de navegador sobre nombres, entrada conocida/invitada, cambio de salón y rol, teclado, escritura y mirada, movimiento reducido, miniatura móvil, ausencia de emojis y franja inferior completa. La suite de interfaz tiene 19 pruebas. La revisión independiente verificó también selección por teclado y entrada «Joaquin» en tercero. No encontró problemas importantes; los salones actuales tienen grados distintos y el selector muestra el grado para distinguirlos.

## Escritorio pedagógico docente

El área del profesor usa navegación verde, superficies crema, acentos cálidos y tipografía de la identidad. El resumen se filtra por salón; las métricas enlazan a sesiones/estudiantes y cada alumno que requiere apoyo permite desplegar sus criterios. Sesiones incorpora búsqueda, grado, lista/cuadrícula y estados vacíos. Clases incorpora búsqueda por nombre, estado, orden y permisos accesibles con confirmación.

Los contadores se actualizan al guardar datos del aula local. El formulario admite PDF/DOCX como referencia documental, valida su extensión y conserva el flujo de preparación de demostración; no se añadió extracción de documentos ni una integración nueva con IA. El acceso docente acepta su nombre y Reglita responde a la escritura.

Las ventanas administran foco, Escape y retorno al botón de apertura. Desde el iframe de juego, Escape conserva sus acciones propias y Tab permite llegar al cierre exterior. Los temporizadores de los asistentes se limpian al desmontar; cancelar una preparación evita que se guarde después de cerrar. El movimiento reducido se respeta también durante el estado de respuesta de Reglita.

Validación: 19 pruebas de regresión de interfaz y 11 del escritorio docente, 66 pruebas de motor/GameSpec, revisión de tipos, compilación y revisión independiente. Capturas temporales de escritorio, móvil, clases, sesiones y acceso en `/tmp/brain-rush-teacher-*.png`.
