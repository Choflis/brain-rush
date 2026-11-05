# La tiendita — informe del controlador puro

Implementado el contrato de `createTienda` sin DOM, red ni dependencia de Phaser. API exportada desde `packages/engine/src/index.ts`, con los tipos congelados del brief.

## Evidencia TDD

RED, antes de implementar:

```text
node --experimental-strip-types --test packages/engine/tests/tienda.test.ts
tests 17
pass 0
fail 17
exit 1
AssertionError: the engine must expose createTienda
actual 'undefined'; expected 'function'
```

GREEN, después de implementar:

```text
node --experimental-strip-types --test packages/engine/tests/tienda.test.ts
tests 17
pass 17
fail 0
cancelled 0
skipped 0
exit 0
```

Validación adicional:

```text
npm run typecheck -w packages/engine
tsc --noEmit
exit 0

git diff --check -- packages/engine/src/types.ts packages/engine/src/tienda.ts packages/engine/src/index.ts packages/engine/tests/tienda.test.ts packages/engine/tsconfig.json
sin errores
exit 0
```

Suite global ejecutada:

```text
npm test
> npm run test --workspaces --if-present
> @brain-rush/gamespec@0.0.0 test
> node --test test/
Could not find 'test/'
exit 1
```

El fallo global está en el destino del script de gamespec, fuera del alcance de este trabajo; no se modificó su paquete ni sus pruebas.

## Archivos modificados

- `packages/engine/src/types.ts`: tipos de eventos, opciones, resultado, controlador y snapshot.
- `packages/engine/src/tienda.ts`: máquina de estados pura y cronometraje inyectable.
- `packages/engine/src/index.ts`: exports públicos.
- `packages/engine/tests/tienda.test.ts`: 20 pruebas con fixture real y reloj determinista tras las regresiones de revisión.
- `packages/engine/tsconfig.json`: configuración del chequeo de tipos para fuente y pruebas.
- Este informe, autorizado expresamente por el brief.

## Cobertura y decisiones

Las pruebas cubren f1 y f3, duplicados, errores y cancelación, reutilización de IDs entre ítems, las 12 respuestas y un único fin, dos errores con intentos=3, pausa/ayuda anidadas, restauración de item-complete, abandono y reinicio, meta=8 sin omitir ítems, identidad estable del snapshot, desuscripción y ausencia de mutaciones del spec.

`progress` cuenta ítems resueltos y se limita a `target`; `completed` se activa al ejecutar `next()` tras el último ítem. La duración global suma solo los segmentos de juego de los ítems, incluida la parte jugada de un ítem abandonado; excluye ayuda, pausa y espera en item-complete. Esta última interpretación fue confirmada por el orquestador y tiene una aserción de 140 ms frente a una espera de varios segundos.

El GameSpec se asume previamente validado. No se añadieron validadores paralelos ni modificaciones al schema. `Nivel` en el schema actual infiere `items` como desconocidos; el controlador usa el tipo exportado `ItemTienda` al aplanar esos ítems, sin cambiar el contrato.

Sin commits, cambios de dependencias ni lockfile por este agente.

## Corrección tras revisión: aislamiento profundo del snapshot

La revisión identificó que `item` compartía referencia con las reglas internas. Se añadió primero una regresión que cambia la categoría de p1, elimina productos y estanterías, añade un ID a `placedIds` y altera la categoría/cantidad del pedido f3. La prueba exige que las ubicaciones correctas originales y la cuota de tres aguas sigan funcionando y que el spec original permanezca intacto.

RED de la regresión antes de corregir:

```text
node --experimental-strip-types --test --test-name-pattern='mutating snapshot' packages/engine/tests/tienda.test.ts
tests 1
pass 0
fail 1
exit 1
AssertionError: drop de p1 en gaseosas devuelve kind 'wrong'; esperado 'correct'
```

La corrección clona profundamente `item` al publicar cada snapshot. `getSnapshot()` conserva la misma referencia entre cambios de estado y el estado interno queda separado de todas las propiedades anidadas expuestas.

GREEN final:

```text
node --experimental-strip-types --test packages/engine/tests/tienda.test.ts
tests 18
pass 18
fail 0
exit 0

npm run typecheck -w packages/engine
tsc --noEmit
exit 0
```

`git diff --check` sin errores. Se repitió `npm test`: persiste el fallo ajeno en `@brain-rush/gamespec` por `node --test test/` con `Could not find 'test/'`, exit 1. Esta corrección solo modificó `tienda.ts`, `tienda.test.ts` y este informe; sin commits.

## Corrección tras revisión: milisegundos enteros y límite por ítem

Se añadieron primero dos regresiones para el contrato 08 §10: reloj fraccionario con entradas 0.25 y 1.75 ms, segmentos separados por pausa y dos ítems; y un ítem de 3 600 500.75 ms.

RED antes de corregir:

```text
node --experimental-strip-types --test --test-name-pattern='emitted times|response time is capped' packages/engine/tests/tienda.test.ts
tests 2
pass 0
fail 2
exit 1
Number.isInteger(respuesta.tiempoMs) devolvió false.
tiempoMs devolvió 3600500.75; esperado 3600000.
```

La emisión ahora redondea y limita a cero los tiempos de respuesta y fin. Solo `respuesta.tiempoMs` aplica además el máximo contractual de 3 600 000. Los acumuladores internos conservan fracciones; por ejemplo, ítems de 1.5 y 0.5 ms emiten respuestas de 2 y 1 ms pero fin de 2 ms. El fin conserva la duración total real redondeada sin el tope de una hora, porque el contrato limita el tiempo de cada ítem, no la duración de toda la ejecución. Por ello, tras ítems muy largos o por redondeo, la suma de los tiempos emitidos puede diferir de `duracionMs`; esto preserva la precisión del acumulador de ejecución.

GREEN final:

```text
node --experimental-strip-types --test packages/engine/tests/tienda.test.ts
tests 20
pass 20
fail 0
exit 0

npm run typecheck -w packages/engine
tsc --noEmit
exit 0
```

Se repitió `npm test`: motor 20/20 correcto; sigue fallando el script de gamespec por el destino `test/` no encontrado, exit 1. Solo `tienda.ts`, `tienda.test.ts` y este informe cambiaron durante esta corrección; sin commits.
