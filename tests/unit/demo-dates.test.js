// @ts-check
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { rollDemoDates, slots, FORWARD, PAST, IGNORED, PAST_EXAMPLE } from "../../src/demo/dates.js";

const DEMOS = readdirSync("sites/demos").sort().map((d) => ({ d, site: JSON.parse(readFileSync(`sites/demos/${d}/site.json`, "utf8")) }));
const FIXTURES = readdirSync("tests/fixtures/sites").sort().map((d) => JSON.parse(readFileSync(`tests/fixtures/sites/${d}/site.json`, "utf8")));
const DATE = /\d{4}-\d\d-\d\d/;
const today = new Date().toISOString().slice(0, 10);
const day = (/** @type {string} */ v) => v.slice(0, 10);
const addDays = (/** @type {string} */ d, /** @type {number} */ n) => new Date(Date.parse(`${d}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);

/** Every string holding a date, by path with array indexes as []. @param {any} v @param {string} p @param {string[]} out */
function dated(v, p, out) {
  if (typeof v === "string") { if (DATE.test(v)) out.push(p); }
  else if (Array.isArray(v)) v.forEach((x) => dated(x, `${p}[]`, out));
  else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) dated(x, p ? `${p}.${k}` : k, out);
  return out;
}
const classified = new Set([
  ...FORWARD.flatMap((r) => ("paths" in r ? r.paths : "path" in r ? [r.path] : r.keys.flatMap((k) => [`${r.list}[].${k}`, `${r.list}.${k}`]))),
  ...PAST, ...IGNORED,
]);

test("every dated field a demo carries is classed in src/demo/dates.js (forward, past or not a date)", () => {
  const unknown = DEMOS.flatMap(({ d, site }) => [...new Set(dated(site, "", []))].filter((p) => !classified.has(p)).map((p) => `${d}: ${p}`));
  assert.deepEqual(unknown, [], "class each one in FORWARD, PAST or IGNORED");
});

/**
 * A rule's date sets, each a list of values that move together, read straight from the rolled site.json. A sample
 * sheet's rows marked "Already happened" are left out: they are meant to be past.
 * @param {any} site @param {import("../../src/demo/dates.js").Rule} r
 */
function sets(site, r) {
  if (r.kind === "season") {
    return slots(site, r.list).flatMap(([h, k]) => (Array.isArray(h[k]) ? h[k] : h[k] && typeof h[k] === "object" ? [h[k]] : []))
      .map((item) => r.keys.map((key) => item?.[key]).filter((v) => typeof v === "string"));
  }
  if (r.kind === "csv-week") {
    return slots(site, r.path).map(([h, k]) => {
      const [head, ...rows] = String(h[k]).split("\n");
      const at = r.columns.map((c) => head.split(",").indexOf(c));
      return rows.filter((row) => !PAST_EXAMPLE.test(row)).flatMap((row) => at.map((i) => row.split(",")[i])).filter((v) => DATE.test(v ?? ""));
    });
  }
  const values = r.paths.flatMap((p) => slots(site, p)).map(([h, k]) => h[k]).filter((v) => typeof v === "string");
  return r.kind === "week" ? [values] : values.map((v) => [v]);
}

/**
 * The test's own rule, not the code's: what a visitor reads must not be in the past. One-off dates (every one, a
 * retreat's balance date included) and calendar days are today or later; a window (a season, a pre-order, the advent)
 * still ends today or later and keeps its dates in their written order; a "last updated" stamp is within the week; a
 * month is this month. @param {import("../../src/demo/dates.js").Rule} r @param {string[]} set @param {string} on
 * @param {string[]} [written] the same set before rolling, for the order of a window's dates
 */
function problem(r, set, on, written) {
  if (!set.length) return null;
  const days = set.map(day);
  if (r.kind === "season") {
    if ([...days].sort().at(-1) < on) return `window ended ${[...days].sort().at(-1)}`;
    const order = (/** @type {string[]} */ ds) => ds.map((_, i) => i).sort((x, y) => ds[x].localeCompare(ds[y]) || x - y).join();
    return written && order(days) !== order(written.map(day)) ? `dates out of their written order: ${days.join(", ")}` : null;
  }
  if (r.kind === "recent") return days[0] > on || days[0] <= addDays(on, -8) ? `stamp ${days[0]} isn't within the last week` : null;
  if (r.kind === "month") return set[0] !== on.slice(0, 7) ? `month ${set[0]} isn't this month` : null;
  const past = days.filter((d) => d < on);
  return past.length ? `past: ${past.join(", ")}` : null;
}

test("no demo shows a forward-looking date in the past: every other day for four years from today", () => {
  // Every other day for four years from today (a window or a pull-back can go wrong on only a few days a year).
  const days = Array.from({ length: 731 }, (_, n) => addDays(today, n * 2));
  const bad = [];
  const name = (/** @type {import("../../src/demo/dates.js").Rule} */ r) => ("paths" in r ? r.paths[0] : "list" in r ? r.list : r.path);
  for (const on of days) {
    for (const { d, site } of DEMOS) {
      const rolled = rollDemoDates(site, on);
      bad.push(...FORWARD.flatMap((r) => { const before = sets(site, r); return sets(rolled, r).map((set, i) => problem(r, set, on, before[i])).filter(Boolean).map((p) => `${on} ${d} ${name(r)}: ${p}`); }));
    }
  }
  assert.deepEqual(bad.slice(0, 20), []);
});

test("past-tense dates stay put and are never in the future", () => {
  for (const { d, site } of DEMOS) {
    const rolled = rollDemoDates(site, addDays(today, 400));
    for (const p of PAST.filter((x) => x !== "insights.sample")) {
      const before = slots(site, p).map(([h, k]) => h[k]), after = slots(rolled, p).map(([h, k]) => h[k]);
      assert.deepEqual(after, before, `${d} ${p} moved`);
      for (const v of before.filter((x) => typeof x === "string" && DATE.test(x))) assert.ok(day(v) <= today, `${d} ${p}: ${v} is in the future`);
    }
  }
});

test("weekdays and gaps survive a move; a client's site.json is never touched", () => {
  const { site } = /** @type {{ site: any }} */ (DEMOS.find((x) => x.d === "bridal"));
  const rolled = rollDemoDates(site, addDays(today, 200));
  const wd = (/** @type {string} */ v) => new Date(`${day(v)}T00:00:00Z`).getUTCDay();
  site.trunkShows.items.forEach((/** @type {any} */ t, /** @type {number} */ i) => {
    assert.equal(wd(rolled.trunkShows.items[i].from), wd(t.from));
    assert.equal(Date.parse(rolled.trunkShows.items[i].to) - Date.parse(rolled.trunkShows.items[i].from), Date.parse(t.to) - Date.parse(t.from));
  });
  for (const f of FIXTURES) assert.equal(rollDemoDates(f, addDays(today, 400)), f, f.id);
});

test("demo providers work dates out on the day: no fixed date in src/demo (outside the rules in dates.js)", () => {
  const files = readdirSync("src/demo").filter((f) => f.endsWith(".js") && f !== "dates.js");
  const fixed = files.filter((f) => /["'`]\d{4}-\d\d-\d\d/.test(readFileSync(`src/demo/${f}`, "utf8")));
  assert.deepEqual(fixed, []);
});

test("every demo, with its dates moved, still passes its site.json checks: today and on days up to five years ahead", async () => {
  const { validateSite } = await import("../../src/core/lib/config.js");
  const { loadCatalog } = await import("../../scripts/lib/catalog.js");
  const { existsSync, statSync } = await import("node:fs");
  const catalog = loadCatalog(process.cwd());
  const bad = [];
  for (const on of [today, ...Array.from({ length: 12 }, (_, n) => addDays(today, 23 + n * 151))]) {
    for (const { d, site } of DEMOS) {
      const dir = `sites/demos/${d}`;
      const errors = validateSite(rollDemoDates(site, on), {
        catalog,
        fileExists: (/** @type {string} */ rel) => existsSync(`${dir}/${rel}`),
        fileSize: (/** @type {string} */ rel) => (existsSync(`${dir}/${rel}`) ? statSync(`${dir}/${rel}`).size : null),
        fileText: (/** @type {string} */ rel) => readFileSync(`${dir}/${rel}`, "utf8"),
      });
      if (errors.length) bad.push(`${on} ${d}: ${errors[0]}`);
    }
  }
  assert.deepEqual(bad.slice(0, 10), []);
});

test("dates written together keep their order after a move (order by before collect from, balance before the start…)", () => {
  /** Pairs of date keys on one object whose order changed. @param {any} a @param {any} b @param {string} p @param {string[]} out */
  const walk = (a, b, p, out) => {
    if (Array.isArray(a)) { a.forEach((x, i) => walk(x, b?.[i], `${p}[${i}]`, out)); return out; }
    if (!a || typeof a !== "object") return out;
    const keys = Object.keys(a).filter((k) => typeof a[k] === "string" && /^\d{4}-\d\d-\d\d/.test(a[k]));
    for (const x of keys) for (const y of keys) if (day(a[x]) < day(a[y]) && !(day(b[x]) <= day(b[y]))) out.push(`${p}: ${x} ${b[x]} is now after ${y} ${b[y]}`);
    for (const k of Object.keys(a)) if (a[k] && typeof a[k] === "object") walk(a[k], b?.[k], `${p}.${k}`, out);
    return out;
  };
  const bad = [];
  for (let n = 0; n < 1461; n += 3) for (const { d, site } of DEMOS) bad.push(...walk(site, rollDemoDates(site, addDays(today, n)), d, []).map((x) => `${addDays(today, n)} ${x}`));
  assert.deepEqual(bad.slice(0, 10), []);
});
