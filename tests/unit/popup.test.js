import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  addDays, daysBetween, resolveStops, stopState, currentStop, nextOpening, tourOrder, runLine, isOpen, entryTimes, runDays,
  slotHref, stopIcs, stockFromCsv, runHours, lineFromCsv, lineWords, stateWords, visitMinutes, csvRows, project, inviteText, shortDate,
} from "../../src/kits/popup/lib/popup.js";
import { HOME_PARTS, homeOrderProblem } from "../../src/kits/popup/home.js";
import { validateSite } from "../../src/core/lib/config.js";
import { loadCatalog } from "../../scripts/lib/catalog.js";

const demo = JSON.parse(readFileSync("sites/demos/chalden/site.json", "utf8"));
const client = JSON.parse(readFileSync("tests/fixtures/sites/test-popup-client/site.json", "utf8"));
const look = JSON.parse(readFileSync("src/looks/capsule/look.json", "utf8"));
const catalog = loadCatalog(process.cwd());
const errorsFor = (/** @type {(s: any) => void} */ change, base = client) => { const s = structuredClone(base); change(s); return validateSite(s, { catalog }).join("\n"); };
const H = client.hours;
const at = (/** @type {string} */ date, /** @type {string} */ hhmm) => ({ date, minutes: Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3)) });
const london = resolveStops(client.popup, "2027-06-10").find((s) => s.id === "london");

test("the demo and the client fixture are valid, and the look orders every home section", () => {
  assert.deepEqual(validateSite(demo, { catalog }), []);
  assert.deepEqual(validateSite(client, { catalog }), []);
  assert.equal(homeOrderProblem(look.homeOrder), null);
  assert.deepEqual([...look.homeOrder].sort(), Object.keys(HOME_PARTS).sort());
});

test("a demo's stops are days from today, so it is always on now; a client's are dates", () => {
  const s = resolveStops(demo.popup, "2027-03-01");
  assert.equal(s[0].start, "2027-02-23");
  assert.equal(s[0].end, "2027-03-14");
  assert.equal(stopState(s[0], "2027-03-01").kind, "on");
  assert.equal(currentStop(s, "2027-03-01").id, "london");
  assert.equal(nextOpening(s, "2027-03-01").id, "manchester");
  assert.deepEqual(tourOrder(s, "2027-03-01").map((x) => x.id), ["london", "manchester", "edinburgh", "bath"]);
  assert.equal(resolveStops(client.popup, "2027-03-01")[0].start, "2027-06-05");
});

test("days and dates", () => {
  assert.equal(addDays("2027-03-30", 3), "2027-04-02");
  assert.equal(daysBetween("2027-03-27", "2027-03-29"), 2); // across the clocks going forward
  assert.equal(shortDate("2027-01-09"), "9 Jan");
  assert.deepEqual(stopState(london, "2027-06-01"), { kind: "soon", days: 4 });
  assert.deepEqual(stopState(london, "2027-06-27"), { kind: "on", days: 0 });
  assert.equal(stopState(london, "2027-06-28").kind, "ended");
  assert.equal(stateWords(stopState(london, "2027-06-26"), london), "On now, 1 day left");
  assert.equal(stateWords(stopState(london, "2027-06-27"), london), "On now, last day today");
  assert.equal(stateWords(stopState(london, "2027-06-04"), london), "Opens tomorrow");
  assert.equal(stateWords(stopState(london, "2027-07-01"), london), "Ended 27 June");
});

test("the live line only ever counts the run's own days", () => {
  assert.equal(runLine(H, london, at("2027-06-10", "14:00")), "Open now, until 8pm"); // a Thursday
  assert.equal(runLine(H, london, at("2027-06-10", "10:00")), "Opens at 12pm today");
  assert.equal(runLine(H, london, at("2027-06-10", "20:30")), "Closed now. Opens tomorrow at 11am");
  assert.equal(runLine(H, london, at("2027-06-06", "19:00")), "Closed now. Opens Tuesday at 12pm"); // Sunday night, Monday closed
  assert.equal(runLine(H, london, at("2027-06-20", "17:00")), "Closed now. Opens Tuesday at 12pm"); // early close on the 20th, then Monday
  assert.equal(runLine(H, london, at("2027-06-27", "19:00")), "Closed now. That was the last day");
  assert.equal(runLine(H, london, at("2027-05-30", "14:00")), "Opens 5 June");
  assert.equal(runLine(H, london, at("2027-07-02", "14:00")), "Ended 27 June");
  assert.equal(isOpen(H, london, at("2027-06-10", "14:00")), true);
  assert.equal(isOpen(H, london, at("2027-07-01", "14:00")), false); // a Thursday after the run: closed
});

