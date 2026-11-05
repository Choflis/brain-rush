import { test, expect } from '@playwright/test';

test('Reglita responde al puntero, al saludo y respeta movimiento reducido', async ({ page }) => {
  await page.goto('/');
  const mascota = page.getByRole('button', { name: 'Saludar a Reglita' }).first();
  await expect(mascota).toBeVisible();
  const iris = mascota.locator('[data-reglita-iris]').first();
  await page.mouse.move(20, 100);
  await expect(iris).not.toHaveAttribute('transform', 'translate(0 0)');
  await mascota.click();
  await expect(page.getByRole('status').filter({ hasText: /chócala/i })).toBeVisible();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.mouse.move(1000, 300);
  await expect(iris).toHaveAttribute('transform', 'translate(0 0)');
});

test('el mosaico permite pintar con teclado, cambiar color y borrar', async ({ page }) => {
  await page.goto('/');
  const mosaico = page.getByRole('group', { name: 'Mosaico para pintar' });
  const primera = mosaico.getByRole('button').nth(0);
  await primera.focus();
  await page.keyboard.press('Enter');
  await expect(primera).toHaveAttribute('aria-label', 'Casilla 1, verde');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Space');
  await expect(mosaico.getByRole('button', { name: 'Casilla 2, verde', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Pintar de naranja', exact: true }).click();
  await mosaico.getByRole('button', { name: 'Casilla 3, sin pintar', exact: true }).click();
  await expect(mosaico.getByRole('button', { name: 'Casilla 3, naranja', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Borrar mosaico', exact: true }).click();
  await expect(mosaico.getByRole('button', { name: /sin pintar/ })).toHaveCount(60);
});

for (const width of [320, 390, 768, 1366]) {
  test(`pantallas responsive a ${width}px sin desbordamiento ni errores`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => {
      if (response.url().startsWith('http://localhost:5173') && response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
    });
    for (const route of ['/', '/login?rol=alumno', '/estudiante', '/docente/login', '/docente/sesiones', '/docente/clases', '/j/CARRERA', '/tiendita.html']) {
      await page.goto(route);
      if (route === '/docente/login') {
        await page.getByRole('button', { name: 'Entrar al Panel Docente' }).click();
        await expect(page).toHaveURL(/\/docente$/);
      }
      await page.waitForTimeout(350);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, route).toBeLessThanOrEqual(1);
      await expect(page.locator('body')).not.toBeEmpty();
      await expect(page.locator('vite-error-overlay')).toHaveCount(0);
    }
    expect(errors).toEqual([]);
  });
}

test('las tarjetas de sesiones y sus ventanas caben en un móvil', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 850 });
  await page.goto('/docente/login');
  await page.getByRole('button', { name: 'Entrar al Panel Docente' }).click();
  await page.waitForURL('**/docente');
  await page.goto('/docente/sesiones');
  for (const card of await page.locator('.tarjeta-sesion').all()) {
    const bounds = await card.boundingBox();
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(320);
  }
  await page.goto('/docente/sesiones/ses-1-tienda');
  await page.getByRole('button', { name: 'Ver Desempeño y Criterios' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  const stats = await page.locator('.modal-contenido').boundingBox();
  expect(stats!.x + stats!.width).toBeLessThanOrEqual(320);
  await page.getByRole('button', { name: 'Cerrar modal' }).click();
  await page.getByRole('button', { name: 'Probar y Ajustar' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  const preview = await page.locator('.modal-previsualizador').boundingBox();
  expect(preview!.x + preview!.width).toBeLessThanOrEqual(320);
  await page.getByRole('button', { name: 'Cerrar previsualizador' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

for (const width of [320, 441, 768]) {
  test(`mosaico táctil con casillas amplias a ${width}px`, async ({ browser }) => {
    const context = await browser.newContext({ hasTouch: true, viewport: { width, height: 900 } });
    const page = await context.newPage();
    try {
      await page.goto('http://localhost:5173/');
      const cell = page.getByRole('group', { name: 'Mosaico para pintar' }).getByRole('button').first();
      await cell.scrollIntoViewIfNeeded();
      const bounds = await cell.boundingBox();
      expect(bounds!.width).toBeGreaterThanOrEqual(44);
      expect(bounds!.height).toBeGreaterThanOrEqual(44);
      await cell.tap();
      await expect(cell).toHaveAttribute('aria-label', 'Casilla 1, verde');
      const mascot = page.getByRole('button', { name: 'Saludar a Reglita' });
      await mascot.tap();
      await expect(page.getByRole('status').filter({ hasText: /chócala/i })).toBeVisible();
    } finally { await context.close(); }
  });
}
