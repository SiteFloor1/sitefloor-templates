import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { money, hm, byLength, priceAt, minutesAt, fromPrice, fromWords, bookText, upkeepVisits, skinTestDay, matchStylist, freeDaysFromCsv, chairsFromCsv, minutesOf, freeWords, monthShort, eventsIcs, icsStamp } from "../../src/kits/hair/lib/hair.js";
import { HOME_PARTS, homeOrderProblem, onPagesProblem } from "../../src/kits/hair/home.js";
import { validateSite } from "../../src/core/lib/config.js";
import { loadCatalog } from "../../scripts/lib/catalog.js";

const demo = JSON.parse(readFileSync("sites/demos/hair/site.json", "utf8"));
const client = JSON.parse(readFileSync("tests/fixtures/sites/test-hair-client/site.json", "utf8"));
const look = JSON.parse(readFileSync("src/looks/length/look.json", "utf8"));
const catalog = loadCatalog(process.cwd());
const errorsFor = (/** @type {(s: any) => void} */ change, base = demo) => { const s = structuredClone(base); change(s); return validateSite(s, { catalog }).join("\n"); };

const CUT = { id: "cut", name: "Cut and finish", group: "cuts", prices: { stylist: [68, 74, 80, 88], senior: [84, 92, 100, 110] }, minutes: [60, 60, 75, 90] };
const FLAT = { id: "mens", name: "Men's cut", group: "mens", prices: { stylist: 42, senior: 52 }, minutes: 45 };
const CONSULT = { id: "braids", name: "Braids", group: "textured", prices: null, minutes: 240 };

test("the demo and the client fixture are valid", () => {
  assert.deepEqual(validateSite(demo, { catalog }), []);
  assert.deepEqual(validateSite(client, { catalog }), []);
});

test("prices by length and level, times, and the words for them", () => {
  assert.equal(money(92), "£92");
  assert.equal(money(1200), "£1,200");
  assert.equal(hm(45), "45 min");
  assert.equal(hm(60), "1 hr");
  assert.equal(hm(150), "2 hr 30 min");
  assert.equal(byLength(CUT), true);
  assert.equal(byLength(FLAT), false);
  assert.equal(byLength(CONSULT), false);
  assert.equal(priceAt(CUT, "senior", 1), 92);
  assert.equal(priceAt(CUT, "director", 1), null, "a level that doesn't offer it has no price");
  assert.equal(priceAt(FLAT, "senior", 3), 52, "a flat price is the same at any length");
  assert.equal(priceAt(CONSULT, "senior", 0), null);
  assert.equal(minutesAt(CUT, 3), 90);
  assert.equal(minutesAt(FLAT, 2), 45);
  assert.equal(fromPrice(CUT), 68);
  assert.equal(fromPrice(CONSULT), null);
  assert.equal(fromWords(CUT), "From £68 · about 1 hr");
  assert.equal(fromWords(CONSULT), "Priced at a free consultation");
});

test("the booking message says what was chosen, never that it's booked", () => {
  const t = bookText("Hello Selwyn Orr, I'd like to book.", { service: "Balayage", level: "Senior", length: "Long" });
  assert.equal(t, "Hello Selwyn Orr, I'd like to book. Balayage with a senior. Length: long.");
  assert.doesNotMatch(t, /booked|confirmed/i);
  assert.equal(bookText("Hello.", { extra: ["One.", "", "Two."] }), "Hello. One. Two.");
});

test("the colour year: visits every n weeks from the last colour, only from tomorrow and within twelve months", () => {
  const v = upkeepVisits("2026-10-15", 6, "2026-11-09");
  assert.equal(v[0], "2026-11-26");
  assert.equal(v[1], "2027-01-07");
  assert.ok(v.every((d) => d > "2026-11-09" && d <= "2027-11-09"));
  assert.equal(v.length, 9);
  assert.deepEqual(upkeepVisits("2026-10-15", 0, "2026-11-09"), []);
  assert.equal(upkeepVisits("2025-01-01", 14, "2026-11-09")[0] > "2026-11-09", true, "an old colour still lands its next visit after today");
  assert.equal(monthShort("2026-11-26"), "Nov");
});

test("the skin test: the last day before colour by the salon's hours, rounded up to whole days", () => {
  assert.equal(skinTestDay("2026-11-20", 48), "2026-11-18");
  assert.equal(skinTestDay("2026-11-20", 36), "2026-11-18");
  assert.equal(skinTestDay("2026-03-01", 48), "2026-02-27");
});

