import { test, expect, type Page } from '@playwright/test';

// Mobile-specific guarantees. Runs on every project; the viewport is forced to a small phone.
test.use({ viewport: { width: 360, height: 760 }, isMobile: true, hasTouch: true });

const acceptCookies = (page: Page) =>
  page.addInitScript(() =>
    localStorage.setItem('cookie-consent', JSON.stringify({ version: '1', date: '', necessary: true, analytics: false, marketing: false })),
  );

const PAGES = [
  '/',
  '/servicios/',
  '/servicios/adecuacion-de-locales-comerciales/',
  '/sectores/propiedad-horizontal/',
  '/proyectos/',
  '/proyectos/ejemplo-cocina-restaurante/',
  '/blog/cuanto-cuesta-remodelar-local-comercial/',
  '/nosotros/',
  '/proveedores/',
  '/contacto/',
  '/preguntas-frecuentes/',
  '/cotizar/',
  '/legal/politica-de-cookies/',
];

for (const path of PAGES) {
  test(`no horizontal overflow at 360px: ${path}`, async ({ page }) => {
    await acceptCookies(page);
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test('mobile keeps the scroll story: hero, layers and projects are pinned', async ({ page }) => {
  await acceptCookies(page);
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'on');
  for (const id of ['capa-por-capa', 'proyectos']) {
    await expect(page.locator(`.pin-spacer:has(#${id})`)).toHaveCount(1);
  }
  await expect(page.locator('.pin-spacer:has([data-motion="hero"])')).toHaveCount(1);
});

test('mobile layers: only the active layer text is shown and it advances with scroll', async ({ page }) => {
  await acceptCookies(page);
  await page.goto('/');
  const section = page.locator('#capa-por-capa');
  await section.scrollIntoViewIfNeeded();
  await expect(page.locator('[data-layer-item]:visible')).toHaveCount(1);
  const first = await page.locator('[data-layer-item][data-active]').textContent();
  await page.mouse.wheel(0, 1600);
  await page.waitForTimeout(1200);
  const later = await page.locator('[data-layer-item][data-active]').textContent();
  expect(later).not.toBe(first);
});

test('reduced motion: projects become a native swipe carousel', async ({ page }) => {
  await acceptCookies(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const track = page.locator('[data-track]');
  const style = await track.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { overflowX: cs.overflowX, snap: cs.scrollSnapType, scrollable: el.scrollWidth > el.clientWidth };
  });
  expect(style.overflowX).toBe('auto');
  expect(style.snap).toContain('x');
  expect(style.scrollable).toBe(true);
});

test('before/after slider lets vertical swipes scroll the page', async ({ page }) => {
  await acceptCookies(page);
  await page.goto('/proyectos/ejemplo-cocina-restaurante/');
  const touchAction = await page
    .locator('.ba-range')
    .first()
    .evaluate((el) => getComputedStyle(el).touchAction);
  expect(touchAction).toBe('pan-y');
});

test('filters and tabs are a single swipeable row on phones', async ({ page }) => {
  await acceptCookies(page);
  await page.goto('/');
  for (const sel of ['.services-grid .chip-row', '.sector-tabs .chip-row']) {
    const row = page.locator(sel);
    const { height, scrollable } = await row.evaluate((el) => ({ height: el.getBoundingClientRect().height, scrollable: el.scrollWidth > el.clientWidth }));
    expect(height).toBeLessThan(70);
    expect(scrollable).toBe(true);
  }
});

test('mobile menu opens, lists all sections and closes with Escape', async ({ page }) => {
  await acceptCookies(page);
  await page.goto('/');
  await page.getByLabel('Abrir menú').click();
  const menu = page.getByRole('navigation', { name: 'Principal móvil' });
  await expect(menu.getByRole('link')).toHaveCount(8);
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
});

test('quote progress bar fills on phones', async ({ page }) => {
  await acceptCookies(page);
  await page.goto('/cotizar/');
  const bar = page.locator('[data-step-pill="0"] > span:first-child > span');
  await expect.poll(async () => bar.evaluate((el) => el.getBoundingClientRect().width)).toBeGreaterThan(20);
});
