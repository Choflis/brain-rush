# Tanda única de correcciones materiales de revisión
Repo: C:/Users/luisg/OneDrive/Documentos/Universidad/8vo/videojuegos/HackForEdu/brain-rush
La Tiendita C1+C2 YA funciona,20tests de reglas y6browser pasan, build/typechecks pasan. Tu trabajo es corregir los5 hallazgos siguientes y añadir regresiones focales, conservando el arte/estructura y toda la funcionalidad. No rediseñes, no subagentes, no commits. Root mantiene el servidor Vite en http://127.0.0.1:5174 y escribe documentación. No toques rootpackage, backend, App.tsx, GameSpec/fixtures ni imágenes.
Archivos autorizados: apps/web/src/juego/{Tiendita.tsx,ilustraciones.tsx,tienda.css}, un helper recursos.ts opcional en ese directorio; packages/engine/src/scene.ts; packages/engine/browser/tiendita.spec.ts; test puro nuevo en packages/engine/tests si necesario; scripts test de packages/engine/package.json solo para incluir ese test.
No edites types.ts/tienda.ts/tests/tienda.test.ts: motor ya revisado20tests. Todos los campos/eventos quedan iguales.

1. Cancelación de gesto:
Drag debe rastrear pointerId y elemento que captura; solo aceptar puntero primario, ignorar un segundo dedo mientras haya gesto. Cancelar con Escape, pointercancel, lostpointercapture, windowblur o pausa: limpiar captura/ghost y consumir click sintetizado posterior, sin aumento de intentos, sin re-selección. No rompas el tap para seleccionar. Escape con selección cancela; sin selección puede pausar. Añadir prueba real arrastrar>umbral, Escape, soltar: aria-pressed false, nada colocado, sin error académico; probar pointerId distinto no altera el primero (dispatchEvent con pointer data solo en test, si se usa).

2. Pista específica y temporal:
Ahora attempts>2 resalta todos los estantes indefinidamente; pedido no destaca el solicitado. Tras2errores educativos (attempts>=3) y/o ayuda explícita, señalar SOLO estante de la categoría del producto que falló, durante~1.8s, o pictograma solicitado en pedido. Limpiar al expirar, acertar, cambiarítem y reiniciar. No resolver automáticamente. Desactivar animación durante pausa. Regresión browser o lógica helper verifique clase del único destino y caducidad.

3. Pausa:
mountTiendaWorld debe recordar pause(paused) aunque create no haya terminado y aplicar en create. React debe entregar fase actual al montar el mundo tras import dinámico y cambios de fase. Congelar animaciones CSS del tablero cuando pausado (por clase/atributo), sin congelar UI modal. No reanudar estado académico automáticamente. Regresión carga/pausa o prueba de contrato visual suficiente.

4. Gráficos por asset:
Actualmente Producto e estiloCategoria asumen IDs lógicos aguas/gaseosas/jugos. El generador puede renombrar IDs conservando asset producto-agua/estanteria-aguas. Resolver tipo visual/etiqueta/estilo a partir de ASSET, mantener ID lógico para evaluación y destinos. Registro local explícito de recursos actualmente soportados (3 productos+3estanterías, personaje-reglita, escenario-tiendita, anim-tutorial-tienda). Antes de jugar, si spec referencia recurso sin representación, host muestra error recuperable y el ID en modo debug (sin categorías de fallback confusas). No cambies validador compartido; disponibilidad de recursos es validación local de renderer. Ayudante puro opcional y pruebas: renombrar categoría no cambia arte; recurso desconocido es rechazado. Pedido usar asset del producto/categoría solicitada para pictograma y slots. Pueden mantenerse decoraciones intro hardcoded porque no son spec académico.

5. Horizontal poca altura:
Adaptación @media de bajaaltura844x390 (y1366x768 desktop no romper): targets y10productos deben caber simultáneamente sin scroll durante gesto. Puedes usar modo board más compacto y10productos una fila cuando ancho permite56x56+gaps; reducir cabecera/márgenes si necesario, labels legibles. No ocultes targets/objetos ni reduzcas hitboxes<56. Prueba browserviewport844x390 que llegue a a1 y aserte rect destinos/productos dentro viewport y sin overflowX; capturar horizontal.

Pruebas:
Usa TDD para regresiones donde factible. Puedes ejecutar node unit20 y playwright --grep de nuevas pruebas; root ejecutará suite completa al cerrar. En este entorno comandos que conectan localhost o lanzan browser deben pedir sandbox_permissions require_escalated, prefix ["npm","run","test:browser"] ya autorizado. npm run test:browser -w packages/engine -- --grep "..." desde raíz. No arrancar otro servidor; hay uno fuera sandbox puerto5174.
Documenta hallazgos resueltos y comandos en docs/superpowers/plans/2026-11-05-tiendita-fix-report.md. Al devolver estado, explica cualquier límite residual material sin inventar éxito. Revisor de origen confirmó capturas desktop/portrait buenas; no reabrir identidad ni pulido ilimitado.