test("entry times: every 30 minutes to an hour before closing, none gone today, none outside the run", () => {
  const t = entryTimes(H, london, "2027-06-10", null, 30, 60);
  assert.equal(t[0], 12 * 60);
  assert.equal(t.at(-1), 19 * 60);
  assert.equal(t.length, 15);
  assert.deepEqual(entryTimes(H, london, "2027-06-10", at("2027-06-10", "18:10"), 30, 60), [18 * 60 + 30, 19 * 60]);
  assert.deepEqual(entryTimes(H, london, "2027-06-07", null), []); // Monday
  assert.deepEqual(entryTimes(H, london, "2027-07-01", null), []);
  const days = runDays(H, london, "2027-06-24");
  assert.deepEqual(days.map((d) => d.date), ["2027-06-24", "2027-06-25", "2027-06-26", "2027-06-27"]);
  assert.equal(slotHref("https://x.example/b?d={date}&t={time}", "2027-06-10", 930), "https://x.example/b?d=2027-06-10&t=15%3A30");
});

test("the calendar file: the whole run as all-day dates, or one time", () => {
  const all = stopIcs(london, "Ostrow", Date.UTC(2027, 4, 1));
  assert.match(all, /DTSTART;VALUE=DATE:20270605/);
  assert.match(all, /DTEND;VALUE=DATE:20270628/);
  assert.match(all, /LOCATION:Arch 14\\, Druid Street\\, London SE1 2HQ/);
  assert.match(stopIcs(london, "Ostrow", 0, { date: "2027-06-10", minutes: 930 }), /DTSTART;TZID=Europe\/London:20270610T153000/);
});

test("the stock sheet fails closed: old, empty, unknown values or pieces, or future rows mark nothing", () => {
  const now = Date.parse("2027-06-10T12:00:00Z"), ids = ["cuvee", "blanc"], head = "id,sold_out,updated_at\n";
  assert.deepEqual(stockFromCsv(`${head}cuvee,yes,2027-06-10 09:00\nblanc,no,2027-06-10 09:00`, now, ids), { ok: true, soldOut: ["cuvee"] });
  assert.deepEqual(stockFromCsv(`${head}cuvee,Sold out,10/06/2027 09:00:00\nblanc,,2027-06-10 09:00`, now, ids), { ok: true, soldOut: ["cuvee"] });
  assert.deepEqual(stockFromCsv(`${head}cuvee,yes,2027-06-01 09:00`, now, ids), { ok: false }); // old
  for (const v of ["gone", "SOLD", "Sold out!", "maybe"]) assert.deepEqual(stockFromCsv(`${head}cuvee,${v},2027-06-10 09:00`, now, ids), { ok: false }, v);
  assert.deepEqual(stockFromCsv(`${head}rosee,yes,2027-06-10 09:00`, now, ids), { ok: false }); // a piece the site doesn't have
  assert.deepEqual(stockFromCsv(`${head}cuvee,no,2027-06-10 09:00\nblanc,no,2027-12-30 09:00`, now, ids), { ok: false }); // a future row
  assert.deepEqual(stockFromCsv(`${head}cuvee,yes,soon`, now, ids), { ok: false });
  assert.deepEqual(stockFromCsv("name,price\nx,1", now, ids), { ok: false });
  assert.deepEqual(stockFromCsv("", now, ids), { ok: false });
});

