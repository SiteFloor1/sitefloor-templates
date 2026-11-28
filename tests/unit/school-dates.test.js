// @ts-check
import { test } from "node:test";
import assert from "node:assert/strict";
import { rollDemoDates } from "../../src/demo/dates.js";

// The dated samples the Mercombe demo will carry (design round 1), written for the 2025–26 school year.
const SITE = {
  mode: "demo",
  schoolTerms: { items: [
    { id: "michaelmas", name: "Michaelmas Term", starts: "2025-09-03", halfTermFrom: "2025-10-17", halfTermTo: "2025-11-02", exeatFrom: "2025-11-28", exeatTo: "2025-12-01", carols: "2025-12-11", ends: "2025-12-12" },
    { id: "lent", name: "Lent Term", starts: "2026-01-07", halfTermFrom: "2026-02-13", halfTermTo: "2026-02-22", ends: "2026-03-27" },
    { id: "summer-term", name: "Summer Term", starts: "2026-04-22", halfTermFrom: "2026-05-22", halfTermTo: "2026-05-31", ends: "2026-07-03" },
  ] },
  openDays: { items: [{ id: "open-morning", date: "2025-11-15" }, { id: "taster", date: "2026-01-24" }] },
  fees: { checked: "2025-11-01" },
};
const wd = (/** @type {string} */ d) => new Date(`${d}T00:00:00Z`).getUTCDay();
const addDays = (/** @type {string} */ d, /** @type {number} */ n) => new Date(Date.parse(`${d}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);

test("on 28 November 2026 the card shows this Michaelmas Term, its start rightly behind today", () => {
  const r = rollDemoDates(SITE, "2026-11-28");
  const m = r.schoolTerms.items[0];
  assert.ok(m.starts < "2026-11-28" && m.ends >= "2026-11-28", `${m.starts} to ${m.ends}`);
  assert.equal(m.starts.slice(0, 7), "2026-09");
  assert.equal(r.schoolTerms.items[1].starts.slice(0, 4), "2027");
  assert.ok(r.openDays.items.every((/** @type {any} */ o) => o.date >= "2026-11-28"));
  assert.equal(r.fees.checked, "2025-11-01");
});

test("every day for two years: terms end today or later, keep weekdays, gaps and order; open days stay Saturdays", () => {
  for (let n = 0; n < 730; n++) {
    const on = addDays("2026-11-28", n);
    const r = rollDemoDates(SITE, on);
    r.schoolTerms.items.forEach((/** @type {any} */ t, /** @type {number} */ i) => {
      const was = /** @type {any} */ (SITE.schoolTerms.items[i]);
      assert.ok(t.ends >= on, `${on} ${t.id} ended ${t.ends}`);
      assert.equal(wd(t.starts), wd(was.starts), `${on} ${t.id} start weekday`);
      for (const k of Object.keys(was).filter((key) => /^\d{4}-/.test(was[key]))) {
        assert.equal(Date.parse(t[k]) - Date.parse(t.starts), Date.parse(was[k]) - Date.parse(was.starts), `${on} ${t.id} ${k} gap`);
      }
    });
    for (const o of r.openDays.items) { assert.ok(o.date >= on); assert.equal(wd(o.date), 6, `${on} ${o.id} not a Saturday`); }
  }
});
