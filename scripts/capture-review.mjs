import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
await mkdir('.verification', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
await page.goto('http://127.0.0.1:5173');
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(800);
await page.screenshot({ path: '.verification/desktop-motion.png' });
for (const id of ['work', 'playground', 'about', 'contact']) {
  await page.locator(`#${id}`).scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `.verification/desktop-${id}.png` });
}
await page.getByRole('button', { name: 'Pause motion' }).click();
for (const title of ['PelvicAI Health', 'EstateFlow CRM', 'Survival of the Fittest', 'Redesigning Care', 'Male Gaze & Gender Norms', 'Dating App Decision Fatigue']) {
  await page.getByRole('button', { name: `Open ${title} case study`, exact: true }).click();
  await page.getByRole('dialog').waitFor();
  await page.locator('.case-image').evaluate(async el => { await el.decode(); });
  if (title === 'Male Gaze & Gender Norms') {
    await page.locator('.lookbook').scrollIntoViewIfNeeded();
    await page.screenshot({ path: '.verification/visual-lookbook.png' });
  }
  await page.keyboard.press('Escape');
}
await page.setViewportSize({ width: 390, height: 844 });
for (const id of ['hero', 'work', 'playground', 'contact']) {
  await page.locator(`#${id}`).evaluate(el => el.scrollIntoView());
  await page.screenshot({ path: `.verification/mobile-${id}.png` });
}
await page.getByRole('button', { name: 'Open PelvicAI Health case study' }).click();
await page.getByRole('dialog').waitFor();
await page.screenshot({ path: '.verification/mobile-case.png' });
await page.keyboard.press('Escape');
await writeFile('.verification/review.json', JSON.stringify({ errors, allSixCaseStudiesOpened: true, viewportWidths: [1440, 390] }, null, 2));
if (errors.length) throw Error(JSON.stringify(errors));
await browser.close();
console.log('All six case studies opened, no runtime errors, review screenshots saved.');
