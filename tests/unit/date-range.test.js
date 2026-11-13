import { test } from "node:test";
import assert from "node:assert/strict";
import { dayState, checkRange, slotsOn, monthWeeks, dayLabel, blockedFromRows, checkRangeRules, firstFree, openingOn } from "../../src/core/lib/date-range.js";

const weekday = [["09:00", "18:00"]];
const hours = { weekly: { mon: weekday, tue: weekday, wed: weekday, thu: weekday, fri: weekday, sat: [["09:00", "13:00"]], sun: [] }, timezone: "Europe/London" };
/** @type {import("../../src/core/lib/date-range.js").RangeRules} */
const rules = { hours, region: "england-wales", bankHolidays: "closed", horizonDays: 120, leadHours: 24, minDays: 1, maxDays: 14, slots: ["10:00", "14:00", "18:00"] };
const now = { date: "2026-10-29", weekday: 4, minutes: 600 }; // Thursday 10:00 on the shop's clock

test("days: past, too soon, free, closed, far, and the shop's bank holidays", () => {
  assert.equal(dayState("2026-10-28", rules, now), "past");
  assert.equal(dayState("2026-10-29", rules, now), "soon");
  assert.equal(dayState("2026-10-30", rules, now), "free"); // 24 hours' notice: Friday 10:00 is the first slot
  assert.equal(dayState("2026-10-30", rules, { ...now, minutes: 18 * 60 + 30 }), "soon"); // notice runs past Friday's last slot
  assert.equal(dayState("2026-11-01", rules, now), "closed"); // Sunday
  assert.equal(dayState("2026-12-28", rules, now), "closed"); // Boxing Day's substitute bank holiday
  assert.equal(dayState("2027-02-27", rules, now), "far");
  const open = { ...rules, hours: { ...hours, exceptions: [{ date: "2026-12-28", ranges: [["10:00", "14:00"]] }] } };
  assert.equal(dayState("2026-12-28", open, now), "free", "an hours exception for the date beats the bank-holiday rule");
  assert.equal(dayState("2026-12-28", { ...rules, bankHolidays: "open" }, now), "free");
});

test("days blocked on the Sheet are taken; an unreadable Sheet blocks nothing", () => {
  const sheet = blockedFromRows([["date"], ["2026-11-07"], [" 2026-11-10 "], ["not a date"]]);
  assert.deepEqual(sheet, { status: "ok", dates: ["2026-11-07", "2026-11-10"] });
  assert.equal(dayState("2026-11-07", rules, now, sheet), "taken");
  assert.equal(dayState("2026-11-07", rules, now, blockedFromRows(null)), "free");
});

test("times: only the shop's slots inside that day's hours, and after the notice", () => {
  assert.deepEqual(slotsOn("2026-11-06", rules), ["10:00", "14:00", "18:00"]);
  assert.deepEqual(slotsOn("2026-11-07", rules), ["10:00"]); // Saturday closes at 13:00
  // An hour-long appointment must end by closing: 18:00 goes on Friday (closes 18:00), and Saturday's 10:00 still fits.
  assert.deepEqual(slotsOn("2026-11-06", { ...rules, slotMinutes: 60 }), ["10:00", "14:00"]);
  assert.deepEqual(slotsOn("2026-11-07", { ...rules, slotMinutes: 60 }), ["10:00"]);
  /** @type {string[]} */ const bad = [];
  checkRangeRules({ horizonDays: 30, bankHolidays: "closed", slotMinutes: 900 }, "r", (at) => bad.push(at));
  assert.deepEqual(bad, ["r.slotMinutes"]);
  assert.deepEqual(slotsOn("2026-11-08", rules), []); // Sunday closed
  assert.deepEqual(openingOn("2026-11-08", rules), []);
  assert.equal(firstFree(rules, { ...now, minutes: 19 * 60 }), "2026-10-31"); // Thursday 19:00 + 24h: Friday's slots gone, Saturday 10:00
});

