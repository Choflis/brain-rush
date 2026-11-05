import type { FaseTienda, ItemTienda, OpcionesTienda, ResultadoDrop, TiendaController, TiendaSnapshot, TiendaSpec } from "./types.ts";

/** Pure game state: rendering, input devices and persistence belong to the host. */
export function createTienda(spec: TiendaSpec, options: OpcionesTienda): TiendaController {
  const rounds = spec.niveles.flatMap((level) => (level.items as ItemTienda[]).map((item) => ({
    item: structuredClone(item), difficulty: level.dificultad,
  })));
  const target = spec.meta?.objetivo ?? rounds.length;
  const now = options.now ?? (() => performance.now());
  const wallNow = options.wallNow ?? (() => new Date().toISOString());
  const listeners = new Set<() => void>();
  let phase: FaseTienda = "ready";
  let priorPhase: "playing" | "help" | "item-complete" = "playing";
  let itemIndex = 0;
  let placedIds: string[] = [];
  let attempts = 1;
  let completedItems = 0;
  let completed = false;
  let activeExecution = false;
  let runningSince: number | null = null;
  let itemTime = 0;
  let totalTime = 0;

  function buildSnapshot(): TiendaSnapshot {
    return {
      phase, item: structuredClone(rounds[itemIndex]!.item), difficulty: rounds[itemIndex]!.difficulty,
      itemIndex, totalItems: rounds.length, placedIds: [...placedIds], attempts,
      completedItems, target, progress: Math.min(completedItems, target), completed,
    };
  }
  let snapshot = buildSnapshot();

  function publish() {
    snapshot = buildSnapshot();
    for (const listener of [...listeners]) listener();
  }

  // Stop a running segment once so nested pause/help never double-count it.
  function stopClock() {
    if (runningSince === null) return;
    const elapsed = Math.max(0, now() - runningSince);
    itemTime += elapsed;
    totalTime += elapsed;
    runningSince = null;
  }

  function finishExecution(completado: boolean) {
    stopClock();
    const shouldEmit = activeExecution;
    activeExecution = false;
    phase = "finished";
    completed = completado;
    publish();
    if (shouldEmit) options.onEvent?.({ tipo: "fin", aciertos: completedItems, total: completedItems, duracionMs: Math.max(0, Math.round(totalTime)), completado });
  }

  return {
    start() {
      if (phase !== "ready") return;
      phase = "playing";
      activeExecution = true;
      runningSince = now();
      publish();
      options.onEvent?.({ tipo: "inicio", juegoId: options.juegoId, versionId: options.versionId, mecanica: "tienda", iniciadoEn: wallNow() });
    },
    drop(productId, destination): ResultadoDrop {
      if (phase !== "playing") return { kind: "ignored", completed: false };
      const item = rounds[itemIndex]!.item;
      const product = item.productos.find((candidate) => candidate.id === productId);
      if (!product || placedIds.includes(productId)) return { kind: "ignored", completed: false };
      if (destination === null) return { kind: "cancelled", completed: false };
      const correct = item.accion === "clasificar"
        ? destination === product.categoria
        : destination === "bolsa" && product.categoria === item.pedido?.categoria && placedIds.length < (item.pedido?.cantidad ?? 0);
      if (!correct) {
        attempts++;
        publish();
        return { kind: "wrong", completed: false };
      }
      placedIds.push(productId);
      const itemComplete = placedIds.length === (item.accion === "clasificar" ? item.productos.length : item.pedido!.cantidad);
      if (itemComplete) {
        stopClock();
        phase = "item-complete";
        completedItems++;
      }
      publish();
      if (itemComplete) options.onEvent?.({ tipo: "respuesta", itemId: item.id, criterio: item.criterio, correcto: true, tiempoMs: Math.min(3_600_000, Math.max(0, Math.round(itemTime))), intentos: attempts });
      return { kind: "correct", completed: itemComplete };
    },
    next() {
      if (phase !== "item-complete") return;
      if (itemIndex === rounds.length - 1) {
        finishExecution(true);
        return;
      }
      itemIndex++;
      placedIds = [];
      attempts = 1;
      itemTime = 0;
      phase = "playing";
      runningSince = now();
      publish();
    },
    pause() {
      if (phase !== "playing" && phase !== "help" && phase !== "item-complete") return;
      priorPhase = phase;
      stopClock();
      phase = "paused";
      publish();
    },
    resume() {
      if (phase !== "paused") return;
      phase = priorPhase;
      if (phase === "playing") runningSince = now();
      publish();
    },
    showHelp() {
      if (phase !== "playing") return;
      stopClock();
      phase = "help";
      publish();
    },
    closeHelp() {
      if (phase !== "help") return;
      phase = "playing";
      runningSince = now();
      publish();
    },
    finish() {
      if (phase !== "finished") finishExecution(false);
    },
    restart() {
      if (activeExecution) finishExecution(false);
      if (phase === "ready") return;
      phase = "ready";
      priorPhase = "playing";
      itemIndex = 0;
      placedIds = [];
      attempts = 1;
      completedItems = 0;
      completed = false;
      runningSince = null;
      itemTime = 0;
      totalTime = 0;
      publish();
    },
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
  };
}
