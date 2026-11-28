import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dayLight, evening, eveningLine, timecode, runtime, sectionMark, deliveryDate, frameBox, ratioOf, cloudAtGolden, cloudWords, fill, ukHm, ukMidnight, shortDay } from "../../src/kits/carfilm/lib/carfilm.js";
import { HOME_PARTS, homeOrderProblem } from "../../src/kits/carfilm/home.js";
import { validateSite } from "../../src/core/lib/config.js";
import { loadCatalog } from "../../scripts/lib/catalog.js";

const demo = JSON.parse(readFileSync("sites/demos/kerrow/site.json", "utf8"));
const client = JSON.parse(readFileSync("tests/fixtures/sites/test-carfilm-client/site.json", "utf8"));
const look = JSON.parse(readFileSync("src/looks/viewfinder/look.json", "utf8"));
const catalog = loadCatalog(process.cwd());
const errorsFor = (/** @type {(s: any) => void} */ change, base = demo) => { const s = structuredClone(base); change(s); return validateSite(s, { catalog }).join("\n"); };
const LONDON = { lat: 51.5054, lon: -0.0235 };

test("the demo and the client fixture are valid", () => {
  assert.deepEqual(validateSite(demo, { catalog }), []);
  assert.deepEqual(validateSite(client, { catalog }), []);
});

test("the look's home order lists every section once", () => {
  assert.equal(homeOrderProblem(look.homeOrder), null);
  assert.match(homeOrderProblem(look.homeOrder.slice(1)) ?? "", /leaves out/);
  assert.equal(Object.keys(HOME_PARTS).length, look.homeOrder.length);
});

test("sunset and golden hour in London match published times to the minute or two", () => {
  // Published sunsets for London (timeanddate.com): 26 Nov 2026 15:57, 21 Jun 2026 21:21, 21 Dec 2026 15:53.
  const near = (/** @type {number|null} */ ms, /** @type {string} */ hm) => {
    const [h, m] = ukHm(ms).split(":").map(Number), [H, M] = hm.split(":").map(Number);
    assert.ok(Math.abs(h * 60 + m - (H * 60 + M)) <= 2, `${ukHm(ms)} vs ${hm}`);
  };
  near(dayLight("2026-11-26", LONDON.lat, LONDON.lon).sunset, "15:57");
  near(dayLight("2026-06-21", LONDON.lat, LONDON.lon).sunset, "21:21");
  near(dayLight("2026-12-21", LONDON.lat, LONDON.lon).sunset, "15:53");
  const l = dayLight("2026-11-26", LONDON.lat, LONDON.lon);
  assert.ok(/** @type {number} */ (l.goldPmStart) < /** @type {number} */ (l.sunset) && /** @type {number} */ (l.sunset) < /** @type {number} */ (l.goldPmEnd) && /** @type {number} */ (l.goldPmEnd) < /** @type {number} */ (l.bluePmEnd));
});

test("the days the clocks change are 23 and 25 hours long, and still give the right sunset", () => {
  assert.equal(ukMidnight("2026-03-30") - ukMidnight("2026-03-29"), 23 * 3_600_000);
  assert.equal(ukMidnight("2026-10-26") - ukMidnight("2026-10-25"), 25 * 3_600_000);
  assert.equal(ukHm(dayLight("2026-03-29", 51.5, 0).sunset), "19:28"); // BST from 01:00 that morning
  assert.equal(ukHm(dayLight("2026-10-25", 51.5, 0).sunset), "16:46"); // back to GMT
});

test("in a northern December the sun can stay under 6°, and the line says so", () => {
  const shetland = dayLight("2026-12-21", 60.15, -1.15); // Lerwick at midwinter: the sun peaks about 6.4° up
  assert.ok(shetland.max < 7);
  const low = eveningLine({ ...shetland, max: 5 });
  assert.equal(low.low, true);
  assert.equal(low.gold, `${ukHm(shetland.sunrise)} – ${ukHm(shetland.sunset)}`);
});

test("tonight becomes tomorrow once tonight's blue hour is over, never showing a time that has passed", () => {
  const before = evening(Date.parse("2026-11-26T15:00:00Z"), LONDON.lat, LONDON.lon);
  const after = evening(Date.parse("2026-11-26T20:00:00Z"), LONDON.lat, LONDON.lon);
  assert.equal(before.when, "tonight"); assert.equal(before.light.ymd, "2026-11-26");
  assert.equal(after.when, "tomorrow"); assert.equal(after.light.ymd, "2026-11-27");
});

test("timecode counts the film's own frames; runtimes and section markers read like an edit", () => {
  assert.equal(timecode(0, 25), "00:00:00:00");
  assert.equal(timecode(3.48, 25), "00:00:03:12");
  assert.equal(timecode(61.99, 25), "00:01:01:24");
  assert.equal(timecode(1 / 30 * 29, 30), "00:00:00:29");
  assert.equal(runtime(6), "00:06"); assert.equal(runtime(125.4), "02:05");
  assert.equal(sectionMark(1), "01:00:12:00"); assert.equal(sectionMark(5), "01:01:00:00");
});

test("delivery dates count working days and skip UK bank holidays for the studio's nation", () => {
  const week = ["mon", "tue", "wed", "thu", "fri"];
  assert.equal(deliveryDate("2026-11-26", 5, week, "E14 3QT"), "2026-12-03");
  // Christmas: 25 Dec (Fri), Boxing Day's substitute 28 Dec (Mon) and New Year's Day are skipped.
  assert.equal(deliveryDate("2026-12-23", 5, week, "E14 3QT"), "2027-01-04");
  // Scotland also has 2 January (a Saturday in 2027, so its Monday the 4th is a holiday there).
  assert.equal(deliveryDate("2026-12-23", 5, week, "EH1 1AA"), "2027-01-05");
  assert.equal(deliveryDate("2026-11-27", 1, ["sat"], "E14 3QT"), "2026-11-28");
});

