import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests', fullyParallel: false, workers: 1, timeout: 45000,
  use: { baseURL: 'http://127.0.0.1:5186', screenshot: 'only-on-failure', trace: 'retain-on-failure', launchOptions: { channel: 'chrome' } },
  projects: [{ name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } } }],
  webServer: { command: 'npm run dev -- --port 5186', url: 'http://127.0.0.1:5186', reuseExistingServer: true },
});
