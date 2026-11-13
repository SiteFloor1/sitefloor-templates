import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { hexToRgb, isDarkShade, shadeLine, nailBase, recolour } from "../../src/kits/nails/lib/shade.js";
import { timeWords, price, setTotal, setText, byMinutes } from "../../src/kits/nails/lib/menu.js";
import { slotFromCsv, slotWords } from "../../src/kits/nails/lib/slot.js";
import { isYmd, ymdOf, ukDate, editLive, bridalDates, allDayIcs, monthName } from "../../src/kits/nails/lib/dates.js";
import { partyText, bridalText, usualText, shadeText } from "../../src/kits/nails/lib/messages.js";
import { HOME_PARTS, homeOrderProblem, onPagesProblem } from "../../src/kits/nails/home.js";
import { validateSite } from "../../src/core/lib/config.js";
import { loadCatalog } from "../../scripts/lib/catalog.js";

const demo = JSON.parse(readFileSync("sites/demos/nail-salon/site.json", "utf8"));
const client = JSON.parse(readFileSync("tests/fixtures/sites/test-nails-client/site.json", "utf8"));
const look = JSON.parse(readFileSync("src/looks/quail/look.json", "utf8"));
const catalog = loadCatalog(process.cwd());
const errorsFor = (/** @type {(s: any) => void} */ change, base = demo) => { const s = structuredClone(base); change(s); return validateSite(s, { catalog }).join("\n"); };

test("the demo and the client fixture are valid", () => {
  assert.deepEqual(validateSite(demo, { catalog }), []);
  assert.deepEqual(validateSite(client, { catalog }), []);
});

test("the look's home order and pages name every section once and only what a page can hold", () => {
  assert.equal(homeOrderProblem(look.homeOrder), null);
  assert.equal(onPagesProblem(look.onPages), null);
  assert.match(homeOrderProblem(Object.keys(HOME_PARTS).slice(1)) ?? "", /leaves out/);
  assert.match(onPagesProblem({ "nail-menu": ["visit"] }) ?? "", /only/);
});

test("a misspelt setting is refused, not ignored", () => {
  assert.match(errorsFor((s) => { s.menu.bands[0].items[0].prise = 30; }), /menu\.bands\[0\]\.items\[0\]\.prise: unknown setting/);
  assert.match(errorsFor((s) => { s.shades.items[0].colour = "#FFFFFF"; }), /shades\.items\[0\]\.colour: unknown setting/);
  assert.match(errorsFor((s) => { s.hero.hands[0].photo = "x"; }), /hero\.hands\[0\]\.photo: unknown setting/);
});

test("simulated data and a demo's numbers never reach a client site", () => {
  assert.match(errorsFor((s) => { s.nextSlot = { source: "simulated" }; }, client), /simulated data is only allowed on demo sites/);
  assert.match(errorsFor((s) => { s.nextSlot.csvUrl = "https://example.com/slots.csv"; }, client), /published Google Sheet CSV/);
});

