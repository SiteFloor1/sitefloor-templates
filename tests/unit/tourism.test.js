import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { realDate, monthWords, monthMarks, fits, byFit, tzOffset, gapWords, localLine, sunTimes, daylight, drawMap, routeShares, shortlistMessage, builderMessage, cleanCode, tripFromCsv, daysTo, longDate, isTravelAdvice, pounds } from "../../src/kits/tourism/lib/tourism.js";
import { journeyMap, journeyFor, pageData } from "../../src/kits/tourism/kit.js";
import { HOME_PARTS } from "../../src/kits/tourism/home.js";
import { COUNTRIES } from "../../src/kits/tourism/lib/countries.js";
import { validateSite } from "../../src/core/lib/config.js";
import { loadCatalog } from "../../scripts/lib/catalog.js";

const demo = JSON.parse(readFileSync("sites/demos/larrow/site.json", "utf8"));
const client = JSON.parse(readFileSync("tests/fixtures/sites/test-tourism-client/site.json", "utf8"));
const look = JSON.parse(readFileSync("src/looks/logbook/look.json", "utf8"));
const catalog = loadCatalog(process.cwd());
const errorsFor = (/** @type {(s: any) => void} */ change, base = demo) => { const s = structuredClone(base); change(s); return validateSite(s, { catalog }).join("\n"); };

test("the demo and the client fixture are valid", () => {
  assert.deepEqual(validateSite(demo, { catalog }), []);
  assert.deepEqual(validateSite(client, { catalog }), []);
});

test("the look's home order lists every section once", () => {
  assert.deepEqual([...look.homeOrder].sort(), Object.keys(HOME_PARTS).sort());
});

test("best months read as runs, pairs or all year, across the new year", () => {
  assert.equal(monthWords([1, 2, 3, 10, 11, 12]), "Oct–Mar");
  assert.equal(monthWords([5, 6, 7, 8, 9, 10]), "May–Oct");
  assert.equal(monthWords([4, 11]), "Apr and Nov");
  assert.equal(monthWords([3, 4, 5, 9, 10, 11]), "Mar–May, Sep–Nov");
  assert.equal(monthWords([7]), "Jul");
  assert.equal(monthWords([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]), "all year");
  assert.equal(monthWords([]), "");
});

test("the year drawn marks where each run starts and ends, even across December", () => {
  const m = monthMarks([1, 2, 11, 12]);
  assert.deepEqual(m.filter((x) => x.on).map((x) => x.month), [1, 2, 11, 12]);
  assert.deepEqual(m.filter((x) => x.start).map((x) => x.month), [11]);
  assert.deepEqual(m.filter((x) => x.end).map((x) => x.month), [2]);
  assert.equal(m[3].on, false);
});

test("a journey fits the month, who's going and nights within three", () => {
  const j = { go: [10, 11], who: ["couple", "solo"], nights: 11 };
  assert.equal(fits(j, { month: 11, who: "couple", nights: 10 }), true);
  assert.equal(fits(j, { month: 11, who: "couple", nights: 14 }), true);
  assert.equal(fits(j, { month: 11, who: "couple", nights: 7 }), false);
  assert.equal(fits(j, { month: 6, who: "couple", nights: 10 }), false);
  assert.equal(fits(j, { month: 11, who: "family", nights: 10 }), false);
  const js = [{ id: "a", go: [6], who: ["couple"], nights: 10 }, { id: "b", go: [11], who: ["couple"], nights: 10 }, { id: "c", go: [11], who: ["couple"], nights: 9 }];
  assert.deepEqual(byFit(js, { month: 11, who: "couple", nights: 10 }).map((j) => j.id), ["b", "c", "a"]);
});

test("local time and the gap to London come from the time-zone data, summer time included", () => {
  const nov = Date.UTC(2026, 10, 17, 12, 0);
  const jul = Date.UTC(2026, 6, 1, 12, 0);
  assert.equal(tzOffset("Europe/London", nov), 0);
  assert.equal(tzOffset("Europe/London", jul), 1);
  assert.equal(gapWords("America/Punta_Arenas", nov), "3 hours behind London");
  assert.equal(gapWords("Asia/Tokyo", nov), "9 hours ahead of London");
  assert.equal(gapWords("Asia/Tokyo", jul), "8 hours ahead of London");
  assert.equal(gapWords("Asia/Kolkata", nov), "5½ hours ahead of London");
  assert.equal(gapWords("Europe/Dublin", nov), "same time as London");
  assert.equal(gapWords("Europe/Paris", nov), "1 hour ahead of London");
  assert.equal(localLine("Asia/Tokyo", nov), "Local time 21:00 · 9 hours ahead of London");
});

