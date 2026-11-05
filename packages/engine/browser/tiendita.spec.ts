import { test, expect, type Page } from "@playwright/test";
import fixture from "../../../fixtures/juegos/n1-tienda.json" with { type: "json" };
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const shots = process.env.BRAINRUSH_SCREENSHOT_DIR ?? fileURLToPath(new URL("../../../docs/qa/tiendita/", import.meta.url));
type BrowserEvent = { tipo: string; itemId?: string; intentos?: number; completado?: boolean; total?: number };
const rounds = fixture.niveles.flatMap(n => n.items);

async function open(page: Page, debug = false) {
  await page.addInitScript(() => {
    const w = window as unknown as { gameEvents: unknown[] };
    w.gameEvents = [];
    window.addEventListener("brainrush:evento", e => w.gameEvents.push((e as CustomEvent).detail));
  });
  await page.goto(`/tiendita.html${debug ? "?debug=1" : ""}`);
  await expect(page.getByRole("heading", { name: "La tiendita." })).toBeVisible();
}
async function start(page: Page) {
  await page.getByRole("button", { name: "¡A jugar!" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "¡Lo tengo!" }).click();
  await expect(page.locator(".round-count")).toHaveText("1 de 12");
}
async function events(page: Page): Promise<BrowserEvent[]> {
  return page.evaluate(() => (window as unknown as { gameEvents: BrowserEvent[] }).gameEvents);
}
async function solve(page: Page, index: number) {
  const item = rounds[index]!;
  await expect(page.locator(".round-count")).toHaveText(`${index + 1} de 12`);
  if (index === 2) await page.getByRole("button", { name: "¡Lo tengo!" }).click();
  const pedido = "pedido" in item ? item.pedido : undefined;
  const products = pedido ? item.productos.filter(p => p.categoria === pedido.categoria).slice(0, pedido.cantidad) : item.productos;
  for (const p of products) {
    await page.locator(`[data-product-id="${p.id}"]`).click();
    await page.locator(`[data-destination="${pedido ? "bolsa" : p.categoria}"]`).click();
  }
  const quantity = item.accion === "clasificar" && index >= 8 ? item.productos.length : pedido?.cantidad ?? item.productos.filter(p => p.categoria === item.estanterias[0]!.id).length;
  await page.getByRole("button", { name: `Etiqueta ${quantity}`, exact: true }).click();
  await page.getByRole("button", { name: /^Pegar etiqueta/ }).click();
}

test.beforeAll(async () => { await mkdir(shots, { recursive: true }); });

test("portada y recursos reales, luego partida completa de 12 actividades", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", e => errors.push(e.message));
  await open(page);
  await expect.poll(() => page.locator(".intro-mascot img").evaluate((el: HTMLImageElement) => el.naturalWidth)).toBeGreaterThan(0);
  await page.screenshot({ path: `${shots}/portada-desktop.png`, fullPage: true });
  await start(page);
  await expect(page.locator('.world-canvas[data-ready="true"]')).toBeAttached();
  await page.screenshot({ path: `${shots}/clasificacion-desktop.png`, fullPage: true });
  for (let i = 0; i < rounds.length; i++) await solve(page, i);
  await expect(page.getByRole("heading", { name: "¡Reparto listo!" })).toBeVisible();
  const log = await events(page);
  expect(log.filter(e => e.tipo === "inicio")).toHaveLength(1);
  expect(log.filter(e => e.tipo === "respuesta")).toHaveLength(12);
  expect(new Set(log.filter(e => e.tipo === "respuesta").map(e => e.itemId)).size).toBe(12);
  expect(log.filter(e => e.tipo === "fin")).toEqual([expect.objectContaining({ completado: true, total: 12 })]);
  await expect(page.locator(".teacher-report")).toBeVisible();
  await page.locator(".teacher-report summary").click();
  await expect(page.locator(".teacher-report tbody tr")).toHaveCount(2);
  await expect(page.getByRole("button", { name: "Descargar evidencias curriculares" })).toBeVisible();
  expect(errors).toEqual([]);
  await page.screenshot({ path: `${shots}/final-desktop.png`, fullPage: true });
});

