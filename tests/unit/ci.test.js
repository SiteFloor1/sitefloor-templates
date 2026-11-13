import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("CI's Playwright image matches the installed @playwright/test version", () => {
  const pkg = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8"));
  const version = (pkg.devDependencies["@playwright/test"] ?? "").replace(/^[\^~]/, "");
  const workflow = readFileSync(new URL("../../.github/workflows/check.yml", import.meta.url), "utf8");
  assert.match(workflow, new RegExp(`mcr\\.microsoft\\.com/playwright:v${version.replace(/\./g, "\\.")}-`));
});

const pkg = (/** @type {Record<string, string>} */ deps, extra = {}) => JSON.stringify({ name: "x", devDependencies: deps, ...extra });
const lock = (/** @type {Record<string, any>} */ packages) => JSON.stringify({ lockfileVersion: 3, packages });

test("a package change that only adds or bumps @fontsource fonts is told apart from any other", async () => {
  const { fontChanges } = await import("../../scripts/ci-plan.js");
  const before = pkg({ "@playwright/test": "1.56.0", "@fontsource/sora": "5.2.0" });
  assert.deepEqual(fontChanges("package.json", before, pkg({ "@playwright/test": "1.56.0", "@fontsource/sora": "5.3.0", "@fontsource/urbanist": "5.3.0" })),
    ["@fontsource/sora", "@fontsource/urbanist"]);
  assert.equal(fontChanges("package.json", before, pkg({ "@playwright/test": "1.57.0", "@fontsource/sora": "5.2.0" })), null);
  assert.equal(fontChanges("package.json", before, pkg({ "@playwright/test": "1.56.0", "@fontsource/sora": "5.2.0" }, { scripts: { a: "b" } })), null);
  const root = { "": { devDependencies: { "@fontsource/sora": "5.2.0" } }, "node_modules/@fontsource/sora": { version: "5.2.0" } };
  assert.deepEqual(fontChanges("package-lock.json", lock(root), lock({ ...root, "node_modules/@fontsource/urbanist": { version: "5.3.0" },
    "": { devDependencies: { "@fontsource/sora": "5.2.0", "@fontsource/urbanist": "5.3.0" } } })), ["@fontsource/urbanist"]);
  // Anything else in the lockfile, even a font nested under another package, is shared.
  assert.equal(fontChanges("package-lock.json", lock(root), lock({ ...root, "node_modules/x/node_modules/@fontsource/sora": { version: "1.0.0" } })), null);
  assert.equal(fontChanges("package-lock.json", lock(root), lock({ ...root, "node_modules/eslint": { version: "9.0.0" } })), null);
});

test("kit pull requests stay kit-scoped; shared code still runs everything", async () => {
  const { plan } = await import("../../scripts/ci-plan.js");
  // Fonts only, loaded by one look: that look's kits. With no base to compare against, package files run everything.
  const now = (/** @type {string} */ f) => readFileSync(new URL(`../../${f}`, import.meta.url), "utf8");
  const withoutMona = (/** @type {string} */ f) => {
    const j = JSON.parse(now(f));
    if (f === "package.json") delete j.dependencies?.["@fontsource/mona-sans"], delete j.devDependencies?.["@fontsource/mona-sans"];
    else { delete j.packages["node_modules/@fontsource/mona-sans"]; for (const s of ["dependencies", "devDependencies"]) delete j.packages[""][s]?.["@fontsource/mona-sans"]; }
    return JSON.stringify(j);
  };
  const fonts = plan(["package.json", "package-lock.json"], { baseFile: withoutMona });
  assert.equal(fonts.all, false);
  assert.ok(fonts.kits.length >= 1 && fonts.kits.includes("wealth"), fonts.why.join("; "));
  assert.equal(plan(["package.json"]).all, true);
  assert.equal(plan(["package-lock.json"], { baseFile: () => undefined }).all, true);
  // A demo provider wired in only by one kit's kit.js; a shared demo file runs everything.
  assert.deepEqual(plan(["src/demo/insights-provider.js"]).kits, ["wealth"]);
  assert.equal(plan(["src/demo/demo.js"]).all, true);
  assert.equal(plan(["src/demo/no-such-provider.js"]).all, true);
  // Shared models: only the kits that list the folder in sharedAssets.
  assert.deepEqual(plan(["src/core/assets/cars/car-suv.glb"]).kits, ["car", "detailing"]);
  assert.equal(plan(["src/core/assets/nothing-lists-this/a.webp"]).all, true);
  for (const f of ["src/core/lib/booking.js", "src/features/registry.js", "scripts/build.js", ".github/workflows/check.yml", "playwright.config.js", "tests/e2e/a11y.spec.js", ".nvmrc"]) {
    assert.equal(plan(["src/kits/wealth/kit.js", f]).all, true, f);
  }
  // Docs, audits and case studies (a push to main that only carries these) run no browser tests.
  assert.deepEqual(plan(["docs/SPEED-LOG.md", "audits/reports/x.md", "case-studies/morrow/index.html"]).specs, []);
});

