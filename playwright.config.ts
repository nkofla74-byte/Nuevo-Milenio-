import { defineConfig, devices } from '@playwright/test';

const PORT = 4321;

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  use: { baseURL: `http://localhost:${PORT}`, trace: 'retain-on-failure' },
  projects: [
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'chromium-mobile', use: { ...devices['Pixel 7'] } },
    // Firefox and WebKit run in CI (npx playwright install --with-deps firefox webkit).
    ...(process.env.CI
      ? [
          { name: 'firefox-desktop', use: { ...devices['Desktop Firefox'] } },
          { name: 'webkit-mobile', use: { ...devices['iPhone 15'] } },
        ]
      : []),
  ],
  webServer: {
    command: 'npm run dev',
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
