import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
const isCI = !!process.env.CI;
// Set PLAYWRIGHT_BASE_URL to test a running deployment (e.g. the Docker image) instead of a local build.
const externalURL = process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  ...(isCI ? { workers: 2 } : {}),
  maxFailures: isCI ? 10 : 0,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: isCI
    ? [['github'], ['html', { open: 'never' }], ['junit', { outputFile: 'test-results/junit.xml' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: externalURL ?? `http://localhost:${PORT}`,
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 14'] } },
  ],
  // Tests run against the production build so the CSP and bundling are exercised too.
  ...(externalURL
    ? {}
    : {
        webServer: {
          command: 'npm run build && npm run preview',
          url: `http://localhost:${PORT}`,
          reuseExistingServer: !isCI,
          timeout: 120_000,
        },
      }),
});
