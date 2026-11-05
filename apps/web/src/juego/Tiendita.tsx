import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import fixture from "../../../../fixtures/juegos/n1-tienda.json";
import { validarGameSpec } from "../../../../packages/gamespec/src/validate";
import { createTienda } from "../../../../packages/engine/src/index";
import type { EventoMotor, TiendaSpec } from "../../../../packages/engine/src/types";
import type { TiendaWorld } from "../../../../packages/engine/src/scene";
import { Camion, categorias, estiloCategoria, Icono, Producto } from "./ilustraciones";
import { recursoFaltante, recursosVisuales } from "./recursos";

const validated = validarGameSpec(fixture);
if (!validated.ok || validated.spec.mecanica !== "tienda") throw new Error("El juego de tienda no tiene un formato válido.");
const spec: TiendaSpec = validated.spec;
const MASCOT = "/juego/tiendita/mascota.png";
type Tutorial = "clasificar" | "pedido" | null;
type Drag = { id: string; x: number; y: number; startX: number; startY: number; moved: boolean; pointerId: number; element: HTMLButtonElement };

function Marca() {
  return <span className="shop-brand"><svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M17 2 6 18h9l-1 12 12-18h-9z" fill="currentColor" /></svg><span>BRAIN<b>RUSH</b></span></span>;
}

