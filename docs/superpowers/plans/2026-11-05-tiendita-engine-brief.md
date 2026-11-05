# Task 1 — controlador puro de La tiendita
Workspace: C:/Users/luisg/OneDrive/Documentos/Universidad/8vo/videojuegos/HackForEdu/brain-rush.
Write boundary ONLY packages/engine/src/types.ts, tienda.ts, index.ts, packages/engine/tests/tienda.test.ts and packages/engine/tsconfig.json. Do not edit package.json, lockfile or any other files. No subagents. No commits (orchestrator reviews and integrates).

Read existing schema.ts and fixture n1-tienda.json plus docs/especificacion/08-contrato.md sections7. Use imports .ts. Export pure TS, DOM-free. Node v24 strips TypeScript; use node --experimental-strip-types --test packages/engine/tests/tienda.test.ts. Write failing tests first and run red before implementation. Do not wait on installing libraries.

Required API:
export function createTienda(spec:TiendaSpec, options:OpcionesTienda):TiendaController.
TiendaSpec is Extract<GameSpec,{mecanica:"tienda"}> imported type from ../../gamespec/src/schema.ts.
OpcionesTienda = {juegoId:string;versionId:string;onEvent?:(evento:EventoMotor)=>void;now?:()=>number;wallNow?:()=>string}.
EventoMotor matches frozen inicio/respuesta/fin, start includes mecanica:"tienda"; inicio has ISO iniciadoEn, juegoId/versionId. respuesta {itemId,criterio,correcto,tiempoMs,intentos}. fin {aciertos,total,duracionMs,completado}.
Controller has start(), drop(productId:string,destination:string|null):ResultadoDrop, next(), pause(), resume(), showHelp(), closeHelp(), finish(), restart(), getSnapshot():TiendaSnapshot, subscribe(listener:()=>void):()=>void.
Snapshot: phase "ready"|"playing"|"item-complete"|"paused"|"help"|"finished"; item (current ItemTienda), itemIndex, totalItems, difficulty ("facil"|"medio"|"avanzado"), placedIds:string[], attempts:number, completedItems:number, target:number, progress:number, completed:boolean. Snapshot must be referentially stable between state changes for useSyncExternalStore.
ResultadoDrop = {kind:"correct"|"wrong"|"ignored"|"cancelled";completed:boolean}.
Use value copies for placedIds snapshots; do not leak mutable state.

Semantics:
start once from ready emits inicio. Doesn't emit on creation/tutorials. drop only playing, valid product available. For clasificar, destination equals product.categoria; for pedido destination is "bolsa", category matches pedido and count quota. null is cancel/no error. Wrong educational target increments attempts (initial1) and doesn't place; already placed ignored. Correct all required products (or exact pedido qty) transitions item-complete and emits ONE respuesta correcto=true with intentos counter and active time. No auto next until next(), allowing UI feedback. next from item-complete resets placed/attempts for next item, or transitions finished and emits one fin completado=true with total resolved items. completing increments completedItems/progress once, progress clamp target from spec.meta or totalItems. All12 remain required even target<12.
pause records prior phase (playing/help/item-complete), resume restores; help only from playing and closeHelp restores. Both exclude time, no timer until start first item. Use monotonic now injection for durations, clamp>=0. ShowHelp while paused ignored.
finish for active execution emits fin completed=false once; total equals completedItems (per design local ruling), aciertos completedItems; no respuesta incomplete. finish before start may just set finished, no events. restart closes active execution incomplete then returns ready, no new inicio until start; resets full state. A completed execution must not emit another fin on finish/restart.
subscribe listener fired after snapshot changes; ignore actions no need notify.
Do not mutate spec. API no network.
Test fixture f1+f3, duplicate drops, wrong/cancel, same p1 subsequent items, completing12 count/event unique, two errors=>intentos3, fake clock pause/help excludes, incomplete finish, restart, target8 clamp while all12 still played. Tests must assert behavior, not mock implementation.
Report at docs/superpowers/plans/2026-11-05-tiendita-engine-report.md with RED/GREEN commands/output counts, files changed, concerns. Return short summary with test result.
