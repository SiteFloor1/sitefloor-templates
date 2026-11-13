import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { queueFromCsv, waitMinutes, waitWords, busyHours, openHourCount, quietestAhead, hourWord, busyGrid } from "../../src/core/lib/queue.js";
import { compareMemberships, loyaltyYear, pounds, cutsPerMonth } from "../../src/core/lib/savings.js";
import { isAllowedAmount, voucherMessage } from "../../src/core/lib/vouchers.js";
import { planVisit, bestTimeToday, reminderIcs } from "../../src/core/lib/fit-cut.js";
import { validateSite as validate } from "../../src/core/lib/config.js";
import { loadCatalog } from "../../scripts/lib/catalog.js";

const catalog = loadCatalog(new URL("../..", import.meta.url).pathname);
const validateSite = (site, opts = {}) => validate(site, { catalog, ...opts });
const street = () => JSON.parse(readFileSync(new URL("../../sites/demos/barber-street/site.json", import.meta.url), "utf8"));
const has = (errors, text) => errors.some((e) => e.includes(text));
const TZ = "Europe/London";
const at = (iso) => Date.parse(iso);

test("queue sheet: newest row counts; stale, future, malformed and silly numbers fail closed", () => {
  const now = at("2026-10-26T16:10:00Z"); // 16:10 GMT
  const csv = "Timestamp,Waiting\n26/10/2026 15:50:00,5\n26/10/2026 16:05:12,3\n26/10/2026 15:58:00,7\n";
  assert.deepEqual(queueFromCsv(csv, now, 15, TZ), { ok: true, waiting: 3, updatedAt: at("2026-10-26T16:05:12Z") });
  assert.deepEqual(queueFromCsv(csv, now + 30 * 60_000, 15, TZ), { ok: false, reason: "stale" });
  assert.deepEqual(queueFromCsv("Timestamp,Waiting\n26/10/2026 16:30:00,2\n", now, 15, TZ), { ok: false, reason: "stale" }, "more than 5 minutes in the future");
  assert.deepEqual(queueFromCsv("When,How many\n26/10/2026 16:05,2\n", now, 15, TZ), { ok: false, reason: "malformed" });
  assert.deepEqual(queueFromCsv("Timestamp,Waiting\n26/10/2026 16:05,lots\n26/10/2026 16:06,500\n", now, 15, TZ), { ok: false, reason: "malformed" });
  assert.deepEqual(queueFromCsv("Timestamp,Waiting\n", now, 15, TZ), { ok: false, reason: "empty" });
  assert.equal(queueFromCsv("timestamp,people waiting\n2026-10-26T16:00:00Z,0\n", now, 15, TZ).ok, true, "zero is a real answer");
});

test("queue: wait estimate, words and hours", () => {
  assert.equal(waitMinutes(0, 3, 15), 0);
  assert.equal(waitMinutes(1, 3, 15), 15);
  assert.equal(waitMinutes(3, 3, 15), 15);
  assert.equal(waitMinutes(4, 3, 15), 30);
  assert.equal(waitMinutes(2, 0, 15), 30, "no chairs counts as one");
  assert.equal(waitWords(0), "no wait");
  assert.equal(waitWords(45), "about 45 min");
  assert.equal(waitWords(60), "about 1 hr");
  assert.equal(waitWords(75), "about 1 hr 15 min");
  assert.deepEqual([0, 9, 12, 13, 23].map(hourWord), ["12am", "9am", "12pm", "1pm", "11pm"]);
});

