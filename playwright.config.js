// @ts-check
import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests run against real built output (dist/), served the way
 * Cloudflare Pages serves it (see scripts/serve.js). global-setup builds
 * every site in preview mode and the test fixtures in production mode.
 */
export default defineConfig({
  testDir: "tests/e2e",
  // CI builds once and shares dist/ with every shard (E2E_PREBUILT=1); locally the tests build first.
  globalSetup: process.env.E2E_PREBUILT ? undefined : "./tests/e2e/global-setup.js",
  // Each test is its own unit, so CI shards split by test, not by file (a11y and all-sites are 12 minutes each).
  // Still one worker per machine: the layout-shift and timing tests stay off a shared CPU.
  fullyParallel: true,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [["list"], ["github"], ["html", { open: "never" }]] : "list", // "github" turns failures into annotations on the PR
  use: { ...devices["Desktop Chrome"], locale: "en-GB", timezoneId: "Europe/London" },
});
