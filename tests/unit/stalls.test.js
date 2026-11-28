import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  weekFromPattern, upcoming, nextStop, minutesUntil, untilWords, dayWord, stopsFromCsv, soldOutFromCsv, partyDatesFromCsv,
  partyAnswer, partyText, setupText, allergenWords, pounds, stopIcs, mapsHref, rainWords, csvRows, addDays,
} from "../../src/kits/stalls/lib/stalls.js";
import { boardLines } from "../../src/kits/stalls/features/stalls-board/stalls-board.js";
import { HOME_PARTS, homeOrderProblem } from "../../src/kits/stalls/home.js";
import { validateSite } from "../../src/core/lib/config.js";
import { loadCatalog } from "../../scripts/lib/catalog.js";

const demo = JSON.parse(readFileSync("sites/demos/stalls/site.json", "utf8"));
const client = JSON.parse(readFileSync("tests/fixtures/sites/test-stalls-client/site.json", "utf8"));
const look = JSON.parse(readFileSync("src/looks/spun/look.json", "utf8"));
const catalog = loadCatalog(process.cwd());
const errorsFor = (/** @type {(s: any) => void} */ change, base = demo) => { const s = structuredClone(base); change(s); return validateSite(s, { catalog }).join("\n"); };
const PATTERN = demo.stops.usual;
const SAT = "2026-11-21"; // a Saturday
const at = (/** @type {string} */ date, /** @type {string} */ hhmm) => ({ date, minutes: Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3)) });
const DAY = 86_400_000;
const NOW = Date.parse("2026-11-21T12:00:00Z");

test("the demo and the client fixture are valid", () => {
  assert.deepEqual(validateSite(demo, { catalog }), []);
  assert.deepEqual(validateSite(client, { catalog }), []);
});

test("the look's home order names every section once", () => {
  assert.equal(homeOrderProblem(look.homeOrder), null);
  assert.match(homeOrderProblem(Object.keys(HOME_PARTS).slice(1)) ?? "", /leaves out/);
  assert.match(homeOrderProblem([...Object.keys(HOME_PARTS), "menu"]) ?? "", /unknown/);
});

test("the usual week lays out on real dates, soonest first, and past stops drop off", () => {
  const week = weekFromPattern(PATTERN, SAT);
  assert.deepEqual(week.slice(0, 3).map((s) => [s.date, s.place]), [["2026-11-21", "hackney"], ["2026-11-22", "walthamstow"], ["2026-11-25", "shoreditch"]]);
  const before = upcoming(week, at(SAT, "10:00"));
  assert.equal(before[0].place, "hackney");
  assert.equal(before[0].live, false);
  const during = upcoming(week, at(SAT, "14:30"));
  assert.equal(during[0].live, true);
  const after = upcoming(week, at(SAT, "18:00"));
  assert.equal(after[0].place, "walthamstow", "a stop that has closed is gone");
});

test("the next stop skips a cancelled one; the countdown reads in days, hours and minutes", () => {
  const week = weekFromPattern(PATTERN, SAT).map((s) => (s.date === "2026-11-22" ? { ...s, cancelled: true } : s));
  const n = nextStop(week, at(SAT, "18:30"));
  assert.equal(n?.place, "shoreditch");
  assert.equal(minutesUntil(/** @type {any} */ (n), at(SAT, "18:30")), 4 * 1440 + 12 * 60 - (18 * 60 + 30));
  assert.equal(untilWords(4 * 1440 + 12 * 60 - (18 * 60 + 30)), "3d 17h 30m");
  assert.equal(untilWords(65), "1h 5m");
  assert.equal(untilWords(12), "12m");
  assert.equal(dayWord(SAT, SAT), "Today");
  assert.equal(dayWord("2026-11-22", SAT), "Tomorrow");
  assert.equal(dayWord("2026-11-25", SAT), "Wednesday");
  assert.equal(dayWord("2026-12-05", SAT), "Saturday 5 December");
});

