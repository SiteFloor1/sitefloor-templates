import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  dateWords, timeWords, monthsAhead, monthWords, placesFromCsv, placesWords, nextPlace, roomKnown, todayFromCsv,
  weekCost, hoursWords, pounds, ageDate, termAfter, fundingStart, FUNDING_BY_BAND, visitSlots, upcoming, closedDays,
  settlingPlan, ics, icsStamp, aroundNow, dayKey, ymdIn,
} from "../../src/kits/nursery/lib/nursery.js";
import { HOME_PARTS } from "../../src/kits/nursery/home.js";
import { pageData } from "../../src/kits/nursery/kit.js";
import { validateSite } from "../../src/core/lib/config.js";
import { loadCatalog } from "../../scripts/lib/catalog.js";

const demo = JSON.parse(readFileSync("sites/demos/nursery/site.json", "utf8"));
const client = JSON.parse(readFileSync("tests/fixtures/sites/test-nursery-client/site.json", "utf8"));
const look = JSON.parse(readFileSync("src/looks/caption/look.json", "utf8"));
const catalog = loadCatalog(process.cwd());
const errorsFor = (/** @type {(s: any) => void} */ change, base = demo) => { const s = structuredClone(base); change(s); return validateSite(s, { catalog }).join("\n"); };
const NOW = Date.parse("2026-11-26T10:00:00Z");
const TZ = "Europe/London";
const ROOMS = ["garden", "workshop", "orchard"];
const FEES = { rate: 9.5, weeksOpen: 51, sessions: { full: { hours: 10 }, am: { hours: 5 } } };

test("the demo and the client fixture are valid", () => {
  assert.deepEqual(validateSite(demo, { catalog }), []);
  assert.deepEqual(validateSite(client, { catalog }), []);
});

test("words for dates, times and months", () => {
  assert.equal(dateWords("2026-12-01"), "Tue 1 Dec");
  assert.equal(dateWords("2026-12-01", "long"), "Tuesday 1 December 2026");
  assert.equal(timeWords("09:30"), "9.30am");
  assert.equal(timeWords("12:00"), "12 noon");
  assert.equal(timeWords("16:00"), "4pm");
  assert.deepEqual(monthsAhead("2026-11-26", 3), ["2026-11", "2026-12", "2027-01"]);
  assert.equal(monthWords("2027-02"), "Feb");
  assert.equal(monthWords("2027-02", "long"), "February 2027");
  assert.equal(dayKey("2026-11-26"), "thu");
  assert.equal(ymdIn(Date.parse("2026-06-30T23:30:00Z"), TZ), "2026-07-01");
});

test("places come from the sheet row by row, and fail closed", () => {
  const csv = "room,month,places,updated_at\ngarden,2026-12,full,2026-11-25 09:00\ngarden,2027-01,2,2026-11-25 09:00\nworkshop,2026-12,1,2026-10-01 09:00\n";
  const r = placesFromCsv(csv, NOW, 14, TZ, ROOMS);
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.deepEqual(r.places, { "garden|2026-12": 0, "garden|2027-01": 2 }); // workshop's row is old: left out
  assert.equal(nextPlace(r.places, "garden", ["2026-12", "2027-01"]), "2027-01");
  assert.equal(nextPlace(r.places, "orchard", ["2026-12", "2027-01"]), "");
  assert.equal(roomKnown(r.places, "workshop", ["2026-12"]), false);
  assert.deepEqual(placesWords(0), { state: "full", words: "Full" });
  assert.deepEqual(placesWords(2), { state: "free", words: "2 free" });
  assert.equal(placesWords(undefined), null);
  for (const bad of [
    "room,month,places\ngarden,2026-12,1",                                   // a column missing
    "room,month,places,updated_at\nnursery,2026-12,1,2026-11-25 09:00",      // a room it doesn't know
    "room,month,places,updated_at\ngarden,2026-13,1,2026-11-25 09:00",       // a month that doesn't exist
    "room,month,places,updated_at\ngarden,2026-12,some,2026-11-25 09:00",    // a word it can't read
    "room,month,places,updated_at\ngarden,2026-12,1,2027-11-25 09:00",       // a mistyped year (future): nothing current
  ]) assert.equal(placesFromCsv(bad, NOW, 14, TZ, ROOMS).ok, false, bad);
});

