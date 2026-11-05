import { test, expect } from '@playwright/test';

test('Reglita acompaña la escritura y el alumno entra con su nombre', async ({ page }) => {
  await page.goto('/login?rol=alumno');
  const input = page.getByRole('textbox', { name: 'Tu nombre' });
  await input.fill('Mateo');
  await expect(page.locator('.login-mensaje-reglita')).toContainText('Mateo');
  await expect(page.locator('.acceso-companera [data-reglita-iris]')).not.toHaveAttribute('transform', 'translate(0 0)');
  await expect(page.getByRole('button', { name: 'Entrar como Mateo' })).toBeVisible();
  await page.getByRole('button', { name: '¡Entrar a jugar!' }).click();
  await expect(page).toHaveURL(/\/estudiante$/);
  await expect(page.locator('.estudiante-badge')).toContainText('Mateo');
  const sesion = await page.evaluate(() => JSON.parse(localStorage.getItem('br.sesion')!));
  expect(sesion.alumnoId).toBe('alu-101');
});

test('un invitado conserva el nombre escrito y el salón elegido', async ({ page }) => {
  await page.goto('/login?rol=alumno');
  await page.getByRole('button', { name: /Elegir salón de 3/ }).click();
  await page.getByRole('textbox', { name: 'Tu nombre' }).fill('Sol');
  await page.getByRole('button', { name: '¡Entrar a jugar!' }).click();
  await expect(page.locator('.estudiante-badge')).toContainText('Sol');
  await expect(page.locator('.tab-aula-nino-activo')).toContainText('3.º');
});

for (const width of [320, 390, 768, 1366]) {
  test(`acceso infantil y franja completa a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('/login?rol=alumno');
    await expect(page.getByRole('textbox', { name: 'Tu nombre' })).toBeVisible();
    await page.getByRole('textbox', { name: 'Tu nombre' }).fill('Valentina');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    expect(await page.locator('body').innerText()).not.toMatch(/\p{Extended_Pictographic}/u);
    for (const [route, selector] of [['/', '.recreo-fila'], ['/estudiante', '.recreo-portal']]) {
      await page.goto(route);
      const bounds = await page.locator(selector).boundingBox();
      expect(bounds!.x).toBeCloseTo(0, 0);
      expect(bounds!.width).toBeGreaterThanOrEqual(width - 16);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    }
    expect(errors).toEqual([]);
  });
}

test('el cursor de texto mueve la mirada y movimiento reducido la centra', async ({ page }) => {
  await page.goto('/login');
  const nombre = page.getByRole('textbox', { name: 'Tu nombre' });
  await nombre.pressSequentially('Lucia');
  const ojos = page.locator('.acceso-companera [data-reglita-iris]');
  const despuesDeEscribir = await ojos.getAttribute('transform');
  await nombre.press('Home');
  await expect(ojos).not.toHaveAttribute('transform', despuesDeEscribir!);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await nombre.fill('Lucia');
  await expect(ojos).toHaveAttribute('transform', 'translate(0 0)');
  await page.getByRole('button', { name: '¡Entrar a jugar!' }).click();
  await expect(page.locator('.estudiante-badge')).toContainText('Lucía');
});

test('la compañera sigue visible junto al campo en teléfono táctil', async ({ browser }) => {
  const context = await browser.newContext({ hasTouch: true, viewport: { width: 390, height: 844 } });
  try {
    const page = await context.newPage();
    await page.goto('http://localhost:5173/login?rol=alumno');
    const input = page.getByRole('textbox', { name: 'Tu nombre' });
    await input.tap();
    await input.fill('Sol');
    const mini = page.locator('.acceso-observadora-movil');
    await expect(mini).toHaveCSS('opacity', '1');
    await expect(mini.locator('[data-reglita-iris]')).not.toHaveAttribute('transform', 'translate(0 0)');
    await expect(mini.locator('button')).toBeDisabled();
    const box = await mini.boundingBox();
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  } finally { await context.close(); }
});

test('el acceso docente conserva su entrada y permite volver al estudiante', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Soy docente' }).click();
  await expect(page.getByRole('button', { name: 'Entrar al Panel Docente' })).toBeVisible();
  await page.getByRole('button', { name: 'Estudiante', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Tu nombre' })).toBeVisible();
  await page.goto('/docente/login');
  await page.getByRole('button', { name: 'Entrar al Panel Docente' }).click();
  await expect(page).toHaveURL(/\/docente$/);
});