test("the frame is as large as fits, keeps its shape and never passes the picture's edges", () => {
  const W = 1376, H = 640;
  for (const r of [2.39, 16 / 9, 9 / 16, 4 / 3]) {
    const b = frameBox(r, W, H, 0.5, 0.5);
    assert.ok(Math.abs(b.width / b.height - r) < 0.01, `ratio ${r}`);
    assert.ok(b.left >= 0 && b.top >= 0 && b.left + b.width <= W && b.top + b.height <= H);
  }
  const edge = frameBox(9 / 16, W, H, 0.99, 0.5);
  assert.equal(edge.left + edge.width, W);
  assert.ok(Math.abs(ratioOf("2.39:1") - 2.39) < 1e-9); assert.ok(Number.isNaN(ratioOf("wide")));
});

test("the cloud forecast is read only when it is fresh and reaches golden hour", () => {
  const l = dayLight("2026-11-27", LONDON.lat, LONDON.lon);
  const mid = (/** @type {number} */ (l.goldPmStart) + /** @type {number} */ (l.goldPmEnd)) / 2;
  const hour = new Date(Math.round(mid / 3_600_000) * 3_600_000).toISOString().replace(".000", "");
  const now = Date.parse("2026-11-27T09:00:00Z");
  const reply = (/** @type {string} */ updated, /** @type {any[]} */ series) => ({ properties: { meta: { updated_at: updated }, timeseries: series } });
  const ok = reply("2026-11-27T08:10:00Z", [{ time: hour, data: { instant: { details: { cloud_area_fraction: 18.4 } } } }]);
  assert.deepEqual(cloudAtGolden(ok, l, now)?.cloud, 18);
  assert.equal(cloudAtGolden(reply("2026-11-26T08:00:00Z", ok.properties.timeseries), l, now), null, "a day-old forecast is not used");
  assert.equal(cloudAtGolden(reply("2026-11-27T08:10:00Z", [{ time: "2026-11-27T06:00:00Z", data: { instant: { details: { cloud_area_fraction: 5 } } } }]), l, now), null, "nothing near golden hour");
  assert.equal(cloudAtGolden(reply("2026-11-27T20:00:00Z", ok.properties.timeseries), l, now), null, "an update time in the future is not trusted");
  assert.equal(cloudAtGolden(null, l, now), null);
  assert.equal(cloudAtGolden({ properties: {} }, l, now), null);
  assert.deepEqual([0, 30, 50, 80, 100].map(cloudWords), ["clear", "mostly clear", "partly cloudy", "mostly cloudy", "overcast"]);
});

test("messages fill only the gaps they name", () => {
  assert.equal(fill("At {road} on {date}, {nope}", { road: "Snake Pass", date: "Fri 27 Nov" }), "At Snake Pass on Fri 27 Nov, {nope}");
  assert.equal(shortDay("2026-11-27"), "Fri 27 Nov");
});

test("a price is the whole price, and says what it includes", () => {
  assert.match(errorsFor((s) => { s.packages.items[0].price = "from 650"; }), /whole price/);
  assert.match(errorsFor((s) => { s.packages.note = "Sample prices."; }), /what every price includes/);
  assert.match(errorsFor((s) => { s.packages.note = "Includes travel. Prices from £650."; }), /from £/);
  assert.match(errorsFor((s) => { s.packages.items[0].includes[0] = "Starting at two hours"; }), /starting at/);
  assert.equal(errorsFor((s) => { s.packages.items[0].price = null; }), "");
});

test("a format's size must be its shape, and the viewfinder needs two to five of them", () => {
  assert.match(errorsFor((s) => { s.formats.items[0].size = "3840 × 2160"; }), /isn't the shape 2\.39:1/);
  assert.match(errorsFor((s) => { s.formats.items[0].size = "3840x1608"; }), /with ×/);
  assert.match(errorsFor((s) => { for (const f of s.formats.items) f.viewfinder = false; s.formats.items[0].viewfinder = true; }), /2–5 formats/);
});

test("roads, films, the forecast and the shot list are checked", () => {
  assert.match(errorsFor((s) => { s.roads.items[0].lat = 40.4; }), /in the UK/);
  assert.match(errorsFor((s) => { s.roads.default = "nowhere"; }), /opens on/);
  assert.match(errorsFor((s) => { s.hero.film.fps = 29; }), /frame rate/);
  assert.match(errorsFor((s) => { s.reel.items[0].seconds = 0; }), /length in seconds/);
  assert.match(errorsFor((s) => { s.forecast.source = "open-meteo"; }), /met-norway/);
  assert.match(errorsFor((s) => { s.shotList.message = "My list"; }), /\{shots\}/);
  assert.match(errorsFor((s) => { s.guides.dealers.description = "x".repeat(161); }), /160 characters/);
  assert.match(errorsFor((s) => { s.roads.colour = "red"; }), /unknown setting/);
});

test("Starter and Plus can't take the Signature showpieces", () => {
  assert.match(errorsFor((s) => { s.plan = "plus"; }), /carfilm-formats|signature/);
  assert.match(errorsFor((s) => { s.features.push("carfilm-planner"); s.nav = []; }, client), /signature/);
});
