import { test } from "node:test";
import assert from "node:assert/strict";
import { readStockSheet, fixedTable, pieceState, sizeWords, stockWords } from "../../src/kits/wear/lib/stock.js";
import { opensAt, opensWords, untilDrop, pastDrops, calendarDaysBetween } from "../../src/kits/wear/lib/drop.js";
import { sizeForChest, plausibleChest } from "../../src/kits/wear/lib/fit.js";
import { readForecast, conditionOf, weatherSentence, hourWords, forecastUrl } from "../../src/kits/wear/lib/weather.js";
import { metresBetween, routeStats, routePath } from "../../src/kits/wear/lib/routes.js";
import { nextRunDate, runsInOrder, runIcs, runWhen } from "../../src/kits/wear/lib/club.js";
import { readQueueSheet, ticketPlace } from "../../src/kits/wear/lib/queue.js";
import { readFileSync } from "node:fs";
import { validateSite } from "../../src/core/lib/config.js";
import { headersFile } from "../../src/core/lib/seo.js";
import { loadCatalog } from "../../scripts/lib/catalog.js";
import { HOME_PARTS, homeOrderProblem } from "../../src/kits/wear/home.js";

const TZ = "Europe/London";
const at = (iso) => Date.parse(iso);

test("stock sheet: reads rows, newest update, fails closed when stale or broken", () => {
  const csv = "piece,size,left,updated_at\nshell-04,S,3,2026-11-05 09:00\nshell-04,M,0,2026-11-05 09:10\nshell-02,L,12,2026-11-05 08:00\nbad,,x,nope\n";
  const r = readStockSheet(csv, { timeZone: TZ, now: at("2026-11-05T10:00:00Z"), staleAfterHours: 6 });
  assert.equal(r.table.get("shell-04").get("S"), 3);
  assert.equal(r.table.get("shell-04").get("M"), 0);
  assert.equal(r.table.get("shell-02").get("L"), 12);
  assert.equal(r.updated, at("2026-11-05T09:10:00Z"));
  assert.equal(readStockSheet(csv, { timeZone: TZ, now: at("2026-11-05T16:00:00Z"), staleAfterHours: 6 }), null, "stale");
  assert.equal(readStockSheet("piece,size\nshell,S\n", { timeZone: TZ, now: 0, staleAfterHours: 6 }), null, "missing columns");
  assert.equal(readStockSheet("piece,size,left,updated_at\n", { timeZone: TZ, now: 0, staleAfterHours: 6 }), null, "no rows");
  // A row dated well in the future (a typo) never counts as fresh.
  assert.equal(readStockSheet("piece,size,left,updated_at\na,S,1,2027-01-01 09:00\n", { timeZone: TZ, now: at("2026-11-05T10:00:00Z"), staleAfterHours: 6 }), null);
});

test("stock: piece state, sizes in words, the words under a piece", () => {
  const sizes = ["S", "M", "L", "XL"];
  const t = fixedTable({ a: { S: 0, M: 6, L: 6, XL: 0 }, b: { S: 0, M: 0, L: 0, XL: 0 }, c: { S: 9, m: 9, L: 9, XL: 9 } });
  assert.deepEqual(pieceState({ sizes }, t.get("a"), { now: 0, lowAt: 12 }), { state: "few", left: 12, inSizes: ["M", "L"] });
  assert.equal(pieceState({ sizes }, t.get("b"), { now: 0, lowAt: 12 }).state, "out");
  assert.equal(pieceState({ sizes }, t.get("c"), { now: 0, lowAt: 12 }).state, "in", "lower-case sizes read");
  assert.equal(pieceState({ sizes }, undefined, { now: 0, lowAt: 12 }).state, "unknown");
  assert.equal(pieceState({ sizes, opensAt: 100 }, t.get("c"), { now: 50, lowAt: 12 }).state, "soon");
  assert.equal(sizeWords(["S", "M", "L", "XL"], sizes), "S to XL");
  assert.equal(sizeWords(["M", "L"], sizes), "M and L only");
  assert.equal(sizeWords(["L"], sizes), "L only");
  assert.equal(sizeWords(["S", "M", "L"], sizes), "S to L only");
  assert.equal(sizeWords(["S", "L", "XL"], sizes), "S, L and XL only");
  assert.deepEqual(stockWords({ state: "few", left: 12, inSizes: ["M", "L"] }, sizes), { lead: "12 left", rest: "M and L only" });
  assert.deepEqual(stockWords({ state: "soon", left: 0, inSizes: [] }, sizes, "Saturday 10:00"), { lead: "Saturday 10:00", rest: "S to XL" });
  assert.deepEqual(stockWords({ state: "out", left: 0, inSizes: [] }, sizes), { lead: "", rest: "Sold out" });
  assert.deepEqual(stockWords({ state: "unknown", left: 0, inSizes: [] }, sizes), { lead: "", rest: "" });
});