test("the stylist match: does the service, fits the texture, then the first free day or the most senior", () => {
  const S = [
    { id: "rae", name: "Rae", level: "stylist", does: ["cuts"], textures: ["straight", "waves"] },
    { id: "ines", name: "Ines", level: "senior", does: ["cuts"], textures: ["straight", "waves"] },
    { id: "marcus", name: "Marcus", level: "director", does: ["cuts", "textured"], textures: ["curls", "coils"] },
    { id: "hana", name: "Hana", level: "director", does: ["colour"] },
  ];
  const L = ["stylist", "senior", "director"];
  const free = { rae: "2026-11-10", ines: "2026-11-12", marcus: "2026-11-20", hana: "2026-11-11" };
  assert.equal(matchStylist(S, L, { doing: "cuts", want: "soon" }, free)?.id, "rae");
  assert.equal(matchStylist(S, L, { doing: "cuts", want: "senior" }, free)?.id, "marcus");
  assert.equal(matchStylist(S, L, { doing: "cuts", texture: "curls", want: "soon" }, free)?.id, "marcus", "only Marcus cuts curls");
  assert.equal(matchStylist(S, L, { doing: "cuts", texture: "braids", want: "soon" }, free)?.id, "rae", "no one lists braids: everyone who cuts");
  assert.equal(matchStylist(S, L, { doing: "colour", texture: "curls", want: "soon" }, free)?.id, "hana", "no textures listed means any");
  assert.equal(matchStylist(S, L, { doing: "extensions", want: "soon" }, free), null);
  assert.equal(matchStylist(S, L, { doing: "cuts", want: "soon" })?.id, "marcus", "without free days: the most senior, then the salon's order");
});

test("next free days from the salon's sheet: fails closed row by row, drops past days, reads UK dates", () => {
  const csv = (/** @type {string[]} */ rows) => ["stylist,next free,updated", ...rows].join("\n");
  const ok = freeDaysFromCsv(csv(["ines,2026-11-12,2026-11-09", "Rae,12/11/2026,2026-11-08", "marcus,2026-11-01,2026-11-09", "hana,soon,2026-11-09"]), "2026-11-09", 2);
  assert.deepEqual(ok, { ok: true, days: { ines: "2026-11-12", rae: "2026-11-12" } });
  assert.deepEqual(freeDaysFromCsv(csv(["ines,2026-11-12,2026-11-01"]), "2026-11-09", 2), { ok: false }, "updated a week ago");
  assert.deepEqual(freeDaysFromCsv(csv(["ines,2026-11-20,2026-10-20", "rae,2026-11-13,2026-11-12"]), "2026-11-12", 2), { ok: true, days: { rae: "2026-11-13" } }, "a fresh row never makes an old row fresh");
  assert.deepEqual(freeDaysFromCsv(csv(["ines,2026-11-20,2026-11-13"]), "2026-11-12", 2), { ok: false }, "updated tomorrow is unreadable");
  assert.deepEqual(freeDaysFromCsv(csv(["ines,2026-11-20,2027-11-12"]), "2026-11-12", 2), { ok: false }, "a year typo is unreadable");
  assert.deepEqual(freeDaysFromCsv(csv([]), "2026-11-09", 2), { ok: false });
  assert.deepEqual(freeDaysFromCsv("nonsense", "2026-11-09", 2), { ok: false });
  assert.equal(freeWords("2026-11-09", "2026-11-09"), "today");
  assert.equal(freeWords("2026-11-10", "2026-11-09"), "tomorrow");
  assert.equal(freeWords("2026-11-12", "2026-11-09"), "Thursday");
  assert.equal(freeWords("2026-11-20", "2026-11-09"), "20 November");
});

test("chairs free today from the salon's sheet: only today's rows, only slots still to come, in hours, on the list", () => {
  const csv = (/** @type {string[]} */ rows) => ["service,time,stylist,updated", ...rows].join("\n");
  const now = { date: "2026-11-12", minutes: 10 * 60 + 30 };
  const allow = { services: ["blow-dry", "walk-in-cut"], stylists: ["ines", "rae"], open: /** @type {[number, number][]} */ ([[540, 1080]]) };
  const r = chairsFromCsv(csv([
    "walk-in-cut,14:30,rae,2026-11-12 09:05", "Blow-dry,9:45,ines,2026-11-12 09:00", "blow-dry,11:00,Ines,2026-11-12 10:10",
    "blow-dry,10:30,ines,2026-11-12 09:00", "blow-dry,12:00,ines,2026-11-11 17:00", "blow-dry,12:30,ines,2026-11-12 11:00",
    "blow-dry,19:00,ines,2026-11-12 09:00", "colour,13:00,ines,2026-11-12 09:00", "blow-dry,13:00,nobody,2026-11-12 09:00", "blow-dry,later,ines,2026-11-12 09:00",
  ]), now, allow);
  assert.deepEqual(r, { ok: true, slots: [{ service: "blow-dry", time: "11:00", stylist: "ines" }, { service: "walk-in-cut", time: "14:30", stylist: "rae" }] });
  assert.deepEqual(chairsFromCsv(csv(["blow-dry,12:00,ines,2026-11-11 17:00"]), now, allow), { ok: false }, "yesterday's row");
  assert.deepEqual(chairsFromCsv(csv(["blow-dry,12:00,ines,2026-11-12"]), now, allow), { ok: false }, "no time on the update");
  assert.deepEqual(chairsFromCsv("nonsense", now, allow), { ok: false });
  assert.equal(minutesOf("14:30"), 870);
  assert.equal(minutesOf("9:05"), 545);
  assert.equal(minutesOf("24:00"), -1);
  assert.equal(minutesOf("2pm"), -1);
});

