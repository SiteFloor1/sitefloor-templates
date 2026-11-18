import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { timeBand, classWeeks, classMatches, finderCount, coachWeek, coachClasses, packTotal, packWords, upcomingEvents, eventHours, eventIcs, foldLine } from "../../src/kits/gym/lib/club.js";
import { validateSite } from "../../src/core/lib/config.js";
import { loadCatalog } from "../../scripts/lib/catalog.js";

const demo = JSON.parse(readFileSync("sites/demos/gym/site.json", "utf8"));
const catalog = loadCatalog(process.cwd());
const errorsFor = (/** @type {(s: any) => void} */ change) => { const s = structuredClone(demo); change(s); return validateSite(s, { catalog }).join("\n"); };

const weekly = {
  tue: [{ time: "18:45", class: "barbell", coach: "Ines" }, { time: "06:30", class: "engine", coach: "Dami" }],
  thu: [{ time: "18:45", class: "barbell", coach: "Ines" }, { time: "12:30", class: "mobility", coach: "Owen" }],
  mon: [{ time: "07:15", class: "engine", coach: "Rhys" }],
};
const items = [
  { id: "barbell", name: "Barbell club", goals: ["strength"], level: "some" },
  { id: "engine", name: "Engine", goals: ["engine", "hyrox"], level: "all" },
  { id: "mobility", name: "Mobility", goals: ["mobility"], level: "all" },
  { id: "ride", name: "Ride", goals: ["engine"], level: "all" },
];

test("class finder: the part of the day a class starts in", () => {
  assert.equal(timeBand("06:00"), "morning");
  assert.equal(timeBand("09:59"), "morning");
  assert.equal(timeBand("10:00"), "midday");
  assert.equal(timeBand("15:59"), "midday");
  assert.equal(timeBand("16:00"), "evening");
});

test("class finder: each class with its week, Monday first, and the parts of the day it runs in", () => {
  const rows = classWeeks(items, weekly);
  assert.deepEqual(rows[1].sessions.map((s) => `${s.day} ${s.time} ${s.coach}`), ["mon 07:15 Rhys", "tue 06:30 Dami"]);
  assert.deepEqual(rows[0].bands, ["evening"]);
  assert.deepEqual(rows[3].sessions, []); // not on the timetable: kept, with an empty week
  assert.deepEqual(rows[3].bands, []);
});

test("class finder: a choice narrows, an empty choice matches everything", () => {
  const rows = classWeeks(items, weekly);
  const fit = (/** @type {any} */ pick) => rows.filter((c) => classMatches(c, pick)).map((c) => c.id);
  assert.deepEqual(fit({}), ["barbell", "engine", "mobility", "ride"]);
  assert.deepEqual(fit({ goal: "hyrox" }), ["engine"]);
  assert.deepEqual(fit({ goal: "engine", band: "morning" }), ["engine"]);
  assert.deepEqual(fit({ level: "all", band: "midday" }), ["mobility"]);
  assert.deepEqual(fit({ goal: "strength", band: "morning" }), []);
  assert.equal(finderCount(0), "No class fits that. Try another time of day.");
  assert.equal(finderCount(1), "One class");
  assert.equal(finderCount(4), "Four classes");
});

test("coaches: a coach's week comes from the timetable, by name", () => {
  assert.deepEqual(coachWeek(weekly, "Ines"), [{ day: "tue", time: "18:45", class: "barbell" }, { day: "thu", time: "18:45", class: "barbell" }]);
  assert.deepEqual(coachClasses(weekly, "Ines"), [{ class: "barbell", times: ["Tue 18:45", "Thu 18:45"] }]);
  assert.deepEqual(coachClasses(weekly, "Nobody"), []);
});

test("personal training: the headline is the pack's total, every mandatory fee in; the price a session from it, rounded down", () => {
  assert.deepEqual(packWords({ sessions: 1, price: 65, mandatoryFees: [] }), { headline: "£65 a session", each: "", fine: "" });
  assert.deepEqual(packWords({ sessions: 6, price: 330, mandatoryFees: [] }), { headline: "£330 for six sessions", each: "£55 a session", fine: "" });
  const block = { sessions: 8, price: 440, mandatoryFees: [{ name: "Race assessment", amount: 40 }] };
  assert.equal(packTotal(block), 480);
  assert.deepEqual(packWords(block), { headline: "£480 for eight sessions, race assessment fee included", each: "£60 a session", fine: "race assessment £40" });
  assert.equal(packWords({ sessions: 3, price: 100, mandatoryFees: [] }).each, "£33.33 a session");
});

