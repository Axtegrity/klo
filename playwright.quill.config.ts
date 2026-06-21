import { defineConfig, devices } from "@playwright/test";

// Quill QA Audit config
// Check 7 (unauth redirect) runs against production.
// Authenticated checks (1-6, 8) run against latest Preview deployment
// where PLAYWRIGHT_QA=1 and QA credentials are active.

export default defineConfig({
  testDir: "./e2e",
  testMatch: "quill-audit-2026-06-18.mjs",
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    trace: "on-first-retry",
    screenshot: "on",
    video: "off",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
