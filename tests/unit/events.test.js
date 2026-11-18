import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  realDate, addDays, weekday, datesFromCsv, statusOf, nextFree, dateWords, briefMessage, keyDates, icsFile,
  drawRoom, roomWords, cleanCode, proposalFromCsv, roomsFor,
} from "../../src/kits/events/lib/events.js";
import { HOME_PARTS } from "../../src/kits/events/home.js";
import { validateSite } from "../../src/core/lib/config.js";
import { loadCatalog } from "../../scripts/lib/catalog.js";

const demo = JSON.parse(readFileSync("sites/demos/maudry/site.json", "utf8"));
const client = JSON.parse(readFileSync("tests/fixtures/sites/test-events-client/site.json", "utf8"));
const look = JSON.parse(readFileSync("src/looks/doors/look.json", "utf8"));
const catalog = loadCatalog(process.cwd());
const errorsFor = (/** @type {(s: any) => void} */ change, base = demo) => { const s = structuredClone(base); change(s); return validateSite(s, { catalog }).join("\n"); };

test("the demo and the client fixture are valid", () => {
  assert.deepEqual(validateSite(demo, { catalog }), []);
  assert.deepEqual(validateSite(client, { catalog }), []);
});

test("the look lists every home section once", () => {
  assert.deepEqual([...look.homeOrder].sort(), Object.keys(HOME_PARTS).sort());
});

test("dates: real calendar days only, weekdays in UTC", () => {
  assert.ok(realDate("2028-02-29"));
  assert.ok(!realDate("2027-02-29"));
  assert.equal(addDays("2027-03-27", 1), "2027-03-28");
  assert.equal(weekday("2026-12-12"), "sat");
});

test("the dates sheet: held and booked; anything else is free; fails closed when stale or unreadable", () => {
  const csv = "date,status,updated\n2026-12-12,held,2026-11-16\n2026-12-19,booked,\n2026-12-26,maybe,\n";
  const r = datesFromCsv(csv, "2026-11-18", 7);
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.equal(statusOf(r.taken, "2026-12-12"), "held");
  assert.equal(statusOf(r.taken, "2026-12-19"), "booked");
  assert.equal(statusOf(r.taken, "2026-12-26"), "free");
  assert.equal(nextFree(r.taken, "2026-11-18", ["sat"], 14), "2026-12-05");
  assert.equal(nextFree(r.taken, "2026-11-18", ["sat"], 20), "2026-12-26");
  assert.deepEqual(datesFromCsv(csv, "2026-12-01", 7), { ok: false, reason: "stale" });
  assert.deepEqual(datesFromCsv(csv, "2026-11-10", 7), { ok: false, reason: "unreadable" });
  assert.deepEqual(datesFromCsv("date,status\n2026-12-12,held", "2026-11-18", 7), { ok: false, reason: "unreadable" });
  assert.match(dateWords("held", "2026-12-12"), /^Saturday 12 December 2026 is on hold/);
});

test("the brief carries only what was chosen", () => {
  const m = briefMessage("Maudry", { type: "Launch", date: "2027-03-20", flexible: true, guests: 80, budget: "", name: " Sam " });
  assert.equal(m, "Hello Maudry, we're planning a launch.\nDate: Saturday 20 March 2027 (we could move it)\nGuests: about 80\nFrom Sam");
  assert.match(briefMessage("Maudry", { type: "Engagement party" }), /an engagement party\.\nDate: not fixed yet$/);
});

test("key dates work back from the day and drop those already past; the calendar file escapes and folds", () => {
  const k = keyDates("2027-06-05", [{ label: "Tasting", weeksBefore: 16 }, { label: "Site visit", weeksBefore: 40 }, { label: "Numbers", weeksBefore: 2 }], "2026-11-18");
  assert.deepEqual(k, [{ label: "Tasting", date: "2027-02-13" }, { label: "Numbers", date: "2027-05-22" }]);
  const ics = icsFile("Maudry; Studio", [{ label: "A, b", date: "2027-02-13" }], "20261118T000000Z", "maudry.example");
  assert.ok(ics.includes("PRODID:-//Maudry\\; Studio//Key dates"));
  assert.ok(ics.includes("SUMMARY:A\\, b"));
  assert.match(ics, /DTEND;VALUE=DATE:20270214/);
  assert.ok(ics.split("\r\n").every((l) => new TextEncoder().encode(l).length <= 75));
});

