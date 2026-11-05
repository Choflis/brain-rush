# SDD ledger — plan: docs/superpowers/plans/2026-11-05-tiendita-implementacion.md

## Contexto
Usuario autorizó ejecutar su parte C1+C2 con subagentes, mantener la estructura y usar la mascota adjunta. Luego reforzó la prioridad de movimiento e interacción dinámica.

## Preflight
- T1 produce createTienda/types; T3 consume las mismas firmas: interfaces congeladas en brief, sin conflicto.
- T2 produce imágenes; T3 consume rutas locales: nombres acordados mascota.png y tienda-fondo.png.
- T3 y T4 comparten host/config: los coordina el orquestador; no cambian el shell React de U.
- T1 pruebas y código: mismo GameSpec y reglas de contador; aprobado por revisor tras aislar snapshot mutable.
- T2 arte y brief: la nueva mascota reemplaza la regla visual; ID técnico conservado.
- T3 interacción y accesibilidad: DOM maneja controles accesibles, Phaser presenta mundo y respuesta visual.
- T4 pruebas y build: entrada HTML propia, no requiere backend.
- T5 revisión: pendiente de integrar escena y CSS para captura final.

## Decisiones de ejecución
- Se trabaja en rama dedicada feat/c-tiendita-jugable, partiendo del diseño ya guardado; no se altera main ni se publica.
- La mascota sigue los rasgos y ojos de la imagen real del usuario; la suposición verbal inicial de un solo ojo se descarta.
- La entrega actual es C1+C2. C4/C5 y las demás mecánicas siguen pendientes según el enfoque A elegido.
- El host propio evita cambiar App.tsx y permite revisar el juego aunque la API siga como stub.
- Se instalaron dependencias declaradas con npm ci. Baseline tenía configuraciones incompletas de API/engine y pruebas ausentes de gamespec; no se declarará una suite global verde si solo pasa esta parte.

## Avance
- T1: implementado, 22 pruebas verdes, typecheck, revisión independiente aprobada después de corregir referencia mutable de snapshot.
- T2: mascota RGBA y fondo generados; transparencia verificada; prompts conservados.
- T3: React/Phaser y CSS completos, con revisión visual.
- T4: nueve pruebas browser completas verdes, typechecks y builds correctos.
- T5: revisión final con cinco hallazgos corregidos; re-review focal aprobado. La captura horizontal se actualiza tras finalizar la notificación.
