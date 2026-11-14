import { test } from "node:test";
import assert from "node:assert/strict";
import { activeSeason, easter, suggestSeasons, checkSeasons } from "../../src/core/lib/seasons.js";

const s = (from, to, name = "x") => ({ name, from, to, banner: "b" });

test("the season covering a date shows; a short one inside a long one wins", () => {
  const list = [s("2026-12-01", "2026-12-31", "Christmas"), s("2026-11-23", "2026-11-30", "Black Friday"), s("2026-12-20", "2026-12-24", "Last orders")];
  assert.equal(activeSeason(list, "2026-11-30"), 1);
  assert.equal(activeSeason(list, "2026-12-01"), 0);
  assert.equal(activeSeason(list, "2026-12-22"), 2);
  assert.equal(activeSeason(list, "2026-12-31"), 0);
  assert.equal(activeSeason(list, "2027-01-01"), -1);
});

test("moving UK dates are worked out, not typed in", () => {
  assert.equal(easter(2026), "2026-04-05");
  assert.equal(easter(2027), "2027-03-28");
  assert.equal(easter(2030), "2030-04-21");
  const y26 = Object.fromEntries(suggestSeasons(2026).map((x) => [x.preset, x]));
  assert.equal(y26["mothers-day"].to, "2026-03-15");
  assert.equal(y26["fathers-day"].to, "2026-06-21");
  assert.equal(y26["black-friday"].from, "2026-11-23"); // Black Friday 27 Nov 2026
  assert.equal(y26.ramadan.approximate, true);
  const y27 = Object.fromEntries(suggestSeasons(2027).map((x) => [x.preset, x]));
  assert.equal(y27["mothers-day"].to, "2027-03-07");
  assert.ok(!suggestSeasons(2031).some((x) => x.preset === "ramadan")); // no lunar dates on file: not guessed
});

test("season settings are checked", () => {
  const errors = [];
  const err = (p, m) => errors.push(`${p}: ${m}`);
  checkSeasons([
    { name: "", from: "2026-12-31", to: "2026-12-01", banner: "b" },
    { name: "Long", from: "2026-01-01", to: "2026-12-31", banner: "b" },
    { name: "Bad", from: "2026-01-01", to: "2026-01-02", banner: "", tint: "neon", link: { label: "x", href: "javascript:x" } },
  ], err, (h) => /^(#|\/|https:\/\/)/.test(h ?? ""));
  for (const f of ["seasons[0].name", "ends before", "more than 120 days", "seasons[2].banner", "seasons[2].tint", "seasons[2].link"]) assert.ok(errors.some((e) => e.includes(f)), f);
});

test("Eid, Ramadan and Diwali are on file through 2030, each window around its day (checked 14 Nov 2026)", () => {
  /** @param {number} y @param {string} id */
  const w = (y, id) => suggestSeasons(y).find((x) => x.preset === id);
  // The day itself, from the comment above LUNAR in seasons.js.
  const days = { "eid-al-fitr": { 2028: "2028-02-27", 2029: "2029-02-15", 2030: "2030-02-05" }, "eid-al-adha": { 2028: "2028-05-05", 2029: "2029-04-24", 2030: "2030-04-14" }, diwali: { 2028: "2028-10-17", 2029: "2029-11-05", 2030: "2030-10-26" } };
  const span = { "eid-al-fitr": [-2, 2], "eid-al-adha": [-3, 2], diwali: [-4, 1] };
  const add = (/** @type {string} */ d, /** @type {number} */ n) => new Date(Date.parse(`${d}T12:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
  for (const [id, byYear] of Object.entries(days)) {
    for (const [y, d] of Object.entries(byYear)) {
      const s = w(Number(y), id);
      assert.ok(s, `${id} ${y}`);
      assert.deepEqual([s.from, s.to], [add(d, span[/** @type {keyof typeof span} */ (id)][0]), add(d, span[/** @type {keyof typeof span} */ (id)][1])], `${id} ${y}`);
    }
  }
  for (const y of [2028, 2029, 2030]) assert.equal(w(y, "ramadan")?.to, add(days["eid-al-fitr"][/** @type {2028} */ (y)], -1), `ramadan ${y}`);
});