test("the stops sheet reads cleanly, keeps cancelled stops, and fails closed when old or broken", () => {
  const head = "date,place,open,close,status,note,updated_at";
  const csv = [head, "2026-11-21,hackney,11:00,18:00,on,,2026-11-20 09:12", '2026-11-22,walthamstow,11:00,17:00,cancelled,"Closed, for the fair",2026-11-20 09:12'].join("\n");
  const r = stopsFromCsv(csv, NOW, 10);
  assert.equal(r.ok, true);
  assert.deepEqual(r.ok && r.stops.map((s) => [s.place, s.cancelled, s.note]), [["hackney", false, ""], ["walthamstow", true, "Closed, for the fair"]]);
  assert.equal(stopsFromCsv(csv, NOW + 20 * DAY, 10).ok, false, "not updated for 20 days");
  assert.equal(stopsFromCsv(csv.replace("11:00,18:00", "11am,6pm"), NOW, 10).ok, false);
  assert.equal(stopsFromCsv(csv.replace(",on,", ",maybe,"), NOW, 10).ok, false);
  assert.equal(stopsFromCsv("date,place\n2026-11-21,hackney", NOW, 10).ok, false);
  assert.equal(stopsFromCsv(csv.replace(/2026-11-20 09:12/g, ""), NOW, 10).ok, false, "no update stamp: can't tell it's current");
  assert.deepEqual(csvRows('a,"b ""c"""\r\n1,2\n'), [["a", 'b "c"'], ["1", "2"]]);
});

test("sold out counts today's rows only", () => {
  const csv = "date,item,time\n2026-11-21,Biscoff crunch,15:40\n2026-11-20,Bubble waffle,16:00";
  assert.deepEqual(soldOutFromCsv(csv, SAT), { ok: true, out: { "biscoff crunch": "15:40" } });
  assert.deepEqual(soldOutFromCsv(csv, "2026-11-22"), { ok: true, out: {} });
  assert.equal(soldOutFromCsv("date,item,time\n2026-11-21,Biscoff,later", SAT).ok, false);
  const lines = boardLines([{ name: "Biscoff crunch", price: 7.5, allergens: "G E M S", vegan: false }, { name: "Raspberry candy floss", price: 4, allergens: "", vegan: true }], { "biscoff crunch": "15:40" });
  assert.deepEqual(lines, [
    { name: "Biscoff crunch", price: "£7.50", out: true, sub: "Sold out today at 15:40" },
    { name: "Raspberry candy floss", price: "£4", out: false, sub: "None of the 14 allergens · VE" },
  ]);
});

test("the party check never says booked, and fails closed on an old diary", () => {
  const csv = "date,status,updated_at\n2026-12-05,taken,2026-11-19 18:40\n2026-12-12,few,2026-11-19 18:40";
  const diary = partyDatesFromCsv(csv, NOW, 21);
  assert.equal(diary.ok, true);
  assert.equal(partyAnswer("2026-12-05", SAT, diary).state, "taken");
  assert.doesNotMatch(partyAnswer("2026-12-05", SAT, diary).words, /booked/i);
  assert.equal(partyAnswer("2026-12-12", SAT, diary).state, "few");
  assert.equal(partyAnswer("2026-12-19", SAT, diary).state, "open");
  assert.equal(partyAnswer("2026-11-01", SAT, diary).state, "past");
  assert.equal(partyAnswer("", SAT, diary).state, "idle");
  assert.equal(partyAnswer("2026-12-19", SAT, partyDatesFromCsv(csv, NOW + 40 * DAY, 21)).state, "unknown");
  assert.equal(partyAnswer("2026-12-19", SAT, null).state, "unknown");
});

