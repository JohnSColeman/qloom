import { defineConfig, devices } from "@playwright/test";

/**
 * The reference-app parity gate (PLAN §13). Boots the ported hotel-booking app
 * via Vite and drives it in a real browser, asserting each enabled milestone's
 * checks. Tests are tagged by milestone; today M2's Index-render checks run.
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env["CI"],
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:5180",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:5180",
    reuseExistingServer: !process.env["CI"],
    timeout: 60_000,
  },
});
