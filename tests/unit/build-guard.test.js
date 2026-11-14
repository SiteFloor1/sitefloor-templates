// @ts-check
import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { buildSite, assertOutsideSources } from "../../scripts/build.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const demo = path.join(ROOT, "sites/demos/barber");

test("the build refuses to write inside sites/ or over site sources, before touching anything", async () => {
  for (const out of ["sites/demos/barber", "sites/demos/barber/dist", "sites/clients/x", "sites", ".", "tests/fixtures/sites/test-barber-client"]) {
    assert.throws(() => assertOutsideSources(path.join(ROOT, out), demo), /Refusing to build into .*Build into dist\//, out);
  }
  await assert.rejects(buildSite(demo, { outDir: path.join(ROOT, "dist/../sites/demos/barber"), env: "preview", links: "pretty", label: "x" }), /Refusing to build into sites\/demos\/barber/);
  assert.ok(existsSync(path.join(demo, "site.json")), "the demo's source is untouched");
  assert.doesNotThrow(() => assertOutsideSources(path.join(ROOT, "dist/demos/barber"), demo));
  assert.doesNotThrow(() => assertOutsideSources(path.join(ROOT, "dist/_fixtures/test-barber-client"), path.join(ROOT, "tests/fixtures/sites/test-barber-client")));
});

test("--today pins every build-time clock: the same site built on different real days is the same", async () => {
  const { buildNow } = await import("../../src/core/lib/build-day.js");
  process.env.SITEFLOOR_BUILD_DAY = "2026-11-13";
  assert.equal(new Date(buildNow()).toISOString(), "2026-11-13T12:00:00.000Z");
  delete process.env.SITEFLOOR_BUILD_DAY;
  assert.ok(Math.abs(buildNow() - Date.now()) < 1000);
  // Build-time kit code reads the clock only through buildNow().
  const { readdirSync, readFileSync } = await import("node:fs");
  const leaks = readdirSync("src/kits").flatMap((k) => ["kit.js", "eleventy.js", "build.js"].map((f) => `src/kits/${k}/${f}`))
    .filter((f) => existsSync(f) && /new Date\(\)|Date\.now\(\)/.test(readFileSync(f, "utf8")));
  assert.deepEqual(leaks, []);
});