test("shades are complete and real colours; numbers and ids are unique", () => {
  assert.match(errorsFor((s) => { s.shades.items[1].hex = "pink"; }), /shades\.items\[1\]\.hex/);
  assert.match(errorsFor((s) => { s.shades.items[1].no = s.shades.items[0].no; }), /used twice/);
  assert.match(errorsFor((s) => { s.shades.items[1].finish = "glossy"; }), /one of cream, sheer/);
  assert.match(errorsFor((s) => { s.shades.rail.push("nope"); }), /isn't one of the shades/);
});

test("Signature needs a mask for every hand; Starter and Plus need photos of the hand in other shades", () => {
  assert.match(errorsFor((s) => { delete s.hero.hands[1].mask; }), /hero\.hands\[1\]\.mask: required/);
  assert.match(errorsFor((s) => { delete s.hero.hands[0].shots; }, client), /fade between photos of this hand/);
  assert.match(errorsFor((s) => { s.hero.hands[0].shots = [{ shade: "red", src: "img/hand-red.webp" }]; }, client), /2 to 5 more photos/);
  assert.match(errorsFor((s) => { s.hero.hands[0].wearing = "gold"; }), /the shade this hand is wearing/);
});

test("prices, times and the monthly edit are checked; the edit hides itself once its month is over", () => {
  assert.match(errorsFor((s) => { s.edit.sets[0].minutes = 62; }), /a multiple of 5/);
  assert.match(errorsFor((s) => { s.edit.sets[0].price = 12.5; }), /whole pounds/);
  assert.match(errorsFor((s) => { s.edit.sets.pop(); s.edit.sets.pop(); }), /three or four sets/);
  assert.match(errorsFor((s) => { s.edit.month = "2026-13"; }), /YYYY-MM/);
  assert.ok(editLive("2026-11", "2026-10-29"), "shows a month ahead");
  assert.ok(editLive("2026-11", "2026-12-14"), "and two weeks after");
  assert.ok(!editLive("2026-11", "2026-12-15"), "then hides");
  assert.ok(!editLive("2026-11", "2026-09-30"), "not too early");
  assert.ok(editLive("2026-12", "2027-01-14") && !editLive("2026-12", "2027-01-15"), "across the new year");
  assert.equal(monthName("2026-11"), "November");
});

test("parties can only offer treatments on the menu; build your set refers to real art levels", () => {
  assert.match(errorsFor((s) => { s.parties.treatments.push("massage"); }), /isn't on the menu/);
  assert.match(errorsFor((s) => { s.buildSet.art[0].level = "four"; }), /one of art\.levels/);
});

test("the menu and build your set add up the salon's own figures", () => {
  assert.equal(timeWords(30), "30 minutes");
  assert.equal(timeWords(60), "1 hour");
  assert.equal(timeWords(105), "1 h 45");
  assert.equal(price(78, true), "from £78");
  assert.deepEqual(byMinutes([{ minutes: 90 }, { minutes: 30 }]).map((b) => b.minutes), [30, 90]);
  const cfg = demo.buildSet;
  const pick = { system: "biab", shape: "almond", length: "long", finish: "chrome", art: "two" };
  assert.deepEqual(setTotal(cfg, pick), { minutes: 60 + 15 + 15 + 30, price: 58 + 8 + 12 + 18 });
  assert.equal(setText("Hello Verrall,", cfg, pick, "Petal (No. 14)"), "Hello Verrall, I'd like to book: BIAB, almond, long, Chrome, Petal (No. 14), Level two. About 2 hours, £96 on your menu.");
  assert.throws(() => setTotal(cfg, { ...pick, finish: "velvet" }), /isn't in the salon's list/);
});

test("the next free slot fails closed", () => {
  const now = Date.parse("2026-10-29T09:00:00Z"); // 09:00 GMT
  const csv = (at, upd) => `next_free,updated_at\n${at},${upd}\n`;
  assert.deepEqual(slotFromCsv(csv("2026-10-29 14:30", "2026-10-29 08:30"), now, 240, "Europe/London", "2026-10-29 09:00"), { ok: true, at: "2026-10-29 14:30", updatedAt: Date.parse("2026-10-29T08:30:00Z") });
  assert.equal(slotFromCsv(csv("2026-10-29 08:30", "2026-10-29 08:30"), now, 240, "Europe/London", "2026-10-29 09:00").ok, false, "a slot already gone");
  assert.equal(slotFromCsv(csv("2026-10-29 14:30", "2026-10-28 08:30"), now, 240, "Europe/London", "2026-10-29 09:00").ok, false, "an old update");
  assert.equal(slotFromCsv(csv("30/10/2026 14:30", "2026-10-29 08:30"), now, 240, "Europe/London", "2026-10-29 09:00").ok, false, "a date it can't be sure of");
  assert.equal(slotFromCsv("when,updated\n2026-10-29 14:30,2026-10-29 08:30\n", now, 240, "Europe/London", "2026-10-29 09:00").ok, false, "missing columns");
  assert.equal(slotWords("2026-10-29 14:30", "2026-10-29"), "Today, 14:30");
  assert.equal(slotWords("2026-10-30 10:00", "2026-10-29"), "Tomorrow, 10:00");
  assert.equal(slotWords("2026-11-02 10:00", "2026-10-29"), "Monday, 10:00");
  assert.equal(slotWords("2026-11-12 10:00", "2026-10-29"), "Thu 12 Nov, 10:00");
});

test("bridal dates are worked back from the wedding in UK order, with one calendar file", () => {
  assert.ok(isYmd("2028-02-29") && !isYmd("2027-02-29"));
  assert.equal(ymdOf(2027, 2, 30), "");
  const d = bridalDates("2027-06-12", demo.bridal.steps, "2027-05-20");
  assert.deepEqual(d.map((x) => [x.id, x.date, x.past]), [["trial", "2027-05-01", true], ["strengthen", "2027-05-29", false], ["final", "2027-06-10", false]]);
  assert.equal(ukDate("2027-06-10"), "Thursday 10 June 2027");
  const ics = allDayIcs({ salon: "Verrall", place: "9 Linden Arcade, London", stamp: "20261029T090000Z", kind: "bridal nails", events: d.filter((x) => !x.past).map((x) => ({ id: x.id, date: x.date, title: x.label })) });
  assert.match(ics, /DTSTART;VALUE=DATE:20270610\r\nDTEND;VALUE=DATE:20270611/);
  assert.equal((ics.match(/BEGIN:VEVENT/g) ?? []).length, 2);
  assert.match(ics, /LOCATION:9 Linden Arcade\\, London/);
});

test("the messages carry exactly what was chosen", () => {
  assert.equal(shadeText("Hello Verrall,", "Petal (No. 14)"), "Hello Verrall, I'd like to book in Petal (No. 14).");
  assert.equal(usualText("Hello,", "BIAB, almond, medium, Petal (No. 14)"), "Hello, I'd like my usual again: BIAB, almond, medium, Petal (No. 14).");
  assert.equal(partyText({ opening: "Hello,", occasion: "Hen party", date: "2027-05-15", people: 6, treatments: ["Gel manicure", "BIAB, new set"], notes: "" }), "Hello, I'd like to book for a hen party: 6 of us on Saturday 15 May 2027. We'd like: Gel manicure; BIAB, new set.");
  assert.equal(bridalText("Hello,", "2027-06-12"), "Hello, my wedding is on Saturday 12 June 2027, and I'd like to book my trial.");
});

test("a shade laid into a photo keeps the photo's light: the shade at the nail's own brightness, gloss stays white", () => {
  // Four pixels: skin (no mask), nail at its usual brightness, nail in shadow, a gloss highlight on the nail.
  const src = new Uint8ClampedArray([200, 160, 140, 255, 220, 180, 180, 255, 110, 90, 90, 255, 255, 255, 255, 255]);
  const mask = new Uint8ClampedArray([0, 0, 0, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255]);
  const out = new Uint8ClampedArray(src.length);
  const base = nailBase(src, mask);
  recolour(src, mask, out, "#B3121B", base);
  assert.deepEqual([...out.slice(0, 3)], [200, 160, 140], "skin untouched");
  assert.ok(Math.abs(out[4] - 0xB3) < 40 && out[5] < 40, "the nail takes the shade");
  assert.ok(out[8] < out[4], "the shadow stays darker");
  assert.deepEqual([...out.slice(12, 15)], [255, 255, 255], "the gloss stays white");
  assert.deepEqual(hexToRgb("#E2B4AE"), [226, 180, 174]);
  assert.ok(isDarkShade("#5E1222") && !isDarkShade("#E2B4AE"));
  assert.equal(shadeLine({ id: "petal", no: 14, name: "Petal", hex: "#E2B4AE", system: "gel", finish: "sheer", family: "pink", note: "Two coats." }), "Gel, sheer gloss. Two coats.");
});

test("the demo's simulated next free time is never before the salon opens", async () => {
  const { simulatedSlot } = await import("../../src/demo/slot-provider.js");
  const hours = { timezone: "Europe/London", weekly: { mon: [], tue: [["10:00", "20:00"]], wed: [["10:00", "20:00"]], thu: [], fri: [], sat: [], sun: [] }, exceptions: [] };
  const at = async (date, minutes) => (await simulatedSlot.load({ now: () => ({ date, minutes }), data: { hours } })).at;
  assert.equal(await at("2026-11-04", 30), "2026-11-04 11:00", "half past midnight: an hour after opening, not 02:00");
  assert.equal(await at("2026-11-04", 12 * 60), "2026-11-04 13:30", "midday: ninety minutes on");
  assert.equal(await at("2026-11-04", 19 * 60), "2026-11-10 11:00", "near closing: the next open day (Monday closed)");
});