test("today's notice is only today's row", () => {
  const csv = "date,message\n2026-11-25,Closed for snow\n2026-11-26,Garden open morning from 10\n";
  assert.equal(todayFromCsv(csv, "2026-11-26"), "Garden open morning from 10");
  assert.equal(todayFromCsv(csv, "2026-11-27"), "");
  assert.equal(todayFromCsv("day,text\n2026-11-26,x", "2026-11-26"), "");
});

test("the week's fees take funded hours off as gov.uk sets them, spread over the weeks open", () => {
  // Three full days, 30 funded hours: 1,140 hours over 51 weeks is 22.35 a week; 7.65 paid at £9.50.
  const a = weekCost(FEES, ["full", "full", "off", "full", "off"], 30);
  assert.equal(a.booked, 30);
  assert.equal(hoursWords(a.funded), "22.35");
  assert.equal(hoursWords(a.paid), "7.65");
  assert.equal(pounds(a.month), "£308.75");
  // 15 hours (570 a year) over 51 weeks: 11.18 a week.
  const b = weekCost(FEES, ["full", "full", "off", "full", "off"], 15);
  assert.equal(hoursWords(b.funded), "11.18");
  assert.equal(pounds(b.month), "£760");
  // Funded hours never exceed the hours booked, and nothing is owed for them.
  const c = weekCost(FEES, ["am", "off", "off", "off", "off"], 30);
  assert.equal(c.funded, 5);
  assert.equal(c.month, 0);
  // Term time only (NU-01): up to the funded hours off in each of 38 weeks, the other 13 weeks paid in full.
  const t = weekCost({ ...FEES, stretched: false }, ["full", "full", "off", "full", "off"], 30);
  assert.equal(t.termOnly, true);
  assert.equal(t.funded, 30);
  assert.equal(t.fullWeeks, 13);
  assert.equal(pounds(weekCost({ rate: 9.5, weeksOpen: 51, sessions: { x: { hours: 25 } }, stretched: false }, ["x"], 30).month), "£257.29");
  assert.equal(pounds(weekCost({ rate: 9.5, weeksOpen: 51, sessions: { x: { hours: 25 } } }, ["x"], 30).month), "£106.88");
  assert.equal(pounds(1413.13), "£1,413.13");
  assert.equal(pounds(1413), "£1,413");
  assert.deepEqual(FUNDING_BY_BAND[0], [0]);
  assert.deepEqual(FUNDING_BY_BAND[3], [15, 30]);
});

test("funding starts the term after the age is reached (gov.uk)", () => {
  assert.equal(termAfter("2027-01-01"), "2027-04-01");
  assert.equal(termAfter("2027-03-31"), "2027-04-01");
  assert.equal(termAfter("2027-04-01"), "2027-09-01");
  assert.equal(termAfter("2027-08-31"), "2027-09-01");
  assert.equal(termAfter("2027-09-01"), "2028-01-01");
  assert.equal(ageDate("2026-05-31", 9), "2027-03-01"); // no 31 February: the 1st after
  assert.equal(ageDate("2024-02-29", 36), "2027-03-01");
  const f = fundingStart("2026-05-14", "2026-11-26");
  assert.deepEqual(f, { working: { date: "2027-04-01", started: false, before: false }, universal: { date: "2029-09-01", started: false, before: false } });
  assert.equal(fundingStart("2020-01-01", "2026-11-26"), null); // school age
  // A start worked out before the working families' hours existed (April 2024) carries no "since" date (NU-03).
  const old = fundingStart("2021-12-01", "2026-11-26");
  assert.equal(old?.working.before, true);
  assert.equal(fundingStart("2026-05-14", "2026-11-26")?.working.before, false);
  assert.equal(fundingStart("not a date", "2026-11-26"), null);
});

test("visit times follow the weekly pattern, the first Saturday only in the month's first week", () => {
  const p = [{ day: "tue", time: "10:00" }, { day: "thu", time: "16:30" }, { day: "sat", time: "10:00", week: "first" }];
  const s = visitSlots(p, "2026-11-26", 4, ["2026-12-01"]);
  assert.deepEqual(s.map((x) => x.date), ["2026-12-03", "2026-12-05", "2026-12-08", "2026-12-10"]);
});