test("drops: opening instant in London time, words, days on the brand's calendar", () => {
  assert.equal(opensAt("2026-11-07T10:00", TZ), at("2026-11-07T10:00:00Z"), "GMT in November");
  assert.equal(opensAt("2026-07-04T10:00", TZ), at("2026-07-04T09:00:00Z"), "BST in July");
  assert.ok(Number.isNaN(opensAt("Saturday", TZ)));
  assert.equal(opensWords("2026-11-07T10:00", at("2026-11-04T12:00:00Z"), TZ), "Saturday 10:00");
  assert.equal(opensWords("2026-11-21T10:00", at("2026-11-04T12:00:00Z"), TZ), "Saturday 21 November, 10:00");
  assert.deepEqual(untilDrop("2026-11-07T10:00", at("2026-11-04T12:00:00Z"), TZ), { phase: "before", words: "3 days" });
  assert.deepEqual(untilDrop("2026-11-07T10:00", at("2026-11-06T23:00:00Z"), TZ), { phase: "before", words: "tomorrow" });
  assert.deepEqual(untilDrop("2026-11-07T10:00", at("2026-11-07T08:00:00Z"), TZ), { phase: "today", words: "today" });
  assert.deepEqual(untilDrop("2026-11-07T10:00", at("2026-11-07T09:35:00Z"), TZ), { phase: "today", words: "in 25 min" });
  assert.deepEqual(untilDrop("2026-11-07T10:00", at("2026-11-07T10:00:00Z"), TZ), { phase: "open", words: "open now" });
  assert.equal(calendarDaysBetween("2026-10-24", "2026-10-26"), 2, "across the clock change");
  const archive = pastDrops([{ opens: "2026-05-02T10:00" }, { opens: "2026-11-07T10:00" }, { opens: "2026-09-05T10:00" }], at("2026-11-01T00:00:00Z"), TZ);
  assert.deepEqual(archive.map((d) => d.opens), ["2026-09-05T10:00", "2026-05-02T10:00"]);
});

test("fit: size from chest uses only the brand's table", () => {
  const flat = { S: 55, M: 58, L: 61, XL: 64 };
  const sizes = ["S", "M", "L", "XL"];
  assert.equal(sizeForChest(96, sizes, flat, 14), "S");
  assert.equal(sizeForChest(97, sizes, flat, 14), "M");
  assert.equal(sizeForChest(114, sizes, flat, 14), "XL");
  assert.equal(sizeForChest(115, sizes, flat, 14), null);
  assert.equal(sizeForChest(NaN, sizes, flat, 14), null);
  assert.equal(sizeForChest(100, ["S", "M"], { S: 55 }, 14), null, "a size with no measurement is never chosen");
  assert.ok(plausibleChest(100));
  assert.ok(!plausibleChest(30));
});

