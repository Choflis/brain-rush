# Diseño infantil responsive · plan de implementación

**Objetivo:** conservar la identidad y los flujos de BRAIN RUSH, mejorar la presentación para primaria y añadir interacción lúdica opcional. Trabajo local; sin push y aprobación del usuario al terminar.

**Arquitectura:** React, CSS existente y componentes compartidos. Sin bibliotecas nuevas ni cambios a contratos API, datos o reglas educativas. Crema, naranja, verde y Nunito local. El panel docente conserva su estructura.

## Tareas
- [x] Verificar el estado inicial con Playwright y añadir comprobaciones de nuevas interacciones antes de implementarlas.
- [x] Crear Reglita interactiva sobre la imagen original: mirada limitada al cursor, saludo al pulsar, teclado, toque y movimiento reducido. Limpiar listeners, frames y temporizadores.
- [x] Añadir mosaico de colores opcional en bienvenida y portal: puntero, toque, navegación con flechas, selección de color y reinicio. Sin puntuación educativa ni persistencia.
- [x] Renovar bienvenida y jerarquía del portal infantil, reutilizando accesos y juegos actuales. Incorporar Reglita en las portadas de juegos.
- [x] Ajustar responsive global: navegación, tarjetas, formularios PIN, tablas, modales y asistente; foco visible y controles cómodos.
- [x] Verificar escritorio, tablet y móvil, teclado, movimiento reducido, acceso docente, inicio de juegos y ausencia de errores frontend. Ejecutar tipos, build y pruebas existentes.

## Criterios y fuentes
- NN/g: https://www.nngroup.com/articles/childrens-websites-usability-issues/ — distinguir edades, instrucciones concretas y control sencillo.
- W3C: https://www.w3.org/TR/WCAG21/ — foco, controles amplios, posibilidad de reducir movimiento.
- OpenDesign: https://github.com/nexu-io/open-design — skills frontend-design, animate y redesign-skill, consultadas desde copia temporal. Las pautas genéricas ceden ante la identidad del proyecto y el público infantil.

## Revisión
Especial atención a: reflujo a 320 px; coherencia entre ratón y toque; no bloquear controles de juego; preferencia de movimiento reducido; limpieza de efectos con StrictMode. La validación técnica no sustituye pruebas con niños reales.
