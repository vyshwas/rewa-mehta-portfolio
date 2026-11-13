import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
const browser = await chromium.launch({ channel: 'chrome', args: ['--remote-debugging-port=9225'] });
try {
  const command = 'C:/Users/vyshw/AppData/Local/npm-cache/_npx/0f94ee7615faf582/node_modules/lighthouse/cli/index.js';
  const status = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [command, 'http://127.0.0.1:4173', '--port=9225', '--only-categories=performance,accessibility,best-practices,seo', '--output=json', '--output-path=.verification/lighthouse-final.json', '--quiet'], { stdio: 'inherit', windowsHide: true });
    child.on('error', reject); child.on('exit', resolve);
  });
  if (status !== 0) throw Error(`Lighthouse exited ${status}`);
  const report = JSON.parse(await readFile('.verification/lighthouse-final.json', 'utf8'));
  console.log(JSON.stringify({ scores: Object.fromEntries(Object.entries(report.categories).map(([key, value]) => [key, value.score * 100])), lcp: report.audits['largest-contentful-paint'].displayValue, cls: report.audits['cumulative-layout-shift'].displayValue, tbt: report.audits['total-blocking-time'].displayValue }, null, 2));
} finally { await browser.close(); }
