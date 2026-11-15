import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { countWord, weekdayIndex, weekStart, hoursOf, diaryWeek, diaryFromCsv, firstMonth, sessionsIcs, utcStamp } from "../../src/kits/trainer/lib/trainer.js";
import { HOME_PARTS, homeOrderProblem } from "../../src/kits/trainer/home.js";
import { validateSite } from "../../src/core/lib/config.js";
import { loadCatalog } from "../../scripts/lib/catalog.js";

const demo = JSON.parse(readFileSync("sites/demos/trainer/site.json", "utf8"));
const client = JSON.parse(readFileSync("tests/fixtures/sites/test-trainer-client/site.json", "utf8"));
const catalog = loadCatalog(process.cwd());
const errorsFor = (/** @type {(s: any) => void} */ change, base = demo) => { const s = structuredClone(base); change(s); return validateSite(s, { catalog }).join("\n"); };
const TZ = "Europe/London";
const WEEK = { days: ["mon", "tue", "wed", "thu", "fri", "sat"], from: "06:00", to: "20:00" };

test("the demo and the client fixture are valid", () => {
  assert.deepEqual(validateSite(demo, { catalog }), []);
  assert.deepEqual(validateSite(client, { catalog }), []);
});

test("words and weekdays", () => {
  assert.equal(countWord(5), "Five");
  assert.equal(countWord(0), "No");
  assert.equal(countWord(14), "14");
  assert.equal(weekdayIndex("2026-11-16"), 0); // Monday
  assert.equal(weekdayIndex("2026-11-22"), 6); // Sunday
  assert.deepEqual(hoursOf("06:00", "09:00"), ["06:00", "07:00", "08:00", "09:00"]);
});

test("the diary shows this week, or next week once the last working day has gone", () => {
  assert.equal(weekStart("2026-11-18", WEEK.days), "2026-11-16"); // Wednesday → this Monday
  assert.equal(weekStart("2026-11-21", WEEK.days), "2026-11-16"); // Saturday, still a working day
  assert.equal(weekStart("2026-11-22", WEEK.days), "2026-11-23"); // Sunday → next Monday
  assert.equal(weekStart("2026-11-20", ["mon", "tue", "wed", "thu"]), "2026-11-23"); // Friday after a Thursday finish
});

test("open hours that have passed are not offered; earlier days read as gone", () => {
  const open = [{ date: "2026-11-16", time: "06:00" }, { date: "2026-11-18", time: "07:00" }, { date: "2026-11-18", time: "18:00" }, { date: "2026-11-21", time: "08:00" }];
  const w = diaryWeek(WEEK, open, "2026-11-18", 10 * 60 + 30);
  assert.equal(w.monday, "2026-11-16");
  assert.equal(w.days.length, 6);
  assert.equal(w.hours.length, 15);
  assert.deepEqual(w.open, [{ date: "2026-11-18", time: "18:00" }, { date: "2026-11-21", time: "08:00" }]);
  assert.equal(w.days[0].gone, true);
  assert.equal(w.days[2].gone, false);
  assert.equal(w.days[2].cells.find((c) => c.time === "07:00")?.passed, true);
  assert.equal(w.days[2].cells.find((c) => c.time === "11:00")?.passed, false);
});