test("arrastre real, error educativo y pausa con reanudación", async ({ page }) => {
  await open(page); await start(page);
  await page.locator('[data-product-id="p1"]').click();
  await page.locator('[data-destination="aguas"]').click();
  await expect(page.locator('[data-product-id="p1"]')).toBeEnabled();
  await expect(page.getByRole("status")).toHaveText("Busca el mismo dibujo en el estante.");
  const product = await page.locator('[data-product-id="p1"]').boundingBox();
  const shelf = await page.locator('[data-destination="gaseosas"]').boundingBox();
  expect(product).not.toBeNull(); expect(shelf).not.toBeNull();
  await page.mouse.move(product!.x + product!.width / 2, product!.y + product!.height / 2);
  await page.mouse.down();
  await page.mouse.move(shelf!.x + shelf!.width / 2, shelf!.y + shelf!.height / 2, { steps: 12 });
  await page.mouse.up();
  await expect(page.locator('[data-product-id="p1"]')).toBeDisabled();
  await page.getByRole("button", { name: "Pausar juego" }).click();
  await expect(page.getByRole("heading", { name: "Una pequeña pausa." })).toBeVisible();
  await page.getByRole("button", { name: "Seguir jugando" }).click();
  await expect(page.locator('[data-product-id="p1"]')).toBeDisabled();
  for (const p of rounds[0]!.productos.slice(1)) {
    await page.locator(`[data-product-id="${p.id}"]`).click();
    await page.locator(`[data-destination="${p.categoria}"]`).click();
  }
  expect((await events(page)).find(e => e.tipo === "respuesta")).toMatchObject({ itemId: "f1", intentos: 2 });
});

test("pedido pictográfico, ayuda y exportación del registro", async ({ page }) => {
  await open(page, true); await start(page); await solve(page, 0); await solve(page, 1);
  await expect(page.getByRole("heading", { name: "¡A preparar el pedido!" })).toBeVisible();
  await page.getByRole("button", { name: "¡Lo tengo!" }).click();
  await expect(page.locator(".request-quantity b")).toHaveText("3");
  await page.locator('[data-product-id="p1"]').click(); await page.locator('[data-destination="bolsa"]').click();
  await expect(page.locator(".bag-slot.is-filled")).toHaveCount(1);
  await page.getByRole("button", { name: "Repetir explicación" }).click();
  await page.getByRole("button", { name: "¡Lo tengo!" }).click();
  await expect(page.locator(".bag-slot.is-filled")).toHaveCount(1);
  await page.screenshot({ path: `${shots}/pedido-desktop.png`, fullPage: true });
  await page.locator(".event-debug summary").click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Descargar eventos JSON" }).click();
  expect((await download).suggestedFilename()).toBe("brain-rush-tiendita-eventos.json");
});