test("a later push reruns a PR's browser tests only when it reaches that PR's kits or shared code", async () => {
  const { sincePlan } = await import("../../scripts/ci-plan.js");
  const kitPr = { all: false, kits: ["wealth"], specs: ["tests/e2e/wealth.spec.js", "tests/e2e/smoke.spec.js"], why: [] };
  const sharedPr = { all: true, kits: [], specs: [], why: ["shared: scripts/build.js"] };
  const none = { all: false, kits: [], specs: [], why: [] };
  const other = { all: false, kits: ["florist"], specs: ["x"], why: [] };
  const mine = { all: false, kits: ["florist", "wealth"], specs: ["x"], why: [] };
  const shared = { all: true, kits: [], specs: [], why: ["shared: src/core/lib/a.js"] };
  const sha = "0123456789abcdef";
  assert.deepEqual(sincePlan(kitPr, none, sha).specs, []); // an audit report or docs
  assert.deepEqual(sincePlan(kitPr, other, sha).specs, []); // main merged in, other kits only
  assert.deepEqual(sincePlan(kitPr, mine, sha).specs, kitPr.specs);
  assert.deepEqual(sincePlan(kitPr, shared, sha).specs, kitPr.specs); // main brought shared code: retest this kit with it
  assert.equal(sincePlan(sharedPr, other, sha).all, true); // a shared change meets a newly merged kit
  assert.equal(sincePlan(sharedPr, none, sha).all, false);
});

test("production is promoted only from a green run: nightly checks main's own push run first, and never moves back", () => {
  const wf = readFileSync(new URL("../../.github/workflows/check.yml", import.meta.url), "utf8");
  const promote = wf.slice(wf.indexOf("\n  promote:"));
  assert.match(promote, /permissions:\n\s+contents: write\n\s+actions: read/);
  // The gate runs for every event but a push, reads check.yml's push run for this very commit, and fails on a failed one.
  assert.match(promote, /id: gate\n\s+if: github\.event_name != 'push'/);
  assert.match(promote, /workflows\/check\.yml\/runs\?event=push&head_sha=\$\{\{ github\.sha \}\}/);
  assert.match(promote, /none\|"completed success"\)/);
  assert.match(promote, /completed\*\) echo "::error::.*exit 1/);
  // Every later step obeys the gate, and the push is skipped when production already includes the commit.
  assert.equal((promote.match(/if: steps\.gate\.outputs\.go != 'false'/g) ?? []).length, 2);
  assert.ok(promote.indexOf("merge-base --is-ancestor HEAD FETCH_HEAD") < promote.indexOf('git push origin "HEAD:refs/heads/production"'));
  const nightly = readFileSync(new URL("../../.github/workflows/nightly.yml", import.meta.url), "utf8");
  assert.match(nightly, /uses: \.\/\.github\/workflows\/check\.yml[\s\S]*actions: read/);
});