test("weather: reads Open-Meteo, decides the condition, says it plainly", () => {
  const json = { current: { time: "2026-11-05T07:45", temperature_2m: 11.4, apparent_temperature: 8.2, wind_speed_10m: 18.6, precipitation: 0 },
    hourly: { time: Array.from({ length: 12 }, (_, i) => `2026-11-05T${String(8 + i).padStart(2, "0")}:00`), precipitation_probability: [5, 5, 10, 10, 15, 20, 25, 30, 35, 45, 60, 70] } };
  const f = readForecast(json);
  assert.deepEqual(f, { temp: 11, feels: 8, wind: 19, rainChance: 70, rainHour: 17, raining: false, time: "2026-11-05T07:45" });
  assert.equal(conditionOf(f), "wet");
  assert.equal(weatherSentence("London", f), "London is 11° with rain from 5pm.");
  assert.equal(conditionOf({ ...f, rainChance: 10 }), "mild");
  assert.equal(conditionOf({ ...f, rainChance: 10, wind: 30 }), "windy");
  assert.equal(weatherSentence("London", { ...f, rainChance: 10, wind: 30 }), "London is 11° and windy, 30 km/h.");
  assert.equal(conditionOf({ ...f, rainChance: 10, temp: 4 }), "cold");
  assert.equal(weatherSentence("London", { ...f, raining: true }), "London is 11° and raining.");
  assert.equal(readForecast({ current: { temperature_2m: 3 } }), null);
  assert.equal(hourWords(0), "midnight");
  assert.equal(hourWords(12), "midday");
  assert.equal(hourWords(9), "9am");
  // The brand's paid plan: Open-Meteo's free API is for non-commercial use only.
  assert.match(forecastUrl(51.5072, -0.1276, TZ, "abc12345"), /^https:\/\/customer-api\.open-meteo\.com\/v1\/forecast\?latitude=51\.5072&longitude=-0\.1276&.*apikey=abc12345$/);
});

test("routes: real distance and climb from the points, path fits the box", () => {
  // One degree of latitude is about 111.2 km.
  assert.ok(Math.abs(metresBetween([51, 0], [52, 0]) - 111_195) < 50);
  const pts = [[51.5, -0.05, 10], [51.51, -0.05, 14], [51.51, -0.03, 12], [51.5, -0.03, 20], [51.5, -0.05, 10]];
  const s = routeStats(pts);
  assert.ok(Math.abs(s.km - 5.0) < 0.2, `about 5 km, got ${s.km}`);
  assert.equal(s.climb, 12);
  assert.equal(routeStats([[51.5, 0], [51.6, 0]]).climb, null, "no elevation, no climb claimed");
  const p = routePath(pts, 300, 200, 20);
  const nums = p.d.match(/-?\d+(\.\d+)?/g).map(Number);
  for (let i = 0; i < nums.length; i += 2) { assert.ok(nums[i] >= 19.9 && nums[i] <= 280.1); assert.ok(nums[i + 1] >= 19.9 && nums[i + 1] <= 180.1); }
  assert.ok(p.d.startsWith("M"));
});

test("club: next run date on the brand's clock, calendar file in UTC, words", () => {
  const thu = { id: "thu", day: "thu", time: "19:00", minutes: 75, title: "Park loop", text: "8 km", meet: "The showroom" };
  assert.equal(nextRunDate(thu, at("2026-11-05T12:00:00Z"), TZ), "2026-11-05", "Thursday afternoon: tonight");
  assert.equal(nextRunDate(thu, at("2026-11-05T19:30:00Z"), TZ), "2026-11-12", "after it starts: next week");
  assert.equal(nextRunDate(thu, at("2026-11-06T09:00:00Z"), TZ), "2026-11-12");
  const sat = { ...thu, id: "sat", day: "sat", time: "08:30" };
  assert.deepEqual(runsInOrder([thu, sat], at("2026-11-06T09:00:00Z"), TZ).map((x) => x.run.id), ["sat", "thu"]);
  const ics = runIcs({ run: thu, date: "2026-07-02", place: "E2", business: "Isotach", timeZone: TZ, stamp: new Date("2026-06-01T00:00:00Z") });
  assert.match(ics, /DTSTART:20260702T180000Z/, "19:00 BST is 18:00 UTC");
  assert.match(ics, /DTEND:20260702T191500Z/);
  assert.match(ics, /LOCATION:The showroom/);
  assert.ok(!/RRULE/.test(ics), "one run, never a drifting series");
  assert.equal(runWhen(thu), "Thursday, 7pm");
  assert.equal(runWhen(sat), "Saturday, 8.30am");
});