test("a weekend hire: nights, exact hours, 24-hour periods and weekend days", () => {
  const r = checkRange({ from: "2026-11-06", fromTime: "10:00", to: "2026-11-09", toTime: "14:00" }, rules, now);
  assert.equal(r.ok, true, r.reason);
  assert.equal(r.nights, 3);
  assert.equal(r.hours, 76);
  assert.equal(r.periods, 4, "three nights, and the return is later in the day than the pick-up");
  assert.deepEqual(r.dates, ["2026-11-06", "2026-11-07", "2026-11-08", "2026-11-09"]);
  assert.equal(r.weekendDays, 2);
});

test("hours across the clocks going forward use the UK clock", () => {
  const spring = { date: "2027-03-20", weekday: 6, minutes: 600 };
  // Good Friday (26 March) and Easter Monday (29 March) are closed, so Thursday to Tuesday, through the change on the 28th.
  assert.equal(dayState("2027-03-26", rules, spring), "closed");
  const r = checkRange({ from: "2027-03-25", fromTime: "10:00", to: "2027-03-30", toTime: "10:00" }, rules, spring);
  assert.equal(r.ok, true, r.reason);
  assert.equal(r.hours, 119);
  assert.equal(r.periods, 5);
});

test("hours across the clocks going back still count days on the UK clock (audit Q-01)", () => {
  const autumn = { date: "2027-10-20", weekday: 3, minutes: 600 };
  const r = checkRange({ from: "2027-10-29", fromTime: "10:00", to: "2027-11-01", toTime: "10:00" }, { ...rules, maxDays: 3 }, autumn);
  assert.equal(r.ok, true, r.reason);
  assert.equal(r.hours, 73, "the exact time, for display");
  assert.equal(r.periods, 3, "Friday 10:00 to Monday 10:00 is three days, whatever the clocks do");
  const sameDay = checkRange({ from: "2027-10-29", fromTime: "10:00", to: "2027-10-29", toTime: "18:00" }, rules, autumn);
  assert.equal(sameDay.periods, 1);
  const earlier = checkRange({ from: "2027-10-29", fromTime: "14:00", to: "2027-10-30", toTime: "10:00" }, rules, autumn);
  assert.equal(earlier.periods, 1, "back the next morning, before the pick-up time: one day");
});