test("the queue: the last row, in UK time, hidden after 30 minutes and whenever the last row can't be read", () => {
  // 10 June 2027 is in British Summer Time: 14:20 in London is 13:20 UTC.
  const now = Date.parse("2027-06-10T13:20:00Z"), q = (/** @type {string} */ rows) => lineFromCsv(`minutes,updated_at\n${rows}`, now);
  assert.deepEqual(q("5,2027-06-10 13:00\n20,2027-06-10 14:05"), { ok: true, minutes: 20, at: 14 * 60 + 5 });
  assert.deepEqual(q("20,10/06/2027 14:05:00"), { ok: true, minutes: 20, at: 14 * 60 + 5 }); // a Google Form's timestamp
  assert.deepEqual(q("20,2027-06-10 13:49"), { ok: false }); // 31 minutes old
  assert.deepEqual(q("20,2027-06-10 13:51"), { ok: true, minutes: 20, at: 13 * 60 + 51 }); // 29 minutes old
  assert.deepEqual(q("5,2027-06-10 14:10\nabout 20,2027-06-10 14:15"), { ok: false }); // the newest can't be read: no older fallback
  assert.deepEqual(q("20,2027-06-10 15:30"), { ok: false }); // in the future
  // In winter, London is UTC: 12 December 14:20 is 14:20 UTC.
  assert.deepEqual(lineFromCsv("minutes,updated_at\n5,2027-12-12 13:49", Date.parse("2027-12-12T14:20:00Z")), { ok: false });
  assert.equal(lineWords(20, 14 * 60 + 5), "Queue about 20 minutes (at 2:05pm)");
  assert.equal(lineWords(0, 14 * 60 + 5), "No queue right now (at 2:05pm)");
});

test("every page's hours count only the stops' days; a demo keeps its usual week", () => {
  const h = runHours(client);
  assert.deepEqual(Object.values(h.weekly).flat(), []);
  assert.equal(h.exceptions.find((/** @type {any} */ e) => e.date === "2027-06-10").ranges[0][0], "12:00"); // a Thursday in London
  assert.equal(h.exceptions.find((/** @type {any} */ e) => e.date === "2027-06-20").note, "Closing early for a private event");
  assert.equal(h.exceptions.some((/** @type {any} */ e) => e.date === "2027-07-01"), false); // between stops: closed
  assert.equal(runHours(demo), demo.hours);
  assert.equal(isOpen(h, london, at("2027-06-10", "14:00")), true);
});

test("small helpers", () => {
  assert.equal(visitMinutes(demo.rooms.items), 45);
  assert.deepEqual(csvRows('a,b\n"x, y",2\n'), [{ a: "x, y", b: "2" }]);
  assert.deepEqual(project(-0.079, 51.502), { x: 286.4, y: 566.9 });
  assert.match(inviteText("Ostrow", london, "2027-06-10", 930), /Thursday 10 June at 3:30pm, Arch 14, Druid Street, London\. \(Not a ticket/);
});

test("the checks refuse what would mislead", () => {
  assert.match(errorsFor((s) => { s.popup.stops[0].start = -2; }), /days from today are only for demo sites/);
  assert.match(errorsFor((s) => { s.popup.stops[0].end = "2027-06-01"; }), /last day comes before the first/);
  assert.match(errorsFor((s) => { s.line = { source: "simulated" }; }), /simulated data is only allowed on demo sites/);
  assert.match(errorsFor((s) => { s.onlyHere.stock = { source: "sheet", csvUrl: "https://example.com/x.csv" }; }), /published Google Sheet/);
  assert.match(errorsFor((s) => { delete s.onlyHere.items[0].price; }), /total price, every mandatory fee included/);
  assert.match(errorsFor((s) => { s.city.message = "Come to my town"; }), /include \{city\}/);
  assert.match(errorsFor((s) => { s.alcohol.href = "https://example.com"; }), /Drinkaware link/);
  assert.match(errorsFor((s) => { Object.assign(s.popup.stops[2], { start: "2025-03-01", end: "2025-03-20" }); delete s.popup.stops[2].photo; }), /past pop-up shows the brand's own photograph/);
  assert.match(errorsFor((s) => { s.rooms.items[0].minutes = 0; }), /minutes for this room/);
  assert.match(errorsFor((s) => { s.slots.every = 25; }), /15, 20, 30 or 60/);
  assert.match(errorsFor((s) => { s.popup.stops[0].postcode = "12345"; }), /UK postcode/);
  assert.match(errorsFor((s) => { s.popup.colour = "gold"; }), /popup\.colour: unknown setting/);
});