test("the room is drawn to the number, or says plainly when it doesn't fit", () => {
  const hall = { length: 26, width: 11 };
  const p = drawRoom(hall, 120, "long");
  assert.ok(p.fits);
  assert.equal(p.tables.reduce((n, t) => n + t.seats, 0), 120);
  assert.deepEqual(p.floor && [p.floor.w, p.floor.h], [8, 8]);
  for (const t of p.tables) assert.ok(t.x >= 1 && t.x + t.w <= p.floor.x, "tables stay clear of the walls and the floor");
  const r = drawRoom(hall, 80, "round");
  assert.equal(r.tables.length, 8);
  assert.ok(!drawRoom(hall, 120, "round").fits);
  assert.match(roomWords(r, "The hall"), /^80 seated at 8 round tables, with a dance floor 8 × 8 m\.$/);
  const tooMany = drawRoom({ length: 12, width: 7 }, 200, "long");
  assert.ok(!tooMany.fits);
  assert.match(roomWords(tooMany, "The townhouse"), /takes about \d+ seated/);
  assert.equal(drawRoom({ length: 12, width: 7 }, 40, "long").floor, null);
});

test("proposal codes: cleaned, unknown codes and odd rows refused, stale rows refused", () => {
  assert.equal(cleanCode(" maudry-24 "), "MAUDRY24");
  assert.equal(cleanCode("abc"), "");
  const csv = "code,visuals,room,guests,layout,date,updated\nMAUDRY24,green-hall,hall,90,round,2027-03-20,2026-11-10\nODDROW1,nope,hall,90,long,2027-03-20,2026-11-10\n";
  const ok = proposalFromCsv(csv, "MAUDRY24", ["green-hall"], ["hall"], "2026-11-18", 21);
  assert.deepEqual(ok, { ok: true, visuals: "green-hall", room: "hall", layout: "round", date: "2027-03-20", updated: "2026-11-10", guests: 90 });
  assert.deepEqual(proposalFromCsv(csv, "NOTHERE1", ["green-hall"], ["hall"], "2026-11-18", 21), { ok: false, reason: "unknown" });
  assert.deepEqual(proposalFromCsv(csv, "ODDROW1", ["green-hall"], ["hall"], "2026-11-18", 21), { ok: false, reason: "unreadable" });
  assert.deepEqual(proposalFromCsv(csv, "MAUDRY24", ["green-hall"], ["hall"], "2026-12-30", 21), { ok: false, reason: "stale" });
});

test("rooms for your number: near it, closest first", () => {
  const rooms = [{ id: "a", guests: 40, occasion: "wedding" }, { id: "b", guests: 110, occasion: "wedding" }, { id: "c", guests: 90, occasion: "launch" }, { id: "d", guests: 300, occasion: "wedding" }];
  assert.deepEqual(roomsFor(rooms, 100).map((r) => r.id), ["b", "c"]);
  assert.deepEqual(roomsFor(rooms, 100, "wedding").map((r) => r.id), ["b"]);
});

test("settings checks: design visuals can't reuse a room's photo, and venues can't be partners by default", () => {
  assert.match(errorsFor((s) => { s.visuals.sets[0].views[0].photo.src = s.rooms.items[0].photo.src; }), /visual/i);
  assert.match(errorsFor((s) => { s.venues.items[0].partner = "yes"; }), /partner/);
  assert.match(errorsFor((s) => { s.layTable.dressings.pop(); }), /layTable/);
  assert.match(errorsFor((s) => { s.rooms.items[0].occasion = "gala"; }), /occasion/);
});