export function Tiendita() {
  const [events, setEvents] = useState<EventoMotor[]>([]);
  const [controller] = useState(() => createTienda(spec, {
    juegoId: "juego-n1-tienda", versionId: "v1",
    onEvent: event => { setEvents(old => [...old, event]); window.dispatchEvent(new CustomEvent("brainrush:evento", { detail: event })); },
  }));
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot);
  const [screen, setScreen] = useState<"intro" | "game">("intro");
  const [tutorial, setTutorial] = useState<Tutorial>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const dragRef = useRef<Drag | null>(null);
  const suppressClick = useRef(false);
  const [message, setMessage] = useState("");
  const [hint, setHint] = useState<string | null>(null);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [wrongId, setWrongId] = useState<string | null>(null);
  const [sound, setSound] = useState(false);
  const [assetsReady, setAssetsReady] = useState(false);
  const [assetError, setAssetError] = useState<string | null>(() => recursoFaltante(spec));
  const audio = useRef<AudioContext | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const world = useRef<TiendaWorld | null>(null);
  const seenPedido = useRef(false);
  const messageTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reducedMotion = useRef(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const debug = new URLSearchParams(location.search).has("debug");
  const completed = state.phase === "finished";
  const item = state.item;
  const isPedido = item.accion === "pedido";
  const active = screen === "game" && !completed;
  const interactionEnabled = state.phase === "playing" && tutorial === null;

  useEffect(() => {
    let cancelled = false;
    const sources = [MASCOT, "/juego/tiendita/tienda-fondo.png"];
    void Promise.all(sources.map(source => new Promise<void>((resolve, reject) => {
      const image = new Image(); image.onload = () => resolve(); image.onerror = () => reject(new Error(source)); image.src = source;
    }))).then(() => { if (!cancelled) setAssetsReady(true); }).catch((error: Error) => { if (!cancelled) setAssetError(error.message); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!active || !stage.current) return;
    let cancelled = false;
    const el = stage.current;
    void import("../../../../packages/engine/src/scene").then(({ mountTiendaWorld }) => {
      if (!cancelled) { world.current = mountTiendaWorld(el, reducedMotion.current); const phase = controller.getSnapshot().phase; world.current.pause(phase === "paused" || phase === "help"); }
    });
    return () => { cancelled = true; world.current?.destroy(); world.current = null; };
  }, [active, controller]);

  useEffect(() => {
    world.current?.pause(state.phase === "paused" || state.phase === "help");
  }, [state.phase]);

  const clearDrag = useCallback((cancel = true) => {
    const d = dragRef.current;
    dragRef.current = null; setDrag(null);
    if (d) {
      if (cancel) { suppressClick.current = true; setSelected(null); }
      if (d.element.hasPointerCapture(d.pointerId)) d.element.releasePointerCapture(d.pointerId);
    }
  }, []);
  useEffect(() => {
    const onHide = () => { if (document.hidden && ["playing", "item-complete"].includes(controller.getSnapshot().phase)) { clearDrag(); controller.pause(); } };
    document.addEventListener("visibilitychange", onHide);
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        const cancellingSelection = selected !== null || dragRef.current !== null;
        setSelected(null); clearDrag();
        if (!cancellingSelection && controller.getSnapshot().phase === "playing") controller.pause();
      }
    };
    window.addEventListener("keydown", key);
    const blur = () => clearDrag();
    window.addEventListener("blur", blur);
    return () => { document.removeEventListener("visibilitychange", onHide); window.removeEventListener("keydown", key); window.removeEventListener("blur", blur); };
  }, [controller, clearDrag, selected]);

  // Keep keyboard focus in the active explanation/pause, then restore it on close.
  useEffect(() => {
    if (!tutorial && state.phase !== "paused") return;
    const previous = document.activeElement as HTMLElement | null;
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const modal = document.querySelector<HTMLElement>('[role="dialog"]');
      const controls = modal?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], [tabindex="0"]');
      if (!controls?.length) return;
      const first = controls[0]!, last = controls[controls.length - 1]!;
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", trap);
    return () => { document.removeEventListener("keydown", trap); if (previous?.isConnected) previous.focus(); };
  }, [tutorial, state.phase]);

  useEffect(() => () => { if (messageTimer.current) clearTimeout(messageTimer.current); if (hintTimer.current) clearTimeout(hintTimer.current); void audio.current?.close(); }, []);

  // The second action has its own demonstration, while the controller excludes help time.
  useEffect(() => {
    if (screen === "game" && state.phase === "playing" && item.accion === "pedido" && !seenPedido.current) {
      seenPedido.current = true; controller.showHelp(); setTutorial("pedido");
    }
  }, [controller, screen, state.phase, item.accion]);

  useEffect(() => {
    if (state.phase !== "item-complete") return;
    world.current?.loadBox();
    const timer = setTimeout(() => { setSelected(null); controller.next(); }, reducedMotion.current ? 250 : 1000);
    return () => clearTimeout(timer);
  }, [controller, state.phase, state.itemIndex]);

  function chime() {
    if (!sound) return;
    try {
      const ctx = audio.current ??= new AudioContext();
      void ctx.resume();
      for (const [i, hz] of [523.25, 659.25].entries()) {
        const osc = ctx.createOscillator(), gain = ctx.createGain();
        osc.type = "sine"; osc.frequency.value = hz;
        gain.gain.setValueAtTime(.065, ctx.currentTime + i * .09);
        gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + i * .09 + .18);
        osc.connect(gain); gain.connect(ctx.destination); osc.start(ctx.currentTime + i * .09); osc.stop(ctx.currentTime + i * .09 + .2);
      }
    } catch { /* Sound is optional; browser policy must never block the activity. */ }
  }

  function feedback(text: string) {
    if (messageTimer.current) clearTimeout(messageTimer.current);
    setMessage(text);
    messageTimer.current = setTimeout(() => { setMessage(""); setWrongId(null); }, 1800);
  }

  function clearHint() { if (hintTimer.current) clearTimeout(hintTimer.current); setHint(null); }
  function showHint(category: string) { if (hintTimer.current) clearTimeout(hintTimer.current); setHint(category); hintTimer.current = setTimeout(() => setHint(null), 1800); }
  useEffect(() => { clearHint(); }, [state.itemIndex]);
  useEffect(() => { if (state.phase === "paused" || state.phase === "help") clearDrag(); }, [state.phase, clearDrag]);

  function tryDrop(id: string, destination: string | null, point?: { x: number; y: number }) {
    if (!interactionEnabled) return;
    const result = controller.drop(id, destination);
    setSelected(null);
    if (result.kind === "correct") {
      clearHint(); chime(); feedback(result.completed ? "¡Listo! Una caja para el reparto." : "¡Eso es!");
    } else if (result.kind === "wrong") {
      setWrongId(id); if (controller.getSnapshot().attempts >= 3) showHint(isPedido ? item.pedido!.categoria : item.productos.find(p => p.id === id)!.categoria); feedback(isPedido ? "Mira el producto del pedido." : "Busca el mismo dibujo en el estante.");
    }
    if (point && stage.current && result.kind !== "ignored") {
      const r = stage.current.getBoundingClientRect(); world.current?.feedback(point.x - r.left, point.y - r.top, result.kind === "correct");
    }
  }

  function pointerDown(e: ReactPointerEvent<HTMLButtonElement>, id: string) {
    if (!interactionEnabled || e.button !== 0 || !e.isPrimary || dragRef.current) return;
    suppressClick.current = false;
    dragRef.current = { id, x: e.clientX, y: e.clientY, startX: e.clientX, startY: e.clientY, moved: false, pointerId: e.pointerId, element: e.currentTarget };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function pointerMove(e: ReactPointerEvent<HTMLButtonElement>) {
    const d = dragRef.current;
    if (!d || d.pointerId !== e.pointerId) return;
    const moved = d.moved || Math.hypot(e.clientX - d.startX, e.clientY - d.startY) > 7;
    dragRef.current = { ...d, x: e.clientX, y: e.clientY, moved };
    if (moved) setDrag(dragRef.current);
  }
  function pointerUp(e: ReactPointerEvent<HTMLButtonElement>) {
    const d = dragRef.current;
    if (!d || d.pointerId !== e.pointerId) return;
    if (d.moved) {
      suppressClick.current = true;
      const target = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>("[data-destination]");
      tryDrop(d.id, target?.dataset.destination ?? null, { x: e.clientX, y: e.clientY });
    }
    clearDrag(false);
  }

  function begin() {
    clearDrag(); clearHint(); controller.restart(); setScreen("game"); setSelected(null); setMessage(""); setWrongId(null); seenPedido.current = false; setTutorial("clasificar");
  }
  function closeTutorial() {
    if (controller.getSnapshot().phase === "help") { if (isPedido) showHint(item.pedido!.categoria); else { const p = item.productos.find(p => p.id === (selected ?? wrongId)); if (p) showHint(p.categoria); } }
    setTutorial(null);
    if (controller.getSnapshot().phase === "ready") controller.start(); else controller.closeHelp();
  }
  function help() {
    if (state.phase !== "playing") return;
    if (isPedido) showHint(item.pedido!.categoria); else if (selected) { const p = item.productos.find(p => p.id === selected); if (p) showHint(p.categoria); }
    controller.showHelp(); setTutorial(isPedido ? "pedido" : "clasificar");
  }
  function exit() { controller.finish(); clearDrag(); setTutorial(null); setScreen("intro"); setSelected(null); }
  function downloadEvents() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(events, null, 2)], { type: "application/json" }));
    const a = document.createElement("a"); a.href = url; a.download = "brain-rush-tiendita-eventos.json"; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const activeProduct = drag ? item.productos.find(p => p.id === drag.id) : undefined;

  if (assetError) return <main className="result-screen" role="alert"><Marca /><h1>No pudimos abrir la tienda.</h1><p>Falta un recurso de la tienda. Vuelve a intentarlo.</p>{debug && <code>{assetError}</code>}<button className="primary-button" onClick={() => location.reload()}>Volver a intentar</button></main>;

  return <div className={`shop-app ${screen === "intro" ? "is-intro" : ""}`}>
    <header className="shop-header">
      <a href="/" className="brand-link" aria-label="BRAIN RUSH, página principal" onClick={e => { if (active) { e.preventDefault(); clearDrag(); controller.pause(); } }}><Marca /></a>
      <span className="local-label"><span /> Prueba local</span>
      {screen === "game" && !completed ? <div className="hud-controls">
        <button className="icon-button" aria-label="Repetir explicación" onClick={help} disabled={!interactionEnabled}><Icono nombre="help" /></button>
        <button className="icon-button" aria-label={sound ? "Apagar sonido" : "Activar sonido"} aria-pressed={sound} onClick={() => setSound(!sound)}><Icono nombre={sound ? "sound" : "mute"} /></button>
        <button className="icon-button" aria-label="Pausar juego" onClick={() => { clearDrag(); controller.pause(); }} disabled={state.phase === "ready" || !!tutorial}><Icono nombre="pause" /></button>
      </div> : <a className="back-school" href="/">Volver a la escuela <Icono nombre="arrow" size={18} /></a>}
    </header>

    {screen === "intro" ? <main className="shop-intro">
      <section className="intro-copy">
        <div className="age-tag">1.º y 2.º de primaria <span>·</span> Matemática</div>
        <h1>La <span>tiendita.</span></h1>
        <p className="intro-description">Pequeñas manos.<br /> Grandes descubrimientos.</p>
        <p className="intro-explain">Ordena los productos, prepara los pedidos<br className="desktop-break" /> y ayuda a llenar el camión.</p>
        <button className="primary-button play-button" onClick={begin} disabled={!assetsReady}><Icono nombre="play" /> {assetsReady ? "¡A jugar!" : "Preparando la tienda…"} <Icono nombre="arrow" /></button>
        <div className="play-method"><Icono nombre="hand" size={20} /><span>Arrastra o toca. Tú eliges.</span></div>
        <div className="intro-bottom"><span>12 actividades</span><i /> Sin prisa, a tu ritmo.</div>
      </section>
      <section className="intro-art" aria-label="La mascota te da la bienvenida a la tienda">
        <div className="art-arch"><div className="intro-awning" /><div className="shop-sign">¡ABIERTO!</div><div className="art-floor" /></div>
        <div className="intro-shelf"><Producto categoria="aguas" /><Producto categoria="jugos" /><Producto categoria="gaseosas" /></div>
        <img className="intro-mascot" src={MASCOT} alt="Nuestra mascota verde te saluda" />
        <div className="order-ticket"><span>Un pedido para ti</span><div><b>3</b><span>×</span><Producto categoria="aguas" /></div></div>
        <div className="intro-truck"><Camion /><span>¡Preparamos el reparto!</span></div>
        <svg className="art-star star-a" viewBox="0 0 40 40" aria-hidden="true"><path d="m20 0 5 15 15 5-15 5-5 15-5-15L0 20l15-5z" fill="currentColor" /></svg>
        <svg className="art-star star-b" viewBox="0 0 40 40" aria-hidden="true"><path d="m20 0 5 15 15 5-15 5-5 15-5-15L0 20l15-5z" fill="currentColor" /></svg>
      </section>
    </main> : completed ? <main className="result-screen">
      <div className="result-art"><img src={MASCOT} alt="La mascota celebra contigo" /><div className="result-stars">{[0, 1, 2].map(n => <Icono key={n} nombre="star" size={48} />)}</div></div>
      <h1>{state.completed ? "¡Reparto listo!" : "¡Buen trabajo!"}</h1>
      <p>{state.completed ? "Ordenaste, contaste y ayudaste a llenar el camión." : "Cada pequeño paso cuenta. Podemos volver a intentarlo."}</p>
      <div className="result-truck"><Camion lleno /><span>{state.completedItems} actividades completadas</span></div>
      <button className="primary-button" onClick={begin}><Icono nombre="play" /> Volver a jugar</button>
      <button className="text-button" onClick={exit}>Volver al inicio</button>
    </main> : <main className="play-screen">
      <div className="game-heading">
        <div className="heading-main"><span className="game-title">La tiendita</span><h1>{isPedido ? "¡Preparamos un pedido!" : "Cada cosa en su lugar."}</h1></div>
        <div className={`truck-progress ${state.phase === "item-complete" ? "box-loaded" : ""}`}><Camion lleno={state.progress > 0} /><div><span>Nuestro reparto</span><strong>{state.progress}<small> / {state.target}</small></strong><div className="progress-track" role="progressbar" aria-label="Avance del reparto local" aria-valuemin={0} aria-valuemax={state.target} aria-valuenow={state.progress}><i style={{ width: `${Math.min(state.progress / state.target, 1) * 100}%` }} /></div></div></div>
      </div>
      <section className={`game-stage ${isPedido ? "is-order" : "is-sort"}`} data-paused={state.phase === "paused" || state.phase === "help" ? "true" : "false"} aria-label={isPedido ? "Preparar el pedido" : "Clasificar productos"}>
        <div className="world-canvas" ref={stage} aria-hidden="true" />
        <div className="store-awning" aria-hidden="true" />
        <div className="guide-caption"><img src={MASCOT} alt="" /><span>{message || (selected ? "Ahora toca su destino." : isPedido ? "¡Contamos juntos!" : "¡Cada uno a su casita!")}</span></div>
        <div className="play-layout">
          <div className="round-instruction"><span className="action-symbol"><Icono nombre="hand" size={19} /></span><span>{isPedido ? "Lleva el pedido a la bolsa." : "Lleva cada producto a su estante."}</span></div>
          {isPedido ? <div className="order-scene">
            <div className={`request-board ${hint === item.pedido!.categoria ? "show-category" : ""}`}><span>El pedido</span><div className="request-quantity"><b>{item.pedido!.cantidad}</b><span>×</span><Producto categoria={recursosVisuales[item.consigna?.asset ?? item.productos.find(p => p.categoria === item.pedido!.categoria)!.asset]!} /></div><div className="count-dots" aria-label={`${state.placedIds.length} de ${item.pedido!.cantidad} productos`}>{Array.from({ length: item.pedido!.cantidad }, (_, n) => <i className={n < state.placedIds.length ? "is-filled" : ""} key={n} />)}</div></div>
            <button className={`shopping-bag ${selected ? "can-receive" : ""}`} data-destination="bolsa" data-testid="destino-bolsa" aria-label={`Bolsa para ${item.pedido!.cantidad} productos de ${categorias[recursosVisuales[item.consigna?.asset ?? item.productos.find(p => p.categoria === item.pedido!.categoria)!.asset]!]!.singular}`} disabled={!interactionEnabled} onClick={e => { if (selected) tryDrop(selected, "bolsa", { x: e.clientX, y: e.clientY }); }}>
              <span className="bag-handle" /><span className="bag-body"><span className="bag-products">{Array.from({ length: item.pedido!.cantidad }, (_, n) => <span key={n} className={`bag-slot ${n < state.placedIds.length ? "is-filled" : ""}`}><Producto categoria={recursosVisuales[item.consigna?.asset ?? item.productos.find(p => p.categoria === item.pedido!.categoria)!.asset]!} /></span>)}</span><span className="bag-count">{state.placedIds.length} <small>/ {item.pedido!.cantidad}</small></span></span>
            </button>
          </div> : <div className="shelves" style={{ "--shelf-count": item.estanterias.length } as CSSProperties}>
            {item.estanterias.map(shelf => {
              const placed = item.productos.filter(p => p.categoria === shelf.id && state.placedIds.includes(p.id));
              return <button key={shelf.id} className={`shelf ${selected ? "can-receive" : ""} ${hint === shelf.id ? "show-category" : ""}`} data-destination={shelf.id} data-testid={`destino-${shelf.id}`} style={estiloCategoria(recursosVisuales[shelf.asset]!)} aria-label={`Estante de ${categorias[recursosVisuales[shelf.asset]!]!.nombre}`} disabled={!interactionEnabled} onClick={e => { if (selected) tryDrop(selected, shelf.id, { x: e.clientX, y: e.clientY }); }}>
                <span className="shelf-label"><Producto categoria={recursosVisuales[shelf.asset]!} /><span>{categorias[recursosVisuales[shelf.asset]!]!.nombre}</span></span><span className="shelf-space"><span className="shelf-silhouette"><Producto categoria={recursosVisuales[shelf.asset]!} /></span><span className="shelved-products">{placed.map(p => <Producto key={p.id} categoria={recursosVisuales[p.asset]!} />)}</span></span><span className="shelf-plank" />
              </button>;
            })}
          </div>}
          <div className="product-counter"><div className="counter-caption"><span>{isPedido ? "Elige y cuenta" : "Vamos a ordenar"}</span><span className="round-count">{state.itemIndex + 1} <small>de {state.totalItems}</small></span></div>
            <div className="product-tray">{item.productos.map(p => {
              const placed = state.placedIds.includes(p.id);
              return <button key={`${state.itemIndex}:${p.id}`} className={`product-token ${selected === p.id ? "is-selected" : ""} ${placed ? "is-placed" : ""} ${wrongId === p.id ? "is-wrong" : ""} ${drag?.id === p.id ? "is-dragging" : ""}`} style={estiloCategoria(recursosVisuales[p.asset]!)} data-product-id={p.id} data-category={p.categoria} aria-label={`${categorias[recursosVisuales[p.asset]!]!.nombre}, producto ${p.id.slice(1)}`} aria-pressed={selected === p.id} disabled={!interactionEnabled || placed} onPointerDown={e => pointerDown(e, p.id)} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={e => { if (dragRef.current?.pointerId === e.pointerId) clearDrag(); }} onLostPointerCapture={e => { if (dragRef.current?.pointerId === e.pointerId) clearDrag(); }} onClick={e => {
                if (dragRef.current && dragRef.current.id !== p.id) return;
                if ((e.detail === 0 || !suppressClick.current) && interactionEnabled) setSelected(selected === p.id ? null : p.id);
                suppressClick.current = false;
              }}>
                <Producto categoria={recursosVisuales[p.asset]!} />{placed && <span className="placed-mark"><Icono nombre="check" size={18} /></span>}
              </button>;
            })}</div>
          </div>
        </div>
        <div className={`feedback-bubble ${message ? "is-visible" : ""}`} role="status" aria-live="polite">{message}</div>
        {state.phase === "item-complete" && <div className="round-success"><Icono nombre="check" size={28} /><span>¡Muy bien!</span></div>}
      </section>
      <div className="play-footer"><div className="difficulty-path">{["facil", "medio", "avanzado"].map((difficulty, i) => <span key={difficulty} className={state.difficulty === difficulty ? "is-current" : ""}><i>{i + 1}</i>{["Primer reparto", "Más pedidos", "¡Gran reparto!"][i]}</span>)}</div><span className="no-rush">Sin prisa. ¡Tú puedes!</span></div>
    </main>}

    {tutorial && screen === "game" && <div className="modal-scrim"><section className="game-modal tutorial-modal" role="dialog" aria-modal="true" aria-labelledby="tutorial-title">
      <button className="modal-close icon-button" aria-label="Cerrar explicación" onClick={closeTutorial}><Icono nombre="close" /></button>
      <div className="tutorial-demo" aria-hidden="true"><div className="tutorial-product"><Producto categoria="aguas" /><Icono nombre="hand" /></div><span className="tutorial-arrow"><Icono nombre="arrow" size={32} /></span><div className={`tutorial-target ${tutorial === "pedido" ? "target-bag" : ""}`}>{tutorial === "pedido" ? <><span>3</span><Producto categoria="aguas" /></> : <Producto categoria="aguas" />}</div></div>
      <h2 id="tutorial-title">{tutorial === "pedido" ? "¡A preparar el pedido!" : "Cada producto tiene su lugar."}</h2>
      <p>{tutorial === "pedido" ? "Mira cuántos pide. Llévalos a la bolsa." : "Busca el mismo dibujo. Arrastra o toca."}</p>
      <button className="primary-button" onClick={closeTutorial} autoFocus>¡Lo tengo! <Icono nombre="arrow" /></button>
      <span className="tutorial-reassurance">Puedes pedir ayuda cuando quieras.</span>
    </section></div>}

    {state.phase === "paused" && screen === "game" && !tutorial && <div className="modal-scrim"><section className="game-modal pause-modal" role="dialog" aria-modal="true" aria-labelledby="pause-title">
      <img src={MASCOT} alt="" /><h2 id="pause-title">Una pequeña pausa.</h2><p>Tu tienda te espera. Seguimos cuando quieras.</p>
      <button className="primary-button" onClick={() => controller.resume()} autoFocus><Icono nombre="play" /> Seguir jugando</button>
      <button className="secondary-button" onClick={begin}>Empezar de nuevo</button><button className="text-button" onClick={exit}>Volver al inicio</button>
    </section></div>}

    {drag?.moved && activeProduct && <div className="drag-ghost" style={{ left: drag.x, top: drag.y }} aria-hidden="true"><Producto categoria={recursosVisuales[activeProduct.asset]!} /></div>}
    <footer className="shop-bottom"><span>BRAIN RUSH <span className="footer-dot">·</span> Aprender también es jugar.</span><span>Hecho para pequeñas grandes mentes.</span></footer>
    {debug && <details className="event-debug"><summary>Registro de prueba · {events.length} eventos</summary><button onClick={downloadEvents}>Descargar eventos JSON</button><pre>{JSON.stringify(events, null, 2)}</pre></details>}
  </div>;
}