test("calendar files: all-day events with the salon and place, escaped", () => {
  const ics = eventsIcs({ salon: "Selwyn Orr", place: "11 Vane Mews, London", stamp: "20261109T120000Z", events: [{ id: "skin-test", date: "2026-11-18", title: "Skin test", note: "Walk in; any time, we're open." }] });
  assert.match(ics, /DTSTART;VALUE=DATE:20261118\r\nDTEND;VALUE=DATE:20261119/);
  assert.match(ics, /SUMMARY:Skin test · Selwyn Orr/);
  assert.match(ics, /DESCRIPTION:Walk in\\; any time\\, we're open\./);
  assert.match(ics, /LOCATION:11 Vane Mews\\, London/);
  assert.match(icsStamp(new Date("2026-11-09T12:00:00.123Z")), /^20261109T120000Z$/);
});

test("the look's home order and pages are complete", () => {
  assert.equal(homeOrderProblem(look.homeOrder), null);
  assert.equal(onPagesProblem(look.onPages), null);
  assert.match(String(homeOrderProblem(["textures"])), /leaves out/);
  assert.match(String(onPagesProblem({ "colour-page": ["stylists"] })), /only skin-test/);
  assert.ok(look.homeOrder.every((/** @type {string} */ id) => id in HOME_PARTS));
});

test("validation: prices, marks, consent and the sheet", () => {
  assert.match(errorsFor((s) => { s.menu.services[0].prices.senior = [84, 92, 100]; }), /menu\.services\[0\]\.prices\.senior: whole pounds/);
  assert.match(errorsFor((s) => { s.menu.services[0].prices.junior = 50; }), /prices\.junior: a level/);
  assert.match(errorsFor((s) => { s.hero.cut.marks.mid = 0.4; }), /shortest first/);
  assert.match(errorsFor((s) => { s.stylists.freeDays.source = "simulated"; }, client), /only allowed on demo sites/);
  assert.match(errorsFor((s) => { s.chairs.source = "simulated"; }, client), /chairs\.source: simulated chairs are only allowed on demo sites/);
  assert.match(errorsFor((s) => { s.chairs.services[0].service = "nothing"; }), /chairs\.services\[0\]\.service: a service id from the menu/);
  assert.match(errorsFor((s) => { s.chairs.csvUrl = "https://example.com/c.csv"; }, client), /chairs\.csvUrl/);
  assert.match(errorsFor((s) => { s.pass.stripeUrl = "https://buy.stripe.com/test_x"; }, client), /pass\.stripeUrl: a test link is only allowed on demo sites/);
  assert.match(errorsFor((s) => { s.pass.stripeUrl = "https://buy.stripe.com/live5pass"; }), /pass\.stripeUrl: a demo uses a test link/);
  assert.match(errorsFor((s) => { s.pass.service = "nothing"; }), /pass\.service: a service id from the menu/);
  assert.match(errorsFor((s) => { s.pass.visits = 1; }), /pass\.visits/);
  assert.match(errorsFor((s) => { s.pass.price = 219.5; }), /pass\.price: whole pounds/);
  assert.match(errorsFor((s) => { delete s.pairs.items[0].consent; }, client), /pairs\.items\[0\]\.consent: the date the client agreed/);
  assert.match(errorsFor((s) => { s.stylists.freeDays.csvUrl = "https://example.com/sheet.csv"; }, client), /Publish to the web/);
  assert.match(errorsFor((s) => { s.textures.items[0].stylists = ["nobody"]; }), /textures\.items\[0\]\.stylists/);
  assert.match(errorsFor((s) => { s.skinTest.hoursBefore = 12; }), /skinTest\.hoursBefore/);
  assert.match(errorsFor((s) => { s.menu.servicez = []; }), /menu\.servicez: unknown setting/);
  assert.match(errorsFor((s) => { s.match.doing.push({ id: "colour", name: "x" }); s.stylists.items = s.stylists.items.filter((/** @type {any} */ x) => !x.does.includes("colour")); }), /no stylist does this/);
});
