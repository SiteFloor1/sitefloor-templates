#!/usr/bin/env node
// @ts-check
/**
 * The Cloudflare build command for a live site. It is the last gate before a
 * change reaches customers, so it runs the checks that don't need a browser:
 *
 *   1. unit tests (all shared logic: hours, prices, chair board, validation)
 *   2. house rules (tokens, fonts, look uniqueness, filler copy)
 *   3. build + validate + output checks for this one site
 *   4. size budget for this one site
 *
 * Any failure exits non-zero, so Cloudflare marks the deployment failed and the
 * live site keeps serving the previous good build.
 *
 *   npm ci && npm run release -- --site clients/<slug>
 *
 * Environment comes from SITE_ENV (production on the production branch).
 * The browser tests (layout, accessibility, keyboard) run in GitHub Actions on
 * every pull request instead; they need Chromium, which Cloudflare's build
 * image doesn't have.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";
import { buildSite } from "./build.js";
import { checkRules } from "./rules-check.js";
import { budgetReport } from "./size-budget.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** @param {string} msg */
const fail = (msg) => { console.error(`✗ release blocked: ${msg}`); process.exit(1); };

const { values } = parseArgs({ options: { site: { type: "string" } } });
if (!values.site) fail("pass --site clients/<slug> (or demos/<kit>)");
const label = /** @type {string} */ (values.site);
const env = /** @type {"production"|"preview"} */ (process.env.SITE_ENV === "production" ? "production" : "preview");

console.log(`Release checks for ${label} (${env})`);

const unit = spawnSync(process.execPath, ["--test", "tests/unit/**/*.test.js"], { cwd: ROOT, encoding: "utf8" });
if (unit.status !== 0) { console.error(unit.stdout.slice(-4000), unit.stderr.slice(-2000)); fail("unit tests failed"); }
console.log("✓ unit tests");

const problems = await checkRules(ROOT);
if (problems.length) fail(`house rules\n  ${problems.join("\n  ")}`);
console.log("✓ house rules");

const outDir = path.join(ROOT, "dist", label);
try {
  const m = await buildSite(path.join(ROOT, "sites", label), { outDir, env, links: "pretty", label });
  console.log(`✓ built ${m.pages.length} pages (${m.indexable ? "indexable" : "noindex"})`);
} catch (e) {
  fail(e instanceof Error ? e.message : String(e));
}

const { lines, over } = await budgetReport(outDir);
console.log(lines.join("\n"));
if (over.length) fail("over the size budget");
console.log(`✓ size budget\nReady: dist/${label}`);
