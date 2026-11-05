# Informe de correcciones de revisión — La tiendita

El revisor encontró cinco problemas materiales y un límite de tiempos. Se corrigieron en una tanda y se comprobó el resultado con regresiones y revisión focal.

1. Punteros: identidad del gesto, captura, limpieza por Escape/blur/cancel/lost-capture y consumo del click residual. El teclado puede seleccionar después de cancelar.
2. Pistas: se resalta un solo estante lógico o el pictograma del pedido durante un intervalo, sin resolver por el niño.
3. Pausa: el estado pendiente se aplica al crear Phaser y las animaciones CSS del tablero se congelan.
4. Recursos: un registro explícito traduce assets; un recurso no representado se rechaza antes de empezar, sin fallback visual engañoso.
5. Baja altura: modo compacto horizontal con los diez productos y destinos accesibles.
6. Tiempos: el controlador mantiene precisión interna y redondea al emitir; tiempoMs aplica el máximo de 3 600 000.

Regresiones: tres pruebas browser focales se observaron fallar y luego pasar. Las dos pruebas puras de recursos se añadieron después de implementar el registro; no se registró un rojo para esas dos. El motor añadió dos regresiones rojo/verde para tiempos y otra para aislar snapshot.

Resultado final: 22 pruebas puras y 9 browser correctas. Typechecks y builds de la parte entregada correctos. El revisor dictó ship en el alcance de los hallazgos y pidió solo recapturar horizontal tras la notificación, sin cambios de diseño adicionales.

Límites no ocultos: C4/C5 y uso en dispositivos físicos siguen pendientes. No hubo push ni despliegue.
