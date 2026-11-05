import { test, expect, type Page } from '@playwright/test';
async function entrar(page: Page) {
  await page.goto('/docente/login');
  await page.getByRole('button', { name: 'Entrar al Panel Docente' }).click();
  await page.waitForURL('**/docente');
}

test('el resumen responde al salón y permite desplegar apoyo', async ({ page }) => {
  await entrar(page);
  await page.getByLabel('Ver salón').selectOption('clase-3b');
  await expect(page.locator('.docente-resumen-alumnos')).toHaveText('5');
  await expect(page.locator('.docente-apoyo')).toContainText('Joaquín');
  await expect(page.locator('.docente-apoyo')).not.toContainText('Thiago');
  await page.getByRole('button', { name: /Ver apoyo de Joaquín/ }).click();
  await expect(page.getByText('Criterios por reforzar: C3', { exact: true })).toBeVisible();
});

test('sesiones busca por título, filtra por grado y cambia de vista', async ({ page }) => {
  await entrar(page); await page.goto('/docente/sesiones');
  await page.getByLabel('Buscar sesiones').fill('longitud');
  await expect(page.locator('.tarjeta-sesion')).toHaveCount(1);
  await page.getByLabel('Filtrar por grado').selectOption('1');
  await expect(page.getByText('No encontramos sesiones con estos filtros.')).toBeVisible();
  await page.getByRole('button', { name: 'Limpiar filtros' }).click();
  await expect(page.locator('.tarjeta-sesion')).toHaveCount(3);
  await page.getByRole('button', { name: 'Vista de lista' }).click();
  await expect(page.locator('.rejilla-sesiones')).toHaveClass(/sesiones-vista-lista/);
});

test('clases filtra estudiantes y confirma cambios de acceso a juegos', async ({ page }) => {
  await entrar(page); await page.goto('/docente/clases');
  await page.getByLabel('Buscar estudiantes').fill('Thiago');
  await expect(page.locator('.tabla-alumnos tbody tr')).toHaveCount(1);
  await page.getByLabel('Buscar estudiantes').fill('');
  await page.getByLabel('Estado del estudiante').selectOption('en_riesgo');
  await expect(page.locator('.tabla-alumnos tbody tr')).toHaveCount(2);
  const permiso = page.getByRole('switch').first();
  const antes = await permiso.isChecked();
  await permiso.click();
  await expect(permiso).toBeChecked({ checked: !antes });
  await expect(page.locator('.docente-confirmacion')).not.toBeEmpty();
  await page.reload();
  await expect(page.getByRole('switch').first()).toBeChecked({ checked: !antes });
});

test('subir sesión admite Escape y devuelve el foco al botón de apertura', async ({ page }) => {
  await entrar(page); await page.goto('/docente/sesiones');
  const abrir = page.getByRole('button', { name: 'Subir Nueva Sesión' });
  await abrir.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(abrir).toBeFocused();
});

for (const width of [320, 768, 1440]) {
  test(`escritorio docente a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];page.on('pageerror', e => errors.push(e.message));
    await entrar(page);
    for (const route of ['/docente', '/docente/sesiones', '/docente/clases', '/docente/sesiones/ses-1-tienda']) {
      await page.goto(route);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      await expect(page.locator('h1')).toBeVisible();
    }
    expect(errors).toEqual([]);
  });
}

test('el menú plegable conserva la navegación y la búsqueda global lleva a resultados', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await entrar(page);
  await page.getByRole('button', { name: 'Plegar navegación' }).click();
  const ancho = await page.locator('.sidebar-docente').evaluate(el => el.getBoundingClientRect().width);
  expect(ancho).toBeLessThan(100);
  await page.getByRole('link', { name: 'Sesiones de Estudio', exact: true }).click();
  await expect(page).toHaveURL(/\/docente\/sesiones$/);
  await page.getByLabel('Buscar en tus sesiones').fill('ecosistemas');
  await page.getByRole('button', { name: 'Ir a resultados' }).click();
  await expect(page.locator('.tarjeta-sesion')).toHaveCount(1);
  await expect(page.locator('.tarjeta-sesion')).toContainText('ecosistemas');
});

test('el documento de referencia se valida y guardar actualiza sesiones y contadores', async ({ page }) => {
  await entrar(page);await page.goto('/docente/sesiones');
  await page.getByRole('button', { name: 'Subir Nueva Sesión' }).click();
  const archivo = page.getByLabel('Documento de la sesión');
  await archivo.setInputFiles({ name: 'notas.txt', mimeType: 'text/plain', buffer: Buffer.from('notas') });
  await expect(page.getByRole('alert')).toContainText('PDF o DOCX');
  await archivo.setInputFiles({ name: 'exploramos.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 referencia') });
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.getByLabel('Título de la Sesión').fill('Exploramos las semillas');
  await page.getByRole('button', { name: 'Crear Actividades' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.tarjeta-sesion')).toHaveCount(4);
  await expect(page.locator('.docente-confirmacion')).toContainText('Exploramos las semillas');
  await expect(page.locator('.widget-fila').filter({ hasText: 'Juegos listos' })).toContainText('7');
  await page.reload();
  await expect(page.locator('.tarjeta-sesion')).toHaveCount(4);
});

test('Reglita responde y Escape devuelve el foco al botón de ayuda', async ({ page }) => {
  await entrar(page);
  const abrir = page.getByRole('button', { name: 'Abrir asistente pedagógica Reglita' });
  await abrir.click();
  const ayuda = page.getByRole('dialog', { name: 'Asistente pedagógica Reglita' });
  await ayuda.getByLabel('Consulta para Reglita').fill('Una pregunta de cierre para la sesión');
  await ayuda.getByRole('button', { name: 'Enviar consulta' }).click();
  await expect(ayuda.locator('.flotante-burbuja-reglita').last()).toContainText('metacognitiva');
  await page.keyboard.press('Escape');
  await expect(ayuda).toHaveCount(0);
  await expect(abrir).toBeFocused();
});

test('el acceso docente personaliza el saludo y el nombre del aula', async ({ page }) => {
  await page.goto('/docente/login');
  await page.getByLabel('¿Cómo te llamas, profe?').fill('Prof. Elena Ramos');
  await page.getByLabel('¿Cómo te llamas, profe?').press('Enter');
  await expect(page).toHaveURL(/\/docente$/);
  await expect(page.locator('.perfil-textos')).toContainText('Prof. Elena Ramos');
});