test("ranges that break the rules say why, in plain words", () => {
  const no = (/** @type {any} */ sel, /** @type {RegExp} */ why, blocked = null) => {
    const r = checkRange(sel, rules, now, blocked);
    assert.equal(r.ok, false);
    assert.match(r.reason ?? "", why);
  };
  no({}, /Choose a pick-up date/);
  no({ from: "2026-10-29", fromTime: "14:00" }, /too soon.*24 hours/);
  no({ from: "2026-11-01", fromTime: "10:00" }, /closed on Sunday 1 November/);
  no({ from: "2026-11-06" }, /Choose a pick-up time/);
  no({ from: "2026-11-07", fromTime: "14:00", to: "2026-11-09", toTime: "10:00" }, /14:00 isn't one of our times on Saturday 7 November; choose 10:00/);
  no({ from: "2026-11-06", fromTime: "10:00", to: "2026-11-08", toTime: "10:00" }, /closed on Sunday 8 November/);
  no({ from: "2026-11-06", fromTime: "10:00", to: "2026-11-05", toTime: "10:00" }, /before the pick-up date/);
  no({ from: "2026-11-06", fromTime: "14:00", to: "2026-11-06", toTime: "10:00" }, /return time is before/);
  no({ from: "2026-11-02", fromTime: "10:00", to: "2026-11-20", toTime: "10:00" }, /longest hire is 14 days/);
  no({ from: "2026-11-06", fromTime: "10:00", to: "2026-11-09", toTime: "10:00" }, /Saturday 7 November is taken/, { status: "ok", dates: ["2026-11-07"] });
});

test("without slots the range is dates only, counted in nights", () => {
  const plain = { ...rules, slots: undefined, leadHours: 0, minDays: 2 };
  assert.equal(checkRange({ from: "2026-11-02", to: "2026-11-03" }, plain, now).reason, "The shortest hire is 2 nights.");
  const r = checkRange({ from: "2026-11-02", to: "2026-11-05" }, plain, now);
  assert.equal(r.ok, true);
  assert.equal(r.periods, 3);
  assert.equal(r.hours, undefined);
});

test("single mode: one date and one time, for an appointment", () => {
  const appt = { ...rules, single: true, leadHours: 48 };
  assert.equal(checkRange({ from: "2026-10-30", fromTime: "10:00" }, appt, now).ok, false);
  const r = checkRange({ from: "2026-10-31", fromTime: "10:00" }, appt, now);
  assert.equal(r.ok, true, r.reason);
  assert.deepEqual(r.dates, ["2026-10-31"]);
  assert.equal(checkRange({ from: "2026-11-02" }, appt, now).reason, "Choose a time.");
});

test("calendar weeks start on Monday and each day reads as a sentence", () => {
  const weeks = monthWeeks(2026, 11);
  assert.equal(weeks.length, 6);
  assert.deepEqual(weeks[0], [null, null, null, null, null, null, "2026-11-01"]);
  assert.equal(weeks[5][0], "2026-11-30");
  assert.equal(monthWeeks(2027, 2).length, 4, "February 2027 starts on a Monday");
  assert.equal(dayLabel("2026-11-14", "free"), "Saturday 14 November, free");
  assert.equal(dayLabel("2026-11-15", "closed"), "Sunday 15 November, closed");
});

test("picker rules are checked before a site ships", () => {
  const errs = [];
  const err = (/** @type {string} */ p, /** @type {string} */ m) => errs.push(`${p}: ${m}`);
  checkRangeRules({ horizonDays: 180, bankHolidays: "closed", leadHours: 24, minDays: 1, maxDays: 14, slots: ["10:00", "18:00"] }, "x", err);
  assert.deepEqual(errs, []);
  checkRangeRules({ horizonDays: 0, bankHolidays: "maybe", minDays: 3, maxDays: 2, slots: ["18:00", "10:00"], colour: "red" }, "x", err);
  for (const k of ["x.colour", "x.horizonDays", "x.bankHolidays", "x.maxDays", "x.slots"]) assert.ok(errs.some((e) => e.startsWith(`${k}:`)), k);
});

test("the picker's markup: plain inputs that work without JavaScript, hooks for the script, a reserved calendar box", async () => {
  const { default: nunjucks } = await import("nunjucks");
  const env = new nunjucks.Environment(new nunjucks.FileSystemLoader(new URL("../../src", import.meta.url).pathname), { autoescape: true });
  env.addFilter("enabled", () => true);
  const rangeRules = { horizonDays: 180, bankHolidays: "closed", leadHours: 24, slots: ["10:00", "18:00"] };
  const html = env.render("features/date-range/date-range.njk", { dr: { id: "hire", region: "england-wales", rules: rangeRules, from: "Pick-up", to: "Return" } });
  assert.match(html, /data-feature="date-range" data-dr="hire" data-dr-region="england-wales"/);
  assert.match(html, /data-dr-rules="\{&quot;horizonDays&quot;:180/);
  assert.match(html, /<label class="dr-field" for="hire-from"><span>Pick-up<\/span>\s*<input type="date" id="hire-from"/);
  assert.match(html, /<label class="dr-field" for="hire-to"><span>Return<\/span>/);
  assert.equal((html.match(/<option value="18:00">/g) ?? []).length, 2, "a time list for pick-up and for return");
  assert.match(html, /data-js-only data-dr-cal/);
  assert.match(html, /class="dr-sheet" data-js-only data-dr-sheet role="status"/, "the Sheet note sits in the reserved box");
  assert.match(html, /data-no-js>Choose your dates above/);
  assert.match(html, /role="status" data-dr-status/);
  const one = env.render("features/date-range/date-range.njk", { dr: { id: "appt", region: "scotland", rules: { ...rangeRules, single: true } } });
  assert.doesNotMatch(one, /appt-to/);
  assert.match(one, /<legend class="dr-legend">Your date<\/legend>/);
  const off = new nunjucks.Environment(new nunjucks.FileSystemLoader(new URL("../../src", import.meta.url).pathname));
  off.addFilter("enabled", () => false);
  assert.equal(off.render("features/date-range/date-range.njk", { dr: { id: "x", rules: rangeRules } }).trim(), "");
});