test("the sheet fails closed", () => {
  const now = Date.parse("2026-11-16T09:00:00Z");
  const good = "date,time,updated_at\n2026-11-18,07:00,2026-11-16 08:30\n2026-11-16,18:00,\n2026-11-18,07:00,\n2026-11-19,07:30,\nnot a date,08:00,";
  const r = diaryFromCsv(good, now, TZ, 36);
  assert.equal(r.ok, true);
  assert.deepEqual(r.ok && r.open, [{ date: "2026-11-16", time: "18:00" }, { date: "2026-11-18", time: "07:00" }]); // deduped, half hours and bad rows ignored
  assert.equal(diaryFromCsv(good, now + 40 * 3_600_000, TZ, 36).ok, false, "stale");
  assert.equal(diaryFromCsv("date,time,updated_at,name\n2026-11-18,07:00,2026-11-16 08:30,Sam", now, TZ, 36).ok, false, "a name in the sheet");
  assert.equal(diaryFromCsv("date,time\n2026-11-18,07:00", now, TZ, 36).ok, false, "no updated_at column");
  assert.equal(diaryFromCsv("date,time,updated_at\n2026-11-18,07:00,soon", now, TZ, 36).ok, false, "unreadable stamp");
  assert.equal(diaryFromCsv("", now, TZ, 36).ok, false);
});

test("the first month keeps the first session's weekday pattern and prices it from the trainer's own figures", () => {
  const prices = { first: 120, session: { 1: 115, 2: 110, 3: 105 }, travel: 20 };
  const twice = firstMonth({ date: "2026-11-16", time: "06:00" }, 2, prices, false); // a Monday: Mon and Thu
  assert.deepEqual(twice.dates, ["2026-11-19", "2026-11-23", "2026-11-26", "2026-11-30", "2026-12-03", "2026-12-07", "2026-12-10"]);
  assert.equal(twice.total, 120 + 110 * 7);
  assert.equal(twice.sessions, 8);
  const home3 = firstMonth({ date: "2026-11-18", time: "07:00" }, 3, prices, true); // a Wednesday: Wed, Fri, Sun→Mon
  assert.equal(home3.first.price, 140);
  assert.equal(home3.each, 125);
  assert.equal(home3.dates.length, 11);
  assert.equal(home3.total, 140 + 125 * 11);
  assert.ok(home3.dates.every((d) => weekdayIndex(d) !== 6), "never a Sunday");
  assert.equal(firstMonth({ date: "2026-11-16", time: "06:00" }, 1, { first: 90, session: { 1: 80 } }, true).each, 80, "no travel price, none added");
});

test("the calendar file carries every session in UTC, across the clocks going back", () => {
  assert.equal(utcStamp("2026-07-01", "07:00", TZ), "20260701T060000Z"); // BST
  assert.equal(utcStamp("2026-11-16", "07:00", TZ), "20261116T070000Z"); // GMT
  const ics = sessionsIcs({ sessions: [{ date: "2026-10-23", time: "07:00", title: "First session" }, { date: "2026-10-26", time: "07:00", title: "Session" }], minutes: 60, name: "Marrick", place: "Marrick, 9 Elystan Mews, London", tz: TZ, stamp: "20261015T090000Z" });
  assert.match(ics, /DTSTART:20261023T060000Z/);
  assert.match(ics, /DTSTART:20261026T070000Z/);
  assert.match(ics, /DTEND:20261026T080000Z/);
  assert.match(ics, /LOCATION:Marrick\\, 9 Elystan Mews\\, London/);
  assert.equal((ics.match(/BEGIN:VEVENT/g) ?? []).length, 2);
});

test("home order and site checks", () => {
  assert.equal(homeOrderProblem(Object.keys(HOME_PARTS)), null);
  assert.match(String(homeOrderProblem(["trainer-month"])), /leaves out/);
  assert.match(errorsFor((s) => { s.diary.source = "sheet"; }), /csvUrl/);
  assert.match(errorsFor((s) => { s.firstMonth.prices.first = -5; }), /prices\.first/);
  assert.match(errorsFor((s) => { s.firstMonth.steps[0].text = "Guaranteed to lose 5 kg in a month."; }), /promise/);
  assert.match(errorsFor((s) => { s.qualifications.items[0].awardingBody = ""; }), /awardingBody/);
  assert.match(errorsFor((s) => { s.qualifications.registerUrl = "http://example.com"; }), /registerUrl/);
  assert.match(errorsFor((s) => { s.diary.source = "simulated"; }, client), /simulated/);
});
