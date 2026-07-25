import { defineConfig, devices } from '@playwright/test'

// End-to-end tests for the six founding scenarios. They drive the real app in a
// browser and assert the "successful result" of each scenario against the data
// in IndexedDB, so a passing run proves the scenario still works, not just that
// the buttons are clickable.
//
// Runs on its own port so it never collides with a dev server you have open.
// `npm run test:e2e` starts Vite, runs the specs, and tears the server down.

const PORT = 5180
const BASE_URL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 12_000 },
  reporter: [['list']],
  use: {
    baseURL: BASE_URL,
    locale: 'fa-IR',
    viewport: { width: 1360, height: 880 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
