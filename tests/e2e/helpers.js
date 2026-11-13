import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test as base } from "@playwright/test";
import { serve } from "../../scripts/serve.js";
import { FEATURES } from "../../src/features/registry.js";

// Monday 19 Oct 2026, 10:30 BST (09:30 UTC): the demo and the Signature client fixture are open
// (the Starter fixture is closed on Mondays, which keeps its closed state covered).
export const OPEN_TIME = new Date("2026-10-19T09:30:00Z");
// Monday 19 Oct 2026, 22:30 BST: every test shop is closed.
export const CLOSED_TIME = new Date("2026-10-19T21:30:00Z");

/**
 * Every browser test starts at a fixed time (shops open), so results never
 * depend on when the suite runs. A test can still set its own time.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.clock.setFixedTime(OPEN_TIME);
    await use(page);
  },
});
export { expect } from "@playwright/test";

/** Every site built by global-setup, read from the build manifests. */
export function builtSites() {
  const dir = ".build/manifests";
  return readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => JSON.parse(readFileSync(path.join(dir, f), "utf8")));
}

/**
 * The sites this run checks page by page. CI narrows a pull request to the kits it changes
 * (E2E_KITS=bridal,nails, set by scripts/ci-plan.js); unset means every site.
 */
export function testedSites() {
  const kits = (process.env.E2E_KITS ?? "").split(",").map((k) => k.trim()).filter(Boolean);
  return kits.length ? builtSites().filter((s) => kits.includes(s.kit)) : builtSites();
}

/** @param {string} label e.g. "demos/barber" */
export function site(label) {
  const s = builtSites().find((m) => m.label === label);
  if (!s) throw new Error(`site ${label} was not built`);
  return s;
}

/**
 * Serve a built site at the root of its own port, like its own domain.
 * Port 0 lets the system pick a free port, so a port already in use on the
 * test machine can never hang a test.
 */
export async function start(manifest) {
  const server = await serve(manifest.outDir, 0);
  const { port } = /** @type {import("node:net").AddressInfo} */ (server.address());
  // A test usually ends while its page is still open and fetching (a click scrolls lazy photos into view, a
  // navigation is still loading pictures). server.close() waits for every connection to end, and Chrome keeps
  // its sockets until the page closes, which is after the test. Node's closeAllConnections() only reaches
  // sockets its HTTP parser has registered; on a slow CI machine a socket Chrome opened for those late
  // fetches could still be outside that list, and close() then waited out the 30 s test timeout (main's red
  // runs, 2 Nov 2026). So the helper keeps its own list of every socket and ends them all, including any that
  // arrive while it is closing.
  const sockets = new Set();
  let closing = false;
  server.on("connection", (s) => {
    if (closing) { s.destroy(); return; }
    sockets.add(s);
    s.on("close", () => sockets.delete(s));
  });
  return {
    base: `http://localhost:${port}`,
    close: () => new Promise((r) => {
      closing = true;
      server.close(() => r(undefined));
      server.closeAllConnections();
      for (const s of sockets) s.destroy();
    }),
  };
}

/** Page path for a page name. */
export const pathOf = (page) => (page === "index" ? "/" : `/${page}`);

/** Collect page errors and console errors (ignoring expected network blocks in tests). */
export function watchErrors(page) {
  const errors = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error" && !/net::ERR_FAILED|Failed to load resource/.test(m.text())) errors.push(`console: ${m.text()}`); });
  return errors;
}

/** Features that ship a browser module; core.js marks each one's root data-ready once it has started. */
const SCRIPTED = FEATURES.filter((f) => f.js).map((f) => f.id);

/**
 * Wait until every feature on the page that has a script has started. core.js starts them in page order and hands
 * the main thread back every ~40 ms, so on a slow machine some are still starting after the load event; until then a
 * feature may be deliberately invisible (kept in place so nothing moves), and a check that reads the page mid-way
 * sees a half-built state.
 * @param {import("@playwright/test").Page} page
 */
export async function featuresStarted(page) {
  await page.waitForFunction((ids) => [...document.querySelectorAll("[data-feature]")]
    .filter((el) => ids.includes(/** @type {HTMLElement} */ (el).dataset.feature ?? ""))
    .every((el) => el.hasAttribute("data-ready") || el.hasAttribute("data-feature-error")), SCRIPTED);
}