test("drop queue: fresh numbers only, place in the line", () => {
  const csv = "serving,given,updated_at,note\n12,40,2026-11-07 10:20,\n18,52,2026-11-07 10:40,Coffee on the door\n";
  const q = readQueueSheet(csv, { timeZone: TZ, now: at("2026-11-07T10:45:00Z"), staleAfterMinutes: 20 });
  assert.deepEqual(q, { serving: 18, given: 52, updated: at("2026-11-07T10:40:00Z"), note: "Coffee on the door" });
  assert.equal(readQueueSheet(csv, { timeZone: TZ, now: at("2026-11-07T11:30:00Z"), staleAfterMinutes: 20 }), null);
  assert.equal(readQueueSheet("serving,given,updated_at\n20,10,2026-11-07 10:40\n", { timeZone: TZ, now: at("2026-11-07T10:45:00Z"), staleAfterMinutes: 20 }), null, "given below serving is a typo");
  assert.deepEqual(ticketPlace(30, q, 2), { ahead: 12, wait: 24, called: false });
  assert.deepEqual(ticketPlace(15, q, 2), { ahead: 0, wait: 0, called: true });
});


const demo = JSON.parse(readFileSync("sites/demos/menswear/site.json", "utf8"));
const catalog = loadCatalog(process.cwd());
const errorsOf = (site) => validateSite(site, { catalog, fileExists: () => true });
const clone = (x) => JSON.parse(JSON.stringify(x));

test("menswear demo is valid and the look orders every home section", () => {
  assert.deepEqual(errorsOf(demo), []);
  assert.equal(homeOrderProblem(catalog.looks.basalt.homeOrder), null);
  assert.equal(Object.keys(HOME_PARTS).length, catalog.looks.basalt.homeOrder.length);
});