test("sunrise and sunset agree with published times to a few minutes, and say so in the polar day", () => {
  // London, 21 June: sunrise about 03:43 UTC, sunset about 20:21 UTC.
  const s = /** @type {{ rise: number, set: number }} */ (sunTimes(51.5074, -0.1278, "2026-06-21"));
  assert.ok(Math.abs(s.rise - (3 * 60 + 43)) <= 4, `rise ${s.rise}`);
  assert.ok(Math.abs(s.set - (20 * 60 + 21)) <= 4, `set ${s.set}`);
  assert.deepEqual(sunTimes(78.22, 15.65, "2026-06-15"), { polar: "day" });
  assert.deepEqual(sunTimes(78.22, 15.65, "2026-12-15"), { polar: "night" });
  const d = daylight(51.5074, -0.1278, "Europe/London", 6, 2026);
  assert.match(d.words, /^Sunrise 04:4\d · sunset 21:\d\d · 16 h \d+ min of light$/);
  assert.equal(daylight(78.22, 15.65, "Arctic/Longyearbyen", 6, 2026).words, "The sun doesn't set");
});

test("the drawn map fits the country to 1000 units and places the route's points on it", () => {
  const m = drawMap(COUNTRIES.CHL, [{ name: "a", lat: -22.91, lon: -68.2 }, { name: "b", lat: -51.0, lon: -72.98 }]);
  assert.ok(m.height === 1000 && m.width < 300, `${m.width}×${m.height}`);
  assert.equal(m.tall, true);
  assert.match(m.land, /^M[\d. L]+Z/);
  assert.match(m.route, /^M[\d.]+ [\d.]+L[\d.]+ [\d.]+$/);
  const nam = drawMap(COUNTRIES.NAM, [{ name: "x", lat: -24.73, lon: 15.29 }]);
  assert.equal(nam.tall, false);
  assert.deepEqual(routeShares([{ xy: [0, 0] }, { xy: [3, 4] }, { xy: [3, 9] }]), [0, 0.5, 1]);
});

test("a journey's map merges stops in one place, passes through its via places and labels without overlap", () => {
  const ice = demo.journeys.items.find((/** @type {any} */ j) => j.id === "desert-to-ice");
  const m = journeyMap(ice);
  assert.deepEqual(m.points.map((p) => p.name), ["San Pedro de Atacama", "Santiago", "Punta Arenas", "Torres del Paine", "Lago Grey"]);
  assert.deepEqual(m.points.map((p) => p.major), [true, false, true, true, false].map((_, i) => i !== 1));
  assert.equal(m.at[0].share, 0);
  assert.equal(m.at[3].point, m.at[2].point); // the French Valley walks from the same base
  assert.equal(m.at[4].share, 1);
  assert.ok(m.at[1].share > 0.5 && m.at[1].share < 1);
  assert.ok(m.points.every((p) => p.x >= 0 && p.x <= 100 && p.y >= 0 && p.y <= 100));
  assert.ok(m.points[0].label);
});

test("the journey of the month is the operator's pick, else the hero's journey", () => {
  assert.deepEqual(journeyFor(demo, 11), { id: "desert-to-ice", ofMonth: true });
  assert.deepEqual(journeyFor(demo, 6), { id: "dunes-to-waterholes", ofMonth: true });
  const s = structuredClone(demo); delete s.journeys.monthly["6"];
  assert.deepEqual(journeyFor(s, 6), { id: "desert-to-ice", ofMonth: false });
});

test("messages name the journeys, nights and month, and never a price", () => {
  assert.equal(shortlistMessage("Larrow", [{ name: "Desert to ice", nights: 11 }, { name: "The Atacama, slowly", nights: 7 }]),
    "Hello Larrow, these are the journeys we like:\n· Desert to ice (11 nights)\n· The Atacama, slowly (7 nights)\nCould we talk about dates?");
  assert.equal(shortlistMessage("Larrow", []), "Hello Larrow, I'd like to talk about a journey.");
  assert.equal(builderMessage("Larrow", [{ name: "The Atacama", nights: 3 }, { name: "Torres del Paine", nights: 1 }], 11, "couple"),
    "Hello Larrow, we're thinking of a trip in November (two of us):\n· The Atacama, 3 nights\n· Torres del Paine, 1 night\n4 nights in all. Could you suggest how to put it together?");
  assert.doesNotMatch(builderMessage("X", [{ name: "A", nights: 2 }], null, "solo"), /£/);
});

