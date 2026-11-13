import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
await mkdir('.verification', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
await page.goto('http://127.0.0.1:5173');
await page.evaluate(() => document.fonts.ready);
for (const id of ['work', 'approach', 'about', 'contact']) {
  const section = page.locator(`#${id}`);
  await section.scrollIntoViewIfNeeded();
  await section.screenshot({ path: `.verification/v2-${id}.png` });
}
await page.getByRole('tab', { name: '02 Systems' }).click();
await page.locator('#approach').screenshot({ path: '.verification/v2-approach-systems.png' });
await browser.close();