test("wear validation: demo-only numbers, links and forms never reach a client", () => {
  const c = clone(demo);
  Object.assign(c, { mode: "client", indexable: true });
  c.contact = { whatsapp: "442079460456", phone: "+44 20 7946 0456", email: "hello@isotach.example" };
  c.reviews.source = "google";
  const e = errorsOf(c).join("\n");
  assert.match(e, /stock\.source: fixed numbers/);
  assert.match(e, /drop\.rolling: demo only/);
  assert.match(e, /shop\.url: is a demo address/);
  assert.match(e, /drop\.remindForm: is a demo link/);
  assert.match(e, /dropQueue\.source: fixed numbers are for demos/);
  assert.match(e, /weather\.apiKey: the key of the brand's own paid Open-Meteo plan/);
});

test("wear validation: the size finder names kinds of brand, never a well-known brand", () => {
  const s = clone(demo);
  s.sizeGuide.brands[1].label = "Nike and Adidas";
  s.weather.apiKey = "abc12345";
  const e = errorsOf(s).join("\n");
  assert.match(e, /sizeGuide\.brands\[1\]\.label: a kind of brand/);
  assert.match(e, /weather\.apiKey: a demo shows its example forecast/);
});

test("wear validation: typos, missing measurements and page-name ids are refused", () => {
  const s = clone(demo);
  s.pieces[0].colur = "Black";
  delete s.pieces[1].fit.measures[0].values.XL;
  s.pieces[2].id = "fit";
  s.club.runs[0].route = "nowhere";
  s.lookbook.looks[0].pieces[0].id = "shell-99";
  s.weather.looks.wet.pieces = ["shell-99"];
  const e = errorsOf(s).join("\n");
  assert.match(e, /pieces\[0\]\.colur: unknown setting/);
  assert.match(e, /pieces\[1\]\.fit\.measures\[0\]\.values: a measurement in cm for every size/);
  assert.match(e, /pieces\[2\]\.id: "fit" is the name of a page/);
  assert.match(e, /club\.runs\[0\]\.route: "nowhere" isn't one of club\.routes/);
  assert.match(e, /lookbook\.looks\[0\]\.pieces\[0\]\.id: "shell-99" isn't one of pieces/);
  assert.match(e, /weather\.looks\.wet\.pieces\[0\]: "shell-99" isn't one of pieces/);
});

test("wear CSP: Open-Meteo only on a client with wear-today, the sheet only when stock reads it", () => {
  const h = headersFile(demo, "preview");
  assert.doesNotMatch(h, /open-meteo/, "a demo shows an example forecast and calls nothing");
  const live = clone(demo);
  live.mode = "client";
  assert.match(headersFile(live, "preview"), /connect-src [^\n]*https:\/\/customer-api\.open-meteo\.com/);
  assert.doesNotMatch(h, /docs\.google\.com/, "the demo's stock is fixed, so no sheet is allowed");
  const c = clone(demo);
  c.stock = { source: "sheet", csvUrl: "https://docs.google.com/spreadsheets/d/e/x/pub?output=csv", staleAfterHours: 12, lowAt: 15 };
  c.features = c.features.filter((f) => f !== "wear-today");
  const h2 = headersFile(c, "preview");
  assert.match(h2, /docs\.google\.com/);
  assert.doesNotMatch(h2, /open-meteo/);
});

test("drops: the quiet clock, fixed width, gone once open", async () => {
  const { countdown } = await import("../../src/kits/wear/lib/drop.js");
  assert.equal(countdown("2026-11-07T10:00", at("2026-11-04T19:53:51Z"), TZ), "2d 14h 06m 09s");
  assert.equal(countdown("2026-11-07T10:00", at("2026-11-07T09:59:05Z"), TZ), "00h 00m 55s");
  assert.equal(countdown("2026-11-07T10:00", at("2026-11-07T10:00:00Z"), TZ), null);
});

test("fit: the size finder reads answers against the brand's chart only", async () => {
  const { findSize, chartPosition, feetToCm, stoneToKg } = await import("../../src/kits/wear/lib/fit.js");
  const guide = { sizes: [
    { size: "S", height: [165, 174], weight: [55, 67], chest: [86, 94] },
    { size: "M", height: [173, 181], weight: [66, 78], chest: [94, 102] },
    { size: "L", height: [180, 188], weight: [77, 90], chest: [102, 110] },
    { size: "XL", height: [187, 196], weight: [89, 104], chest: [110, 120] },
  ] };
  assert.equal(chartPosition(177, guide.sizes.map((r) => r.height)), 1);
  assert.equal(feetToCm(5, 11), 180);
  assert.equal(stoneToKg(11, 8), 73);
  assert.equal(findSize({ height: 177, weight: 72 }, guide)?.size, "M");
  // Between M and L: how they like it decides.
  assert.equal(findSize({ height: 181, weight: 78, prefer: "close" }, guide)?.size, "M");
  assert.equal(findSize({ height: 181, weight: 78, prefer: "roomy" }, guide)?.size, "L");
  // Their usual size in brands that run small (shift -1): an L there is an M here.
  const r = findSize({ usual: "L", shift: -1 }, guide);
  assert.equal(r?.size, "M");
  assert.match(r?.reasons[0] ?? "", /which is M here/);
  // A tape measure counts most.
  assert.equal(findSize({ height: 176, weight: 70, chest: 106 }, guide)?.size, "L");
  assert.equal(findSize({ height: 205, weight: 130 }, guide)?.beyond, "above");
  assert.equal(findSize({ height: 150, weight: 45 }, guide)?.beyond, "below");
  assert.equal(findSize({ height: 168, weight: 95 }, guide)?.split, true);
  assert.equal(findSize({}, guide), null);
});

test("fit: the size finder at both edges of the chart never says undefined", async () => {
  const { findSize } = await import("../../src/kits/wear/lib/fit.js");
  const guide = { sizes: [
    { size: "S", height: [165, 174], weight: [55, 67] },
    { size: "M", height: [173, 181], weight: [66, 78] },
    { size: "L", height: [180, 188], weight: [77, 90] },
    { size: "XL", height: [187, 196], weight: [89, 104] },
  ] };
  // The top of XL's own range is XL.
  assert.equal(findSize({ height: 196 }, guide)?.size, "XL");
  assert.equal(findSize({ weight: 104 }, guide)?.size, "XL");
  assert.equal(findSize({ height: 165 }, guide)?.size, "S");
  // Just past the top is above the chart, said in words.
  const r = findSize({ height: 198 }, guide);
  assert.equal(r?.beyond, "above");
  assert.match(r?.reasons[0] ?? "", /above XL on our chart/);
  for (let h = 120; h <= 230; h++) for (const w of [40, 70, 104, 111, 150]) {
    const x = findSize({ height: h, weight: w }, guide);
    assert.ok(!x?.reasons.some((t) => t.includes("undefined")), `${h} cm, ${w} kg`);
  }
});
