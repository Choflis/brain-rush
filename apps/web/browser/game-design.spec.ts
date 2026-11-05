import { test, expect, type Page } from '@playwright/test';
async function empezar(page: Page) {
  await page.goto('/tiendita.html');
  await page.getByRole('button', { name: '¡A jugar!' }).click();
  await page.getByRole('button', { name: '¡Lo tengo!' }).click();
}
for (const width of [390, 1366]) {
  test(`Reglita es visible, grande y celebra al ordenar a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await empezar(page);
    const companera = page.locator('.companera-reglita');
    await expect(companera).toBeVisible();
    const figura = await companera.locator('.reglita-interactiva').boundingBox();
    expect(figura!.height).toBeGreaterThanOrEqual(width < 700 ? 100 : 230);
    await expect(companera).toHaveAttribute('data-accion', 'caminar');
    await page.locator('[data-product-id="p1"]').click();
    await page.locator('[data-destination="gaseosas"]').click();
    await expect(companera).toHaveAttribute('data-accion', 'celebrar');
    await expect(page.locator('[data-product-id="p1"]')).toBeDisabled();
    await page.getByRole('button', { name: 'Pausar juego' }).click();
    await expect(companera).toHaveAttribute('data-pausa', 'true');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  });
}

test('la compañera permite saludar y no anima con movimiento reducido', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await empezar(page);
  const companera = page.locator('.companera-reglita');
  await companera.getByRole('button', { name: 'Saludar a Reglita' }).click();
  await expect(companera.getByRole('status')).toContainText('Chócala');
  const animaciones = await companera.evaluate(el => el.getAnimations({ subtree: true }).filter(a => a.playState === 'running').length);
  expect(animaciones).toBe(0);
  await page.locator('[data-product-id="p1"]').click();
  await expect(page.locator('[data-product-id="p1"]')).toHaveAttribute('aria-pressed', 'true');
});

test('Carrera muestra una Reglita mayor que camina al convertir', async ({ page }) => {
  await page.goto('/j/CARRERA');
  await page.getByRole('textbox', { name: 'Tu nombre para jugar' }).fill('Explorador');
  await page.getByRole('button', { name: '¡A jugar!' }).click();
  await expect.poll(() => page.evaluate(() => (window as any).__brainRushJuego?.scene.scenes[0]?.tutorialFinalizado), { timeout: 15000 }).toBe(true);
  const antes = await page.evaluate(() => { const s = (window as any).__brainRushJuego.scene.scenes[0]; return { x: s.spriteReglita.x, ancho: s.spriteReglita.displayWidth }; });
  expect(antes.ancho).toBeGreaterThanOrEqual(80);
  await page.evaluate(() => { const s = (window as any).__brainRushJuego.scene.scenes[0]; s.multiplicarPor10(); s.dividirEntre10(); });
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => (window as any).__brainRushJuego.scene.scenes[0].spriteReglita.x)).toBe(antes.x);
  const canvas = await page.locator('#phaser-carrera-contenedor canvas').boundingBox();
  await page.mouse.click(canvas!.x + canvas!.width * 590 / 800, canvas!.y + canvas!.height * 335 / 600);
  await expect.poll(() => page.evaluate(() => (window as any).__brainRushJuego.scene.scenes[0].spriteReglita.x)).toBeGreaterThan(antes.x);
});