test("queue: busyness lines up with opening hours; quietest hour still to come", () => {
  const hours = { weekly: { mon: [["07:30", "19:00"]], sun: [["10:00", "16:00"]], tue: [] } };
  assert.equal(openHourCount(hours, "mon"), 12, "7am–7pm: the 7:30 opening counts the 7am hour");
  assert.equal(openHourCount(hours, "sun"), 6);
  assert.equal(openHourCount(hours, "tue"), 0);
  const sun = busyHours({ sun: [1, 2, 2, 2, 1, 1] }, hours, "sun");
  assert.deepEqual(sun[0], { hour: 10, level: 1 });
  assert.deepEqual(quietestAhead(sun, 10 * 60 + 30), { hour: 10, level: 1 }, "this hour counts while it lasts");
  assert.deepEqual(quietestAhead(sun, 11 * 60), { hour: 14, level: 1 });
  assert.equal(quietestAhead(sun, 16 * 60), null);
  const grid = busyGrid({ mon: Array(12).fill(0), sun: [1, 2, 2, 2, 1, 1] }, hours);
  assert.equal(grid.hours[0].hour, 7);
  assert.equal(grid.rows[0].key, "mon");
  assert.equal(grid.rows.find((r) => r.key === "sun").cells[0], null, "closed at 7am on Sunday");
  assert.equal(grid.rows.find((r) => r.key === "sun").cells[3], 1, "10am on Sunday");
});

test("memberships: compared with paying each time, extra cuts at full price, best plan only if it saves", () => {
  const plans = [{ name: "Tidy", price: 28, cuts: 2 }, { name: "Sharp", price: 45, cuts: 4 }, { name: "Unlimited", price: 60, cuts: "unlimited" }];
  const weekly = compareMemberships(plans, 1, 16); // 4.33 cuts a month
  assert.equal(weekly.payg, 69.33);
  assert.equal(weekly.plans[0].cost, 65.33, "2 included + 2.33 at £16");
  assert.equal(weekly.plans[1].cost, 50.33);
  assert.equal(weekly.plans[2].cost, 60);
  assert.equal(weekly.best, "Sharp");
  const rare = compareMemberships(plans, 8, 16);
  assert.equal(rare.best, null, "nobody is told to join a plan that costs them more");
  assert.ok(rare.plans.every((p) => p.saving < 0));
  assert.ok(Math.abs(cutsPerMonth(2) - 2.1667) < 0.001);
});

test("loyalty: whole free cuts only, valued at the shop's own price", () => {
  assert.deepEqual(loyaltyYear(3, 8, 12), { cuts: 17, free: 2, value: 24, weeksPerFree: 24 });
  assert.deepEqual(loyaltyYear(8, 8, 12), { cuts: 6, free: 0, value: 0, weeksPerFree: 64 });
  assert.equal(pounds(12), "£12");
  assert.equal(pounds(69.33), "£69.33");
  assert.equal(pounds(64), "£64");
});

test("vouchers: allowed amounts and the order message", () => {
  const cfg = { amounts: [10, 25], custom: { min: 10, max: 150 }, validMonths: 24 };
  assert.equal(isAllowedAmount(25, cfg), true);
  assert.equal(isAllowedAmount(40, cfg), true);
  assert.equal(isAllowedAmount(9, cfg), false);
  assert.equal(isAllowedAmount(12.5, cfg), false);
  assert.equal(isAllowedAmount(40, { amounts: [10], validMonths: 12 }), false, "no custom range: listed amounts only");
  assert.equal(voucherMessage({ amount: 25, to: " Sam ", from: "Alex", note: "Happy  birthday!" }),
    'Hi, I\'d like a £25 gift voucher for Sam, from Alex. Message for the card: "Happy birthday!" How can I pay?');
  assert.equal(voucherMessage({ amount: 10 }), "Hi, I'd like a £10 gift voucher. How can I pay?");
});

test("the Street demo is valid", () => {
  assert.deepEqual(validateSite(street()), []);
});

test("queue settings: typos, wrong hour counts, simulated data on a client site are refused", () => {
  const s = street();
  s.queue.chairz = 3;
  s.queue.busyness.mon = [1, 2];
  s.queue.busyness.funday = [1];
  delete s.queue.busynessSource;
  const e = validateSite(s);
  assert.ok(has(e, "queue.chairz: unknown setting"));
  assert.ok(has(e, "queue.busyness.mon: 12 levels"));
  assert.ok(has(e, "queue.busyness.funday: unknown setting"));
  assert.ok(has(e, "queue.busynessSource"));
  const c = street();
  c.mode = "client";
  assert.ok(has(validateSite(c), "queue.source: simulated data is only allowed on demo sites"));
  c.queue.source = "sheet";
  c.queue.csvUrl = "https://example.com/queue.csv";
  assert.ok(has(validateSite(c), "queue.csvUrl"));
});

