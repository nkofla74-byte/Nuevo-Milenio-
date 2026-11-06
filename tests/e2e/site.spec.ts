import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const acceptCookies = async (page: Page) =>
  page.addInitScript(() =>
    localStorage.setItem('cookie-consent', JSON.stringify({ version: '1', date: '', necessary: true, analytics: false, marketing: false })),
  );

const KEY_PAGES = [
  '/',
  '/servicios/',
  '/servicios/drywall-y-superboard/',
  '/sectores/retail/',
  '/proyectos/',
  '/blog/drywall-vs-mamposteria/',
  '/cotizar/',
  '/contacto/',
  '/legal/politica-de-tratamiento-de-datos/',
];

test.describe('accessibility (axe, WCAG 2.2 AA)', () => {
  for (const path of KEY_PAGES) {
    test(`no violations on ${path}`, async ({ page }) => {
      await acceptCookies(page);
      await page.emulateMedia({ reducedMotion: 'reduce' }); // final, stable state for analysis
      await page.goto(path);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .exclude('iframe') // third-party Turnstile widget
        .exclude('astro-dev-toolbar')
        .analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.nodes.length} — ${v.help}`)).toEqual([]);
    });
  }
});

test('home: one h1, skip link and content without JS-dependent visibility', async ({ page }) => {
  await acceptCookies(page);
  await page.goto('/');
  await expect(page.locator('h1')).toHaveCount(1);
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Saltar al contenido' })).toBeFocused();
});

test('services filter works with reduced motion', async ({ page }) => {
  await acceptCookies(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/servicios/');
  await page.getByRole('button', { name: 'Metalmecánica' }).click();
  await expect(page.locator('[data-service-card]:visible')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Metalmecánica' })).toHaveAttribute('aria-pressed', 'true');
});

test('sector tabs support arrow keys', async ({ page }) => {
  await acceptCookies(page);
  await page.goto('/');
  const first = page.getByRole('tab').first();
  await first.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab').nth(1)).toBeFocused();
  await expect(page.getByRole('tab').nth(1)).toHaveAttribute('aria-selected', 'true');
});

test('cookie banner: reject is as available as accept and persists', async ({ page }) => {
  await page.goto('/contacto/');
  const banner = page.getByRole('dialog', { name: 'Cookies y privacidad' });
  await expect(banner).toBeVisible();
  await banner.getByRole('button', { name: 'Rechazar' }).click();
  await expect(banner).toBeHidden();
  await page.reload();
  await expect(banner).toBeHidden();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('cookie-consent') ?? '{}'));
  expect(stored.analytics).toBe(false);
});

test('404 returns a real 404 status', async ({ page }) => {
  const res = await page.goto('/esta-pagina-no-existe/');
  expect(res?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('no existe');
});

test('quote form: validates per step and submits end to end', async ({ page }) => {
  await acceptCookies(page);
  await page.goto('/cotizar/?servicio=drywall-y-superboard');

  // Step 1: cannot advance without a choice
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await expect(page.getByText('Seleccione el tipo de inmueble.')).toBeVisible();
  await page.getByText('Oficinas y corporativo', { exact: true }).click();
  await page.getByRole('button', { name: 'Siguiente' }).click();

  // Step 2: prefilled from ?servicio=
  await expect(page.getByRole('checkbox', { name: 'Drywall y superboard' })).toBeChecked();
  await page.getByRole('button', { name: 'Siguiente' }).click();

  // Step 3
  await page.getByLabel('Área aproximada (m²)').fill('80');
  await page.getByLabel('¿Para cuándo?').selectOption('1-mes');
  await page.getByRole('button', { name: 'Siguiente' }).click();

  // Step 4
  await page.getByLabel('Describa brevemente el proyecto').fill('Necesitamos dividir una oficina de 80 m² en tres salas.');
  await page.getByLabel('Nombre', { exact: true }).fill('Ana Prueba');
  await page.getByLabel('Teléfono').fill('300 123 4567');
  await page.getByRole('textbox', { name: 'Correo' }).fill('ana@example.com');
  await page.getByText('Correo electrónico', { exact: true }).click();
  await page.getByRole('button', { name: 'Siguiente' }).click();

  // Step 5: consent is required and not pre-checked
  const consent = page.getByRole('checkbox', { name: /Autorizo/ });
  await expect(consent).not.toBeChecked();
  await page.getByRole('button', { name: 'Enviar solicitud' }).click();
  await expect(page.getByText('Debe autorizar el tratamiento de datos para continuar.')).toBeVisible();
  await consent.check();

  // Turnstile test key passes automatically; wait for its token.
  await expect(page.locator('input[name="cf-turnstile-response"]')).not.toHaveValue('', { timeout: 20_000 });
  await page.getByRole('button', { name: 'Enviar solicitud' }).click();
  await expect(page).toHaveURL(/\/cotizar\/gracias\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Solicitud recibida.');
});