test("trip codes and the operator's sheet fail closed", () => {
  assert.equal(cleanCode(" lar-4817 "), "LAR4817");
  assert.equal(cleanCode("abc"), "");
  const csv = "code,journey,start,travellers,updated\nLAR4817,desert-to-ice,2027-01-12,2,2026-11-15\nOLD123,desert-to-ice,2027-01-12,2,2026-09-01\nBAD999,nowhere,2027-01-12,2,2026-11-15";
  assert.deepEqual(tripFromCsv(csv, "LAR4817", ["desert-to-ice"], "2026-11-17", 14), { ok: true, journey: "desert-to-ice", start: "2027-01-12", travellers: 2, updated: "2026-11-15" });
  assert.deepEqual(tripFromCsv(csv, "NOPE123", ["desert-to-ice"], "2026-11-17", 14), { ok: false, reason: "unknown" });
  assert.deepEqual(tripFromCsv(csv, "OLD123", ["desert-to-ice"], "2026-11-17", 14), { ok: false, reason: "stale" });
  assert.deepEqual(tripFromCsv(csv, "BAD999", ["desert-to-ice"], "2026-11-17", 14), { ok: false, reason: "unreadable" });
  assert.deepEqual(tripFromCsv("name,when\nx,y", "LAR4817", ["desert-to-ice"], "2026-11-17", 14), { ok: false, reason: "unreadable" });
  // A future "updated" date is a typo, not a fresh row; impossible dates are unreadable (audit 2026-11-17-F, TO-01/02).
  const odd = "code,journey,start,travellers,updated\nFUT123,desert-to-ice,2027-01-12,2,2027-06-01\nBADDAY1,desert-to-ice,2027-13-45,2,2026-11-15\nFEB301,desert-to-ice,2027-02-30,2,2026-11-15\nUPD999,desert-to-ice,2027-01-12,2,2026-11-31";
  for (const code of ["FUT123", "BADDAY1", "FEB301", "UPD999"]) assert.deepEqual(tripFromCsv(odd, code, ["desert-to-ice"], "2026-11-17", 14), { ok: false, reason: "unreadable" }, code);
  assert.equal(realDate("2027-02-28"), true);
  assert.equal(realDate("2028-02-29"), true);
  assert.equal(realDate("2027-02-29"), false);
  assert.equal(realDate("2027-13-01"), false);
  assert.equal(realDate("27-01-01"), false);
  assert.equal(daysTo("2026-11-17", "2026-12-29"), 42);
  assert.equal(longDate("2026-12-29"), "Tuesday 29 December 2026");
  assert.equal(pounds(8900), "£8,900");
});

test("only gov.uk's foreign travel advice may be linked as travel advice", () => {
  assert.equal(isTravelAdvice("https://www.gov.uk/foreign-travel-advice/chile"), true);
  assert.equal(isTravelAdvice("https://www.gov.uk/foreign-travel-advice/chile/entry-requirements"), false);
  assert.equal(isTravelAdvice("https://example.com/foreign-travel-advice/chile"), false);
  assert.match(errorsFor((s) => { s.ready.countries[0].advice = "https://travel.example/chile"; }), /ready\.countries\[0\]\.advice/);
});

test("the checks keep journeys, weather, ATOL and trips honest", () => {
  assert.match(errorsFor((s) => { s.journeys.items[0].country = "XXX"; }), /journeys\.items\[0\]\.country/);
  assert.match(errorsFor((s) => { s.journeys.items[0].stops[0].tz = "Mars/Olympus"; }), /stops\[0\]\.tz/);
  assert.match(errorsFor((s) => { s.journeys.items[0].go = [0, 13]; }), /journeys\.items\[0\]\.go/);
  assert.match(errorsFor((s) => { s.journeys.items[0].who = ["everyone"]; }), /journeys\.items\[0\]\.who/);
  assert.match(errorsFor((s) => { s.journeys.monthly["3"] = "nowhere"; }), /journeys\.monthly\.3/);
  assert.match(errorsFor((s) => { delete s.journeys.monthly; }), /journeys\.monthly/);
  assert.match(errorsFor((s) => { s.climate.places.atacama = [20, 21]; }), /climate\.places\.atacama/);
  assert.match(errorsFor((s) => { delete s.climate.source; }), /climate\.source/);
  assert.match(errorsFor((s) => { delete s.when.places[0].climate; }), /when\.places\[0\]\.climate/);
  assert.match(errorsFor((s) => { s.atol.number = ""; }), /atol\.number/);
  assert.match(errorsFor((s) => { s.builder.regions[0].nights = [5, 3]; }), /builder\.regions\[0\]\.nights/);
  assert.match(errorsFor((s) => { s.trip.source = "simulated"; s.trip.example = "ABC1234"; delete s.trip.csvUrl; }, client), /trip\.source/);
  assert.match(errorsFor((s) => { s.trip.csvUrl = "https://example.com/trips.csv"; }, client), /trip\.csvUrl/);
  assert.match(errorsFor((s) => { s.journeys.items[0].via = [{ name: "x", lat: 0, lon: 0, before: 9 }]; }), /via\[0\]\.before/);
});

test("the page data carries only what the browser needs, and the demo's code only on the demo", () => {
  const d = pageData({ ...demo, features: demo.features });
  assert.equal(d.tourism.trip.example, "LAR4817");
  assert.equal(d.tourism.journeys.length, demo.journeys.items.length);
  assert.ok(!("stops" in d.tourism.journeys[0]));
  const c = pageData(client);
  assert.equal(c.tourism.trip.example, undefined);
  assert.equal(c.tourism.trip.csvUrl, client.trip.csvUrl);
});