test("loyalty, memberships, before/after and voucher settings are checked", () => {
  const s = street();
  s.loyalty.stamps = 1;
  s.loyalty.compareService = "nope";
  s.memberships.plans[0].cuts = 0;
  s.memberships.plans[1].prize = 4;
  delete s.memberships.terms;
  s.beforeAfter.items[0].before = "https://example.com/a.jpg";
  s.vouchers.amounts = [3];
  s.vouchers.custom = { min: 50, max: 20 };
  const e = validateSite(s, { fileExists: () => false });
  for (const want of ["loyalty.stamps", "loyalty.compareService", "memberships.plans[0].cuts", "memberships.plans[1].prize: unknown setting",
    "memberships.terms", "beforeAfter.items[0].before: a photo in img/", "beforeAfter.items[0].after: file not found", "vouchers.amounts", "vouchers.custom"]) {
    assert.ok(has(e, want), `${want} in ${e.join(" | ")}`);
  }
});

test("will I make it: walk, wait, cut, walk back against the deadline and closing time", () => {
  const base = { now: 600, deadline: 645, travel: 2, back: true, wait: 15, cut: 15, closesAt: 1140 };
  assert.deepEqual(planVisit(base), { arrive: 602, inChair: 617, done: 632, finish: 634, spare: 11, fits: true, leaveBy: 611, reason: "ok" });
  assert.equal(planVisit({ ...base, back: false }).spare, 13, "no walk back");
  assert.deepEqual([planVisit({ ...base, deadline: 620 }).reason, planVisit({ ...base, deadline: 620 }).spare], ["deadline", -14]);
  assert.equal(planVisit({ ...base, closesAt: 625 }).reason, "closing", "the cut has to finish before the shop shuts");
  assert.equal(planVisit({ ...base, closesAt: null }).reason, "closed");
});

test("will I make it: the best time left today is the quietest hour by the shop's own busyness", () => {
  const day = [{ hour: 10, level: 2 }, { hour: 11, level: 0 }, { hour: 12, level: 3 }];
  const o = { now: 600, cut: 15, closesAt: 780 };
  assert.deepEqual(bestTimeToday(day, o), { at: 660, level: 0 });
  assert.deepEqual(bestTimeToday(day, { ...o, now: 700 }), { at: 720, level: 3 }, "only what's left, at least 15 minutes from now");
  assert.equal(bestTimeToday(day, { ...o, now: 700, closesAt: 730 }), null, "nothing finishes before closing");
  assert.equal(bestTimeToday(day, { ...o, closesAt: null }), null);
  assert.deepEqual(bestTimeToday([{ hour: 10, level: 1 }, { hour: 11, level: 1 }], o), { at: 615, level: 1 }, "ties go to the earliest");
});

test("will I make it: the reminder is a calendar event in UTC with a 15-minute alert", () => {
  const ics = reminderIcs({ startMs: Date.parse("2026-10-26T14:00:00Z"), minutes: 20, title: "Skin fade at Swift Cuts", place: "Swift Cuts, Leeds", note: "Walk-in; check the queue", uid: "x@sitefloor", stamp: new Date("2026-10-26T12:00:00Z") });
  assert.match(ics, /^BEGIN:VCALENDAR\r\n/);
  assert.match(ics, /DTSTART:20261026T140000Z\r\n/);
  assert.match(ics, /DTEND:20261026T142000Z\r\n/);
  assert.match(ics, /DTSTAMP:20261026T120000Z/);
  assert.doesNotMatch(ics, /TZID/, "no local time zone references that need a VTIMEZONE block");
  assert.match(ics, /LOCATION:Swift Cuts\\, Leeds/);
  assert.match(ics, /DESCRIPTION:Walk-in\\; check the queue/);
  assert.match(ics, /TRIGGER:-PT15M/);
});