test("un recurso ausente informa el problema y no inicia una partida", async ({ page }) => {
  await page.route("**/juego/tiendita/mascota.png", route => route.abort());
  await page.goto("/tiendita.html");
  await expect(page.getByRole("heading", { name: "No pudimos abrir la tienda." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Volver a intentar" })).toBeVisible();
  await expect(page.locator(".game-stage")).toHaveCount(0);
});

test("teclado: producto, destino y foco dentro de la ayuda", async ({ page }) => {
  await open(page); await start(page);
  await page.locator('[data-product-id="p1"]').focus(); await page.keyboard.press("Enter");
  await expect(page.locator('[data-product-id="p1"]')).toHaveAttribute("aria-pressed", "true");
  await page.locator('[data-destination="gaseosas"]').focus(); await page.keyboard.press("Enter");
  await expect(page.locator('[data-product-id="p1"]')).toBeDisabled();
  await page.getByRole("button", { name: "Repetir explicación" }).click();
  await page.getByRole("button", { name: "¡Lo tengo!" }).focus(); await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Cerrar explicación" })).toBeFocused();
});

test.describe("teléfono táctil", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  test("controles táctiles, 10 productos visibles y sin desbordamiento", async ({ page }) => {
    await open(page);
    await page.screenshot({ path: `${shots}/portada-mobile.png`, fullPage: true });
    await start(page);
    for (let i = 0; i < 8; i++) await solve(page, i);
    await expect(page.locator(".round-count")).toHaveText("9 de 12");
    await expect(page.locator(".product-token")).toHaveCount(10);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const sizes = await page.locator(".product-token").evaluateAll(nodes => nodes.map(n => { const r = n.getBoundingClientRect(); return { width: r.width, height: r.height }; }));
    expect(sizes.every(s => s.width >= 56 && s.height >= 56)).toBe(true);
    const p = await page.locator('[data-product-id="p1"]').boundingBox();
    await page.touchscreen.tap(p!.x + p!.width / 2, p!.y + p!.height / 2);
    const d = await page.locator('[data-destination="gaseosas"]').boundingBox();
    await page.touchscreen.tap(d!.x + d!.width / 2, d!.y + d!.height / 2);
    await expect(page.locator('[data-product-id="p1"]')).toBeDisabled();
    await page.screenshot({ path: `${shots}/clasificacion-mobile.png`, fullPage: true });
  });
});

test("cancelar arrastre con Escape y aislar punteros", async ({ page }) => {
  await open(page); await start(page);
  const p = page.locator('[data-product-id="p1"]');
  const box = (await p.boundingBox())!;
  await page.mouse.move(box.x + 25, box.y + 25); await page.mouse.down();
  await page.mouse.move(box.x + 45, box.y + 45);
  await p.dispatchEvent('pointermove', { pointerId: 99, isPrimary: false, clientX: 0, clientY: 0 });
  await p.dispatchEvent('pointerup', { pointerId: 99, isPrimary: false, clientX: 0, clientY: 0 });
  await page.locator('[data-product-id="p2"]').dispatchEvent('click', { detail: 1 });
  await expect(page.locator('[data-product-id="p2"]')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('.drag-ghost')).toBeVisible();
  await page.keyboard.press('Escape'); await page.mouse.up();
  await expect(p).toHaveAttribute('aria-pressed', 'false');
  await expect(p).toBeEnabled(); await expect(page.getByRole('status')).toHaveText('');
});

test("pista única temporal y tablero pausado", async ({ page }) => {
  await open(page); await start(page);
  for (let i = 0; i < 2; i++) { await page.locator('[data-product-id="p1"]').click(); await page.locator('[data-destination="aguas"]').click(); }
  await expect(page.locator('.shelf.show-category')).toHaveCount(1);
  await expect(page.locator('[data-destination="gaseosas"]')).toHaveClass(/show-category/);
  await expect(page.locator('.shelf.show-category')).toHaveCount(0, { timeout: 3000 });
  await page.getByRole('button', { name: 'Pausar juego' }).click();
  await expect(page.locator('.game-stage')).toHaveAttribute('data-paused', 'true');
});

test('horizontal: diez productos y destinos visibles', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await open(page); await start(page);
  for (let i = 0; i < 8; i++) await solve(page, i);
  await expect(page.locator('.product-token')).toHaveCount(10);
  const rects = await page.locator('.product-token, .shelf').evaluateAll(nodes => nodes.map(n => { const r = n.getBoundingClientRect(); return { x: r.x, y: r.y, right: r.right, bottom: r.bottom, width: r.width, height: r.height }; }));
  expect(rects.every(r => r.x >= 0 && r.y >= 0 && r.right <= 844 && r.bottom <= 390 && r.width >= 56 && r.height >= 56)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.locator('.feedback-bubble.is-visible')).toHaveCount(0, { timeout: 3000 });
  await page.screenshot({ path: `${shots}/clasificacion-horizontal.png` });
});

test("etiqueta numérica: una corrección no cuenta como primer intento", async ({ page }) => {
  await open(page); await start(page);
  for (const p of rounds[0]!.productos) {
    await page.locator(`[data-product-id="${p.id}"]`).click();
    await page.locator(`[data-destination="${p.categoria}"]`).click();
  }
  await expect(page.locator(".number-challenge")).toBeVisible();
  await page.screenshot({ path: `${shots}/representacion-desktop.png`, fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `${shots}/representacion-mobile.png`, fullPage: true });
  await page.setViewportSize({ width: 844, height: 390 });
  const labels = await page.locator('.number-token, .number-target').evaluateAll(nodes => nodes.map(n=>{const r=n.getBoundingClientRect();return {bottom:r.bottom,width:r.width,height:r.height};}));
  expect(labels.every(r=>r.bottom<=390 && r.width>=56 && r.height>=56)).toBe(true);
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.getByRole("button", { name: "Etiqueta 1", exact: true }).click();
  await page.getByRole("button", { name: /^Pegar etiqueta/ }).click();
  await expect(page.getByRole("status")).toHaveText("Cuenta otra vez, sin saltar ninguno.");
  await expect(page.locator(".round-count")).toHaveText("1 de 12");
  await page.getByRole("button", { name: "Etiqueta 2", exact: true }).click();
  await page.getByRole("button", { name: /^Pegar etiqueta/ }).click();
  await expect(page.locator(".round-count")).toHaveText("2 de 12");
  await page.getByRole("button", { name: "Pausar juego" }).click();
  await page.getByRole("button", { name: "Volver al inicio", exact: true }).click();
  await page.locator(".teacher-report summary").click();
  const row=page.locator(".teacher-report tbody tr").nth(1);
  await expect(row.locator("td").nth(0)).toHaveText("1");
  await expect(row.locator("td").nth(1)).toHaveText("0 / 1");
  await expect(row.locator("td").nth(3)).toHaveText("1");
});
