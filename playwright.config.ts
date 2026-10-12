import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 150_000,
  fullyParallel: true,
  workers: 4,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:4173', browserName: 'chromium', viewport: { width: 1080, height: 1920 }, contextOptions: { reducedMotion: 'reduce' } },
  webServer: { command: 'npm run preview', url: 'http://localhost:4173/demo', reuseExistingServer: true, timeout: 60_000 },
});
