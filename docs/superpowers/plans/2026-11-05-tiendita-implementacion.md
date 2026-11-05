# La tiendita jugable — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** completar C1+C2 como juego local de clasificación y pedidos para primaria, con la mascota aportada por el usuario.
**Architecture:** controlador TypeScript puro consume el GameSpec; la vista React y una escena Phaser presentan las acciones, reciben los resultados y emiten los eventos congelados. El montaje se hace con una entrada HTML propia de la parte C, sin editar el shell de U.
**Tech Stack:** TypeScript, React/Vite existentes, Phaser 3, pruebas node:test y navegador.
**Spec:** ../specs/2026-11-05-tiendita-diseno.md. La instrucción actual del usuario sustituye la apariencia de regla por la mascota verde adjunta, manteniendo el ID interno.

## Global Constraints
- Solo implementar La tiendita C1+C2; no sustituir panel/backend ni prometer multijugador.
- Consumir fixtures/juegos/n1-tienda.json sin editarlo: 12 actividades, C1/C2, meta 12.
- Mantener API, GameSpec y otros archivos de U; el lockfile derivado se entrega para revisión.
- La mascota visual sigue la imagen del usuario y conserva su cara; no cambiar el número de ojos por una suposición.
- Mouse, toque/arrastre y teclado; ayudas visuales; sin vidas ni temporizador de castigo.
- El motor no hace red. Los eventos mantienen inicio/respuesta/fin del contrato.
- Probar localmente, producir build y no publicar ni hacer push sin nueva instrucción.

## Review Focus
- Identidades p1 repetidas entre actividades no pueden compartir colocación.
- Doble interacción al cerrar un pedido no puede duplicar respuesta.
- Pausa y ayuda excluyen su duración de tiempos activos.
- Redimensionar o desmontar no debe duplicar canvas/listeners ni eventos.
- En pantalla angosta deben caber todos los productos/destinos sin scroll durante un arrastre.

## Task 1: controlador puro y pruebas de reglas (subagente)
Files: packages/engine/src/tienda.ts, src/types.ts, src/index.ts, tests/tienda.test.ts, tsconfig.json.
Consumes: GameSpec de tienda y contrato del documento 08.
Produces: createTienda(spec, opciones), controlador/snapshot/eventos según brief de interfaces.
- [x] Crear pruebas node:test con el fixture para clasificación, pedido, errores, doble drop, IDs repetidos, pausa/ayuda, recorrido 12, fin/reinicio.
- [x] Ejecutarlas en rojo antes de implementar.
- [x] Implementar controlador independiente de React, Phaser y red.
- [x] Ejecutar todas las pruebas y typecheck del paquete.
- [x] Revisar el diff y reportar a orquestador.

## Task 2: arte y composición (orquestador + asesor de diseño)
Files: apps/web/public/juego/tiendita/, docs de procedencia visual, PRODUCT.md/DESIGN.md del juego.
- [x] Generar recorte transparente de mascota desde referencia y conservar prompt.
- [x] Preparar entorno de tienda y gráficos geométricos claros para las tres categorías.
- [x] Mantener morado/lima/crema de la propuesta elegida y distinguir envases por forma.
- [x] Verificar transparencia y carga de recursos.

## Task 3: escena jugable, host y tutoriales (orquestador)
Files: packages/engine/src/scene.ts, apps/web/src/juego/Tiendita.tsx, tienda.css, main.tsx, apps/web/tiendita.html.
- [x] Montar entrada Vite independiente accesible en /tiendita.html, sin editar App.tsx.
- [x] Portada, clasificación, pedido y final, vinculados al controlador.
- [x] Añadir movimiento de carga del camión, mascota y feedback con Phaser; respetar reduced-motion.
- [x] Implementar tutoriales separados y repetibles, selección por toque y arrastre, teclado, pausa y sonido opcional.
- [x] Exponer registro/exportación de eventos en vista de desarrollo.
- [x] Limpiar escena/timers al desmontar y probar estados de salida/reinicio.

## Task 4: pruebas de integración y empaquetado (orquestador)
Files: packages/engine/package.json, apps/web/package.json, package-lock.json, apps/web/vite.tiendita.config.ts, pruebas browser.
- [x] Resolver dependencias y scripts del ámbito C sin reescribir versiones de U.
- [x] Ejecutar node:test del controlador, typecheck web/engine y build de la entrada propia.
- [x] Pruebas browser de clasificación/pedido, reintentos, pausa, ayuda, final 12 y eventos.
- [x] Capturar escritorio y móvil; revisar overflow, foco y zonas táctiles.
- [x] Documentar que pruebas emuladas no equivalen a prueba en un teléfono físico.

## Task 5: revisión independiente y entrega
- [x] Revisor revisa comportamiento, integración y riesgos del diff.
- [x] Corregir hallazgos materiales y repetir solo comprobaciones afectadas.
- [x] Guardar instrucciones para ejecutar la demo, estado y límites.
- [x] Entregar URL local y evidencia de pruebas, sin declarar C4/C5 completos.