test("term dates show what's ahead, and closures become closed days", () => {
  const items = [
    { id: "a", label: "Autumn term ends", date: "2026-12-18", kind: /** @type {const} */ ("term") },
    { id: "b", label: "Christmas closure", date: "2026-12-24", end: "2026-12-27", kind: /** @type {const} */ ("closed") },
    { id: "c", label: "Training day", date: "2026-10-30", kind: /** @type {const} */ ("closed") },
  ];
  assert.deepEqual(upcoming(items, "2026-11-26").map((x) => x.id), ["a", "b"]);
  assert.deepEqual(closedDays(items), ["2026-12-24", "2026-12-25", "2026-12-26", "2026-12-27", "2026-10-30"]);
});

test("settling-in sessions fall on the next open weekdays", () => {
  const steps = [{ label: "One hour together", from: "09:30", to: "10:30" }, { label: "Two hours", from: "09:30", to: "11:30" }, { label: "A morning", from: "08:00", to: "13:00" }];
  const plan = settlingPlan("2026-12-04", steps, ["2026-12-07"]); // a Friday; the Monday is closed
  assert.deepEqual(plan.map((x) => x.date), ["2026-12-04", "2026-12-08", "2026-12-09"]);
  const fromSat = settlingPlan("2026-12-05", steps.slice(0, 1), []);
  assert.equal(fromSat[0].date, "2026-12-07");
});

test("calendar files carry all-day and timed items", () => {
  const out = ics({ name: "Alnwood", place: "1 Road, Town", stamp: icsStamp(NOW), items: [
    { id: "x", label: "Christmas closure", date: "2026-12-24", end: "2026-12-27" },
    { id: "s1", label: "Settling in, one hour", date: "2026-12-04", from: "09:30", to: "10:30" },
  ] });
  assert.match(out, /DTSTART;VALUE=DATE:20261224\r\nDTEND;VALUE=DATE:20261228/);
  assert.match(out, /DTSTART:20261204T093000\r\nDTEND:20261204T103000/);
  assert.match(out, /LOCATION:1 Road\\, Town/);
});

test("around now is the moment under way on an open weekday", () => {
  const m = [{ time: "08:00" }, { time: "09:30" }, { time: "11:00" }];
  assert.equal(aroundNow(m, 10 * 60, "thu", "18:00"), 1);
  assert.equal(aroundNow(m, 7 * 60, "thu", "18:00"), -1);
  assert.equal(aroundNow(m, 19 * 60, "thu", "18:00"), -1);
  assert.equal(aroundNow(m, 10 * 60, "sat", "18:00"), -1);
});

test("the home page's parts are the look's order, and page data carries only what is on", () => {
  assert.deepEqual(look.homeOrder, Object.keys(HOME_PARTS));
  const d = pageData(demo).nursery;
  assert.ok(d.places && d.week && d.visit && d.day && d.today && d.terms && d.settling);
  const c = pageData(client).nursery;
  assert.equal(c.week, null);
  assert.equal(c.places?.source, "sheet");
});

test("the checks refuse what could mislead", () => {
  assert.match(errorsFor((s) => { s.places.source = "simulated"; s.mode = "client"; }), /simulated/);
  assert.match(errorsFor((s) => { s.fees.rate = 0; }), /rate/);
  assert.match(errorsFor((s) => { s.fees.extras[0].optional = false; }), /optional/);
  assert.match(errorsFor((s) => { s.funding.checked = "2026-13-01"; }), /funding\.checked/);
  assert.match(errorsFor((s) => { s.rooms.picker[0].room = "nope"; }), /room/);
  assert.match(errorsFor((s) => { s.ofsted.reportUrl = "https://example.com/report"; }), /reports\.ofsted\.gov\.uk/);
  assert.match(errorsFor((s) => { s.rooms.items[0].ratio = 3; }), /ratio/);
  assert.match(errorsFor((s) => { s.fees.colour = "red"; }), /unknown setting/);
});