test("personal training: a pack without its mandatory fees is refused, and so is a promise", () => {
  assert.match(errorsFor((s) => { delete s.training.packs[0].mandatoryFees; }), /training\.packs\[0\]\.mandatoryFees: .*DMCC Act 2024/);
  assert.match(errorsFor((s) => { s.training.packs[0].price = "£65"; }), /training\.packs\[0\]\.price/);
  assert.match(errorsFor((s) => { s.training.who = "Guaranteed to lose 5 kg"; }), /copy: no promises/);
});

test("events: past ones leave, soonest first; the calendar file holds the time in UTC", () => {
  const list = [
    { id: "b", title: "B", date: "2026-12-03", time: "19:00", minutes: 60, text: "x" },
    { id: "a", title: "A", date: "2026-11-27", time: "18:30", minutes: 120, text: "y" },
    { id: "old", title: "Old", date: "2026-11-01", time: "10:00", minutes: 60, text: "z" },
  ];
  assert.deepEqual(upcomingEvents(list, "2026-11-17").map((e) => e.id), ["a", "b"]);
  assert.deepEqual(upcomingEvents(list, "2026-11-27").map((e) => e.id), ["a", "b"]); // on the day, still listed
  assert.equal(eventHours(list[1]), "18:30 to 20:30");
  const summer = eventIcs({ event: { id: "run", title: "Run, then coffee", date: "2027-06-05", time: "08:00", minutes: 60, text: "Easy; then coffee" }, club: "Halde", place: "Halde, Manchester", tz: "Europe/London", stamp: "20261117T000000Z" });
  assert.match(summer, /DTSTART:20270605T070000Z\r\n/); // BST: 08:00 in Manchester is 07:00 UTC
  assert.match(summer, /SUMMARY:Run\\, then coffee · Halde/);
  assert.match(summer, /DESCRIPTION:Easy\\; then coffee/);
  assert.match(eventIcs({ event: list[1], club: "Halde", place: "Halde", tz: "Europe/London", stamp: "s" }), /DTSTART:20261127T183000Z\r\nDTEND:20261127T203000Z/);
});

test("the club's pages: settings are checked, nothing misspelt slips through", () => {
  assert.match(errorsFor((s) => { s.classTypes.items[0].goals = ["cardio"]; }), /classTypes\.items\[0\]\.goals/);
  assert.match(errorsFor((s) => { delete s.classTypes.items[0].level; }), /classTypes\.items\[0\]\.level/);
  assert.match(errorsFor((s) => { s.coaches.items[0].name = "Inès"; }), /isn't a coach on the timetable/);
  assert.match(errorsFor((s) => { for (const day of Object.values(s.timetable.weekly)) for (const x of /** @type {any[]} */ (day)) delete x.coach; }), /coaches: the timetable names no coaches/);
  assert.match(errorsFor((s) => { s.tour.rooms = [s.tour.rooms[0]]; }), /tour\.rooms: two to eight rooms/);
  assert.match(errorsFor((s) => { s.events.items[0].time = "6.30pm"; }), /events\.items\[0\]\.time/);
  assert.match(errorsFor((s) => { s.events.items[0].when = "Friday"; }), /events\.items\[0\]\.when: unknown setting/);
  assert.match(errorsFor((s) => { s.app.stores[0].url = "http://halde.example"; }), /app\.stores\[0\]\.url: a full https/);
  assert.match(errorsFor((s) => { s.journal.items[1].slug = s.journal.items[0].slug; }), /journal\.items\[1\]\.slug: used twice/);
  assert.match(errorsFor((s) => { s.firstVisit.steps = [s.firstVisit.steps[0]]; }), /firstVisit\.steps: two to eight steps/);
});

test("calendar lines are folded at 75 octets, never inside a character", () => {
  assert.equal(foldLine("short"), "short");
  const long = "DESCRIPTION:" + "a".repeat(100);
  const parts = foldLine(long).split("\r\n");
  assert.equal(new TextEncoder().encode(parts[0]).length, 75);
  assert.ok(parts.slice(1).every((p) => p.startsWith(" ") && new TextEncoder().encode(p).length <= 75));
  assert.equal(parts.map((p, i) => (i ? p.slice(1) : p)).join(""), long);
  const accents = foldLine("SUMMARY:" + "é".repeat(60)); // two octets each
  for (const p of accents.split("\r\n")) assert.ok(new TextEncoder().encode(p).length <= 75 && !p.includes("\uFFFD"));
  const ics = eventIcs({ event: { id: "x", title: "T", date: "2026-12-03", time: "19:00", minutes: 60, text: "A long description ".repeat(10) }, club: "Halde", place: "Halde", tz: "Europe/London", stamp: "s" });
  for (const line of ics.split("\r\n")) assert.ok(new TextEncoder().encode(line).length <= 75);
});
