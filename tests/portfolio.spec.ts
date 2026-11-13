import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir } from 'node:fs/promises';

test('minimal hero introduces Rewa, motion preference works, and selected work opens', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Thoughtful by nature.' })).toBeVisible();
  await expect(page.locator('.hero-introduction')).toContainText('Rewa, a product designer');
  const work = page.getByRole('link', { name: 'Selected work (06)' });
  await expect(work).toBeInViewport();
  await expect(page.locator('.hero-line').first().locator('span')).toHaveCSS('animation-iteration-count', '1');
  await page.getByRole('button', { name: 'Reduce motion' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');
  await page.getByRole('button', { name: 'Enable motion' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'on');
  await page.getByRole('button', { name: 'Reduce motion' }).click();
  await work.click();
  await expect(page).toHaveURL(/#work$/);
  await expect(page.locator('.projects .project')).toHaveCount(6);
  expect(errors).toEqual([]);
});

test('filters, list view, project structure, dialog keyboard focus and journey controls', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Research', exact: true }).click();
  await expect(page.locator('.projects .project')).toHaveCount(3);
  await page.getByRole('button', { name: 'List view' }).click();
  await expect(page.locator('.projects')).toHaveClass(/projects-list/);
  await page.getByRole('button', { name: 'All work', exact: true }).click();
  await expect(page.locator('.projects .project')).toHaveCount(6);
  await page.getByRole('button', { name: 'Grid view' }).click();
  await page.getByRole('button', { name: 'Peek at the structure' }).first().click();
  await expect(page.locator('.structure-panel')).toContainText('Guided exercise');
  await page.getByRole('button', { name: 'Close structure view' }).click();
  const opener = page.getByRole('button', { name: 'Open PelvicAI Health case study' });
  await opener.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Close', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Pan right', exact: true }).click();
  await expect(page.locator('.flow-track')).not.toHaveCSS('transform', 'none');
  await page.getByRole('button', { name: 'Step 3 Guided exercise' }).click();
  await expect(page.getByRole('button', { name: 'Step 3 Guided exercise' })).toHaveAttribute('aria-pressed', 'true');
  const scan = await new AxeBuilder({ page }).include('.case-dialog').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  expect(scan.violations).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(opener).toBeFocused();
  await page.getByRole('button', { name: 'Open Dating App Decision Fatigue case study' }).click();
  await expect(page.getByRole('dialog').locator('.choice-art')).toContainText('More choice.');
  await page.getByRole('button', { name: 'Close', exact: true }).click();
});

test('approach tabs support arrow keys and email can be copied', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read','clipboard-write']);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const first = page.getByRole('tab', { name: /Listen closely/ });
  await first.click();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('tab', { name: /Connect the dots/ })).toBeFocused();
  await expect(page.getByRole('heading', { name: 'Make the whole system visible.' })).toBeVisible();
  await page.keyboard.press('End');
  await expect(page.getByRole('heading', { name: 'Show the next useful thing.' })).toBeVisible();
  await page.getByRole('button', { name: 'Copy email address' }).click();
  await expect(page.getByRole('status')).toHaveText('Copied');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('rewamehta2002@gmail.com');
});

test('responsive layouts, image integrity, reduced motion, accessibility, and review captures', async ({ page }) => {
  await mkdir('.impeccable/review/minimal', { recursive: true });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(Array.from(document.images).map(async image => { image.loading = 'eager'; await image.decode(); }));
  });
  await expect(page.getByRole('button', { name: 'Enable motion' })).toBeVisible();
  await expect(page.locator('.hero-line').first().locator('span')).toHaveCSS('animation-name', 'none');
  const desktopScan = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  expect(desktopScan.violations).toEqual([]);
  await page.screenshot({ path: '.impeccable/review/minimal/desktop.png', fullPage: true });
  await page.screenshot({ path: '.impeccable/review/minimal/desktop-hero.png' });
  await page.locator('.work-heading').evaluate(element => element.scrollIntoView({ block: 'start' }));
  await expect(page.locator('.site-header')).toHaveAttribute('data-hero', 'false');
  await page.screenshot({ path: '.impeccable/review/minimal/desktop-work.png' });
  await page.locator('#about').screenshot({ path: '.impeccable/review/minimal/desktop-about.png' });
  for (const [width, height] of [[390,844],[320,667],[768,844],[1366,768],[1920,1080]]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => window.scrollTo(0,0));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const bounds = await page.locator('.hero-work-link').boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(height);
    await expect(page.getByRole('heading', { level: 1 })).toBeInViewport();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(async () => { window.scrollTo(0,0); await Promise.all(Array.from(document.images).map(image => image.decode())); });
  await expect(page.locator('.site-header')).toHaveAttribute('data-hero','true');
  await page.screenshot({ path: '.impeccable/review/minimal/mobile.png', fullPage: true });
  await page.screenshot({ path: '.impeccable/review/minimal/mobile-hero.png' });
  const mobileScan = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  expect(mobileScan.violations).toEqual([]);
  await page.getByRole('button', { name: 'Open menu' }).click();
  await expect(page.getByRole('link', { name: 'About', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Open menu' })).toBeFocused();
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('link', { name: 'About', exact: true }).click();
  await expect(page).toHaveURL(/#about$/);
  await expect(page.getByRole('button', { name: 'Open menu' })).toHaveAttribute('aria-expanded','false');
});