test("messages: the party enquiry, the set-up card, prices, allergens and directions", () => {
  assert.equal(partyText("Hello Fendle, could you come to our party?", { date: "2026-12-12", guests: "40", postcode: "e8 4qj", kind: "Birthday" }),
    "Hello Fendle, could you come to our party?\nIt's for: Birthday\nDate: Saturday 12 December 2026\nGuests: about 40\nPostcode: E8 4QJ");
  assert.equal(partyText("Hi", {}), "Hi");
  assert.equal(setupText("Fendle", [{ label: "Pitch", value: "3 m × 3 m" }]), "Fendle: what we need on the day\nPitch: 3 m × 3 m");
  assert.equal(pounds(7.5), "£7.50");
  assert.equal(pounds(6), "£6");
  assert.equal(allergenWords("G E M N"), "Gluten, egg, milk, tree nuts");
  assert.equal(allergenWords(""), "None of the 14 allergens");
  assert.equal(mapsHref({ name: "Hackney", market: "Street market", postcode: "E8" }), "https://www.google.com/maps/search/?api=1&query=Street%20market%20Hackney%20E8");
});

test("a stop as a calendar file keeps the stall's own clock and escapes its words", () => {
  const ics = stopIcs({ date: SAT, place: "hackney", open: "11:00", close: "18:00" }, { name: "Hackney", market: "Street market", postcode: "E8" }, "Fendle", Date.parse("2026-11-17T09:00:00Z"));
  assert.match(ics, /DTSTART:20261121T110000\r\n/);
  assert.match(ics, /DTEND:20261121T180000\r\n/);
  assert.match(ics, /LOCATION:Street market\\, Hackney\\, E8\r\n/);
  assert.match(ics, /DTSTAMP:20261117T090000Z/);
});

test("the rain check reads the stop's hours only and never cancels", () => {
  const s = { date: SAT, place: "hackney", open: "11:00", close: "18:00" };
  const hours = (/** @type {number} */ from) => Array.from({ length: 24 }, (_, h) => ({ time: `${SAT}T${String(h).padStart(2, "0")}:00`, mm: h >= from ? 0.6 : 0.1 }));
  assert.equal(rainWords(hours(15), s), "Rain forecast from 15:00.");
  assert.equal(rainWords(hours(19), s), "Dry, by the forecast.");
  assert.equal(rainWords(hours(15), { ...s, date: addDays(SAT, 3) }), "");
});

test("the checks keep a stall's facts whole and refuse simulated data on a client", () => {
  assert.match(errorsFor((s) => { s.stops.source = "simulated"; }, client), /only allowed on demo sites/);
  assert.match(errorsFor((s) => { s.stops.csvUrl = "https://example.com/stops.csv"; }, client), /published Google Sheet/);
  assert.match(errorsFor((s) => { s.stops.usual[0].place = "nowhere"; }), /stops\.places/);
  assert.match(errorsFor((s) => { s.stops.usual[0].close = "11:00"; }), /after it opens/);
  assert.match(errorsFor((s) => { s.menu.items[0].allergens = "G X"; }), /"X" isn't one of/);
  assert.match(errorsFor((s) => { s.menu.items[1].name = s.menu.items[0].name; }), /share this name/);
  assert.match(errorsFor((s) => { s.allergensPage.hygiene.url = "https://example.com"; }), /ratings\.food\.gov\.uk/);
  assert.match(errorsFor((s) => { s.allergensPage.hygiene.rating = 6; }), /0 to 5/);
  for (const rating of ["pass", "improvement required"]) assert.doesNotMatch(errorsFor((s) => { s.allergensPage.hygiene.rating = rating; }), /hygiene\.rating/);
  assert.match(errorsFor((s) => { s.posts.tiktokProfile = "https://www.tiktok.com/@real"; }), /must not link to a real/);
  assert.match(errorsFor((s) => { s.posts.tiktokProfile = "tiktok.com/x"; }, client), /TikTok profile link/);
  assert.match(errorsFor((s) => { s.stops.places.forEach((/** @type {any} */ p) => { delete p.pitch; }); }, client), /pitch finder needs/);
  assert.match(errorsFor((s) => { s.stops.places.forEach((/** @type {any} */ p) => { delete p.lat; delete p.lon; }); }), /rain check needs lat and lon/);
  assert.match(errorsFor((s) => { s.drop.at = "next Saturday"; }), /YYYY-MM-DD/);
  assert.match(errorsFor((s) => { s.party.kinds = []; }), /at least one kind/);
  assert.match(errorsFor((s) => { s.stops.surprise = true; }), /unknown setting/);
});
