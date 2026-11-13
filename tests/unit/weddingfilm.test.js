import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dayLight, portraitWindow, along, lightIcs, lightText, minutesOf } from "../../src/kits/weddingfilm/lib/sun.js";
import { diaryFromCsv, answerFor, dateText, deliveryDates } from "../../src/kits/weddingfilm/lib/dates.js";
import { builderTotal, builderText, gbp } from "../../src/kits/weddingfilm/lib/packages.js";
import { progressFromCsv, cleanCode, STAGES } from "../../src/kits/weddingfilm/lib/couples.js";
import { dayPlan, dayText, dayIcs, clampCeremony } from "../../src/kits/weddingfilm/lib/day.js";
import { HOME_PARTS, homeOrderProblem, onPagesProblem } from "../../src/kits/weddingfilm/home.js";
import { validateSite } from "../../src/core/lib/config.js";
import { loadCatalog } from "../../scripts/lib/catalog.js";

const demo = JSON.parse(readFileSync("sites/demos/weddingfilm/site.json", "utf8"));
const client = JSON.parse(readFileSync("tests/fixtures/sites/test-weddingfilm-client/site.json", "utf8"));
const look = JSON.parse(readFileSync("src/looks/premiere/look.json", "utf8"));
const catalog = loadCatalog(process.cwd());
const errorsFor = (/** @type {(s: any) => void} */ change, base = demo) => { const s = structuredClone(base); change(s); return validateSite(s, { catalog }).join("\n"); };
const TZ = "Europe/London";
const at = (/** @type {string} */ s) => Date.parse(s);

test("the demo and the client fixture are valid, and the look lists every home section", () => {
  assert.deepEqual(validateSite(demo, { catalog }), []);
  assert.deepEqual(validateSite(client, { catalog }), []);
  assert.equal(homeOrderProblem(look.homeOrder), null);
  assert.equal(onPagesProblem(look.onPages), null);
  assert.equal(look.homeOrder.length, Object.keys(HOME_PARTS).length);
});

// Reference times from the astral library (Python), 4 Nov 2026. Ours must agree to within a minute.
const REF = [
  { what: "Bibury, midsummer Saturday", ymd: "2027-06-19", lat: 51.758, lon: -1.833, tz: TZ, sunrise: "04:48", sunset: "21:28", goldenFrom: "20:35", goldenTo: "21:58", blueTo: "22:18" },
  { what: "Bibury, September", ymd: "2027-09-18", lat: 51.758, lon: -1.833, tz: TZ, sunrise: "06:46", sunset: "19:15", goldenFrom: "18:32", goldenTo: "19:36", blueTo: "19:49" },
  { what: "Edinburgh, longest day", ymd: "2027-06-21", lat: 55.953, lon: -3.188, tz: TZ, sunrise: "04:26", sunset: "22:02", goldenFrom: "20:59", goldenTo: "22:39", blueTo: "23:06" },
  { what: "Lake Como, in Italian time", ymd: "2027-06-19", lat: 45.986, lon: 9.262, tz: "Europe/Rome", sunrise: "05:32", sunset: "21:16", goldenFrom: "20:31", goldenTo: "21:40", blueTo: "21:55" },
  { what: "London, December (GMT)", ymd: "2026-12-19", lat: 51.501, lon: -0.142, tz: TZ, sunrise: "08:02", sunset: "15:52", goldenFrom: "14:52", goldenTo: "16:18", blueTo: "16:33" },
];

test("sunrise, sunset, golden and blue hour agree with the astral library to within a minute", () => {
  for (const r of REF) {
    const l = dayLight(r.ymd, r.lat, r.lon, r.tz);
    for (const k of /** @type {const} */ (["sunrise", "sunset", "goldenFrom", "goldenTo", "blueTo"])) {
      const got = l[k];
      assert.ok(got, `${r.what}: ${k} missing`);
      assert.ok(Math.abs(minutesOf(/** @type {string} */ (got)) - minutesOf(r[k])) <= 1, `${r.what}: ${k} ${got}, astral ${r[k]}`);
    }
  }
});

test("near the pole, what doesn't happen comes back empty rather than a made-up time", () => {
  const l = dayLight("2027-06-21", 69.65, 18.96, "Europe/Oslo"); // Tromsø: midnight sun
  assert.equal(l.sunset, null);
  assert.equal(l.goldenTo, null);
});

test("the portrait window and the day line use the studio's minutes and the day's real light", () => {
  const l = dayLight("2027-06-19", 51.758, -1.833, TZ);
  assert.deepEqual(portraitWindow(l, 5, 40), { from: "20:40", to: "21:20" });
  assert.equal(portraitWindow({ ...l, goldenFrom: null }, 5, 40), null);
  assert.equal(along("04:00"), 0);
  assert.equal(along("23:00"), 100);
  assert.equal(along("13:30"), 50);
});

test("the golden-hour calendar file is in UTC (BST taken off) and names the place", () => {
  const l = dayLight("2027-06-19", 51.758, -1.833, TZ);
  const ics = /** @type {string} */ (lightIcs({ date: "2027-06-19", placeName: "Bibury", tz: TZ, light: l, portrait: { from: "20:40", to: "21:20" }, studio: "Larchmere", stamp: "20261104T090000Z" }));
  assert.match(ics, /DTSTART:20270619T193\d00Z/);
  assert.match(ics, /DTSTART:20270619T194000Z/);
  assert.match(ics, /LOCATION:Bibury/);
  assert.match(ics, /\r\nEND:VCALENDAR\r\n$/);
  assert.equal(lightIcs({ date: "2027-06-21", placeName: "Tromsø", tz: "Europe/Oslo", light: dayLight("2027-06-21", 69.65, 18.96, "Europe/Oslo"), portrait: null, studio: "X", stamp: "x" }), null);
  const text = lightText("Hello", { date: "Saturday 19 June 2027", placeName: "Bibury", light: l, portrait: null });
  assert.match(text, /Where: Bibury/);
  assert.match(text, /Golden hour: 20:3\d to 21:5\d/);
});

const NOW = at("2026-11-04T12:00:00Z");
const SHEET = "date,status,updated_at\n2027-06-12,booked,2026-11-04 10:00\n2027-06-26,held,2026-11-04 10:00\n2027-07-03,BOOKED?,2026-11-04 10:00\n";

test("the diary: free, held, booked; a word it doesn't know counts as booked, never free", () => {
  const d = diaryFromCsv(SHEET, NOW, TZ, 48);
  assert.ok(d.ok);
  assert.equal(answerFor(d, "2027-06-19", "2026-11-04"), "free");
  assert.equal(answerFor(d, "2027-06-26", "2026-11-04"), "held");
  assert.equal(answerFor(d, "2027-06-12", "2026-11-04"), "booked");
  assert.equal(answerFor(d, "2027-07-03", "2026-11-04"), "booked");
  assert.equal(answerFor(d, "2026-10-01", "2026-11-04"), "past");
  assert.equal(answerFor(d, "2027-02-30", "2026-11-04"), "ask");
});

test("the diary fails closed: stale, undated or unreadable never says free", () => {
  const stale = diaryFromCsv(SHEET, at("2026-11-09T12:00:00Z"), TZ, 48);
  assert.deepEqual(stale, { ok: false, reason: "stale" });
  assert.equal(answerFor(stale, "2027-06-19", "2026-11-04"), "ask");
  assert.deepEqual(diaryFromCsv("date,status,updated_at\n2027-06-12,booked,\n", NOW, TZ, 48), { ok: false, reason: "undated" });
  assert.deepEqual(diaryFromCsv("when,what\n", NOW, TZ, 48), { ok: false, reason: "unreadable" });
  assert.deepEqual(diaryFromCsv("", NOW, TZ, 48), { ok: false, reason: "unreadable" });
});

test("the date message carries the date in UK order and never claims a booking", () => {
  const t = dateText("Hello Larchmere", { date: "2027-06-19", venue: "  Wrenmoor Hall ", answer: "free", sunset: "21:29" });
  assert.match(t, /^Hello Larchmere\n\nWedding: Saturday 19 June 2027\nVenue: Wrenmoor Hall\n/);
  assert.match(t, /Could you hold it/);
  assert.match(t, /Sunset that day: 21:29/);
  assert.doesNotMatch(t, /confirmed|booked for/i);
  assert.doesNotMatch(dateText("Hi", { date: "2027-06-19", answer: "ask" }), /free|held|booked/);
});

test("delivery dates are counted in weeks after the wedding, earliest first", () => {
  const d = deliveryDates("2027-06-19", [{ id: "film", label: "Film", weeksAfter: 10 }, { id: "trailer", label: "Trailer", weeksAfter: 3 }]);
  assert.deepEqual(d.map((x) => [x.id, x.date]), [["trailer", "2027-07-10"], ["film", "2027-08-28"]]);
});

test("the builder adds the studio's own prices and clamps extras to their maximum", () => {
  const pkg = { id: "film", name: "The film", price: 2400 };
  const extras = [{ id: "hour", name: "Another hour", price: 250, per: "hour", max: 3 }, { id: "drone", name: "Drone", price: 350 }];
  assert.deepEqual(builderTotal(pkg, extras, { hour: 5, drone: 1 }), { total: 3500, lines: [{ name: "The film", amount: 2400 }, { name: "Another hour × 3", amount: 750 }, { name: "Drone", amount: 350 }] });
  assert.equal(builderTotal({ ...pkg, price: null }, extras, {}), null);
  assert.equal(gbp(12500), "£12,500");
  const t = builderText("Hello", { pkg, extras, counts: { hour: 1 }, date: "Saturday 19 June 2027" });
  assert.equal(t, "Hello\n\nPackage: The film\nAdd: Another hour\nTotal on your site: £2,650\nWedding: Saturday 19 June 2027");
});

const PROGRESS = "code,wedding,stage,trailer,photographs,note,updated_at\nLARCH0619,2027-06-19,colour,delivered,2027-08-28,Proofs are with you.,2026-11-04 09:00\nODDWORD1,2027-06-19,nearly done,,,,2026-11-04 09:00\n";

test("film progress: only a known code, the stage the studio wrote, and it fails closed", () => {
  const p = progressFromCsv(PROGRESS, "larch-0619", NOW, TZ, 72);
  assert.ok(p.ok);
  if (!p.ok) return;
  assert.equal(STAGES[p.stage].label, "Colour");
  assert.deepEqual([p.trailer, p.photographs], [{ state: "delivered" }, { state: "due", date: "2027-08-28" }]);
  assert.equal(p.note, "Proofs are with you.");
  assert.ok(!("filmUrl" in p) && !("galleryUrl" in p), "the page never carries a film or gallery link");
  const odd = progressFromCsv(PROGRESS, "ODDWORD1", NOW, TZ, 72);
  assert.ok(odd.ok && odd.stage === 0, "a stage word it doesn't know never moves the film on");
  assert.deepEqual(progressFromCsv(PROGRESS, "NOPE1234", NOW, TZ, 72), { ok: false, reason: "unknown" });
  assert.deepEqual(progressFromCsv(PROGRESS, "AB1", NOW, TZ, 72), { ok: false, reason: "short" });
  assert.deepEqual(progressFromCsv(PROGRESS, "LARCH0619", at("2026-11-08T12:00:00Z"), TZ, 72), { ok: false, reason: "stale" });
  assert.deepEqual(progressFromCsv("code,name\n", "LARCH0619", NOW, TZ, 72), { ok: false, reason: "unreadable" });
  assert.equal(cleanCode(" larch 0619 "), "LARCH0619");
});

test("the couples' sheet is public, so a sheet with a link anywhere in it is refused", () => {
  const withLink = (/** @type {string} */ cell) => `code,wedding,stage,trailer,note,updated_at\nLARCH0619,2027-06-19,edit,,${cell},2026-11-04 09:00\nOTHER123,2027-06-26,footage,,,2026-11-04 09:00\n`;
  for (const cell of ["https://vimeo.com/123", "vimeo.com/123/abc", "www.pic-time.com/x", "see larchmere.co.uk/g"]) {
    assert.deepEqual(progressFromCsv(withLink(cell), "OTHER123", NOW, TZ, 72), { ok: false, reason: "unreadable" }, cell);
  }
  assert.ok(progressFromCsv(withLink("Your album proofs are with you."), "LARCH0619", NOW, TZ, 72).ok);
});

test("a sheet stamped in the future is a typo, never fresh: refused by the diary and the progress page", () => {
  const ahead = (/** @type {string} */ when) => `date,status,updated_at\n2027-06-12,booked,${when}\n`;
  assert.deepEqual(diaryFromCsv(ahead("2027-11-04 10:00"), NOW, TZ, 48), { ok: false, reason: "unreadable" });
  assert.ok(diaryFromCsv(ahead("2026-11-04 12:05"), NOW, TZ, 48).ok, "a few minutes ahead (clock drift) is fine");
  const prog = (/** @type {string} */ when) => `code,wedding,stage,trailer,updated_at\nLARCH0619,2027-06-19,edit,,${when}\n`;
  assert.deepEqual(progressFromCsv(prog("2027-11-04 09:00"), "LARCH0619", NOW, TZ, 72), { ok: false, reason: "unreadable" });
  assert.ok(progressFromCsv(prog("2026-11-04 12:05"), "LARCH0619", NOW, TZ, 72).ok);
});

const BLOCKS = { prep: 120, ceremony: 30, drinks: 90, meal: 105, speeches: 30, danceAfter: 45, after: 30 };

test("the day plan: the studio's blocks from the ceremony, portraits in that evening's golden hour, and it stays for it", () => {
  const l = dayLight("2027-06-19", 51.758, -1.833, TZ);
  const p = dayPlan("14:00", l, BLOCKS, { start: 5, length: 40 });
  const at = (/** @type {string} */ id) => p.moments.find((m) => m.id === id);
  assert.deepEqual([at("prep")?.from, at("ceremony")?.from, at("ceremony")?.to, at("speeches")?.from, at("dance")?.from], ["11:45", "14:00", "14:30", "17:45", "19:00"]);
  assert.deepEqual([at("portraits")?.from, at("portraits")?.to], ["20:40", "21:20"]);
  assert.equal(at("end")?.from, "21:35", "the studio stays on for golden hour");
  assert.equal(p.hours, 10);
  assert.match(p.portraitNote, /Golden hour starts at 20:35/);
  const order = p.moments.map((m) => m.from);
  assert.deepEqual(order, [...order].sort());
});

test("the day plan in winter: golden hour before the ceremony ends puts portraits straight after it, honestly", () => {
  const l = dayLight("2026-12-19", 51.758, -1.833, TZ);
  const p = dayPlan("15:00", l, BLOCKS, { start: 5, length: 40 });
  const portraits = p.moments.find((m) => m.id === "portraits");
  assert.equal(portraits?.from, "15:40");
  assert.match(portraits?.note ?? "", /before the sun sets at 15:5\d/);
  assert.match(p.portraitNote, /before your ceremony ends/);
  const late = dayPlan("16:00", l, BLOCKS, { start: 5, length: 40 }).moments.find((m) => m.id === "portraits");
  assert.match(late?.note ?? "", /After dark/);
});

test("the day plan as a message and a calendar file in UTC", () => {
  const l = dayLight("2027-06-19", 51.758, -1.833, TZ);
  const { moments } = dayPlan("14:00", l, BLOCKS, { start: 5, length: 40 });
  const t = dayText("Hello", { date: "Saturday 19 June 2027", place: "Bibury", venue: "Wrenmoor Hall", ceremony: "14:00", moments });
  assert.match(t, /Where: Wrenmoor Hall, Bibury\nCeremony: 14:00\n\n11:45–13:45 Getting ready/);
  assert.match(t, /20:40–21:20 Portraits in golden hour/);
  const ics = dayIcs({ date: "2027-06-19", tz: TZ, place: "Wrenmoor Hall", studio: "Larchmere", stamp: "20261104T090000Z", moments });
  assert.match(ics, /UID:ceremony-2027-06-19@larchmere\r\nDTSTAMP:20261104T090000Z\r\nDTSTART:20270619T130000Z\r\nDTEND:20270619T133000Z/);
  assert.equal((ics.match(/BEGIN:VEVENT/g) ?? []).length, moments.length);
});

test("the ceremony stays between 09:00 and 18:00, and a day that runs past midnight goes on to the next day", () => {
  assert.deepEqual(["20:00", "06:30", "13:15", "nonsense"].map(clampCeremony), ["18:00", "09:00", "13:15", "18:00"]);
  const l = dayLight("2026-12-19", 51.758, -1.833, TZ);
  const long = { ...BLOCKS, meal: 180 };
  const p = dayPlan("20:00", l, long, { start: 5, length: 40 });
  const m = (/** @type {string} */ id) => p.moments.find((x) => x.id === id);
  assert.equal(m("ceremony")?.time, "18:00–18:30", "a 20:00 ceremony is kept at 18:00");
  assert.equal(m("speeches")?.time, "23:00–23:30");
  assert.equal(m("dance")?.time, "00:15–00:30, after midnight");
  assert.equal(m("end")?.time, "01:00, after midnight");
  assert.ok(!p.moments.some((x) => x.from === "23:59"), "nothing sticks at 23:59");
  const key = p.moments.map((x) => (x.next ? 1440 : 0) + minutesOf(x.from));
  assert.deepEqual(key, [...key].sort((a, z) => a - z), "after midnight comes last");
  const t = dayText("Hello", { date: "Saturday 19 December 2026", place: "Bibury", ceremony: "18:00", moments: p.moments });
  assert.match(t, /00:15–00:30, after midnight First dance/);
  const ics = dayIcs({ date: "2026-12-19", tz: TZ, place: "Wrenmoor Hall", studio: "Larchmere", stamp: "20261104T090000Z", moments: p.moments });
  assert.match(ics, /UID:dance-2026-12-19@larchmere\r\nDTSTAMP:20261104T090000Z\r\nDTSTART:20261220T001500Z\r\nDTEND:20261220T003000Z/);
  const early = dayPlan("09:00", l, { ...BLOCKS, prep: 300 }, { start: 5, length: 40 }).moments.find((x) => x.id === "prep");
  assert.equal(early?.from, "03:45", "getting ready starts before dawn, never wraps to the evening");
});

test("site.json checks: no simulated data or test payments on a client site, no made-up places", () => {
  assert.match(errorsFor((s) => { s.dateCheck.source = "simulated"; }, client), /dateCheck\.source: simulated data is for demos only/);
  assert.match(errorsFor((s) => { s.builder.depositLink = "https://buy.stripe.com/test_x"; }, client), /test-mode link/);
  assert.match(errorsFor((s) => { s.builder.depositLink = "https://buy.stripe.com/live_x"; }), /demo sites must use a Stripe test-mode link/);
  assert.match(errorsFor((s) => { s.places.items[0].lat = 80; }), /places\.items\[0\]\.lat/);
  assert.match(errorsFor((s) => { s.places.items[4].tz = "Mars/Olympus"; }), /IANA time zone/);
  assert.match(errorsFor((s) => { s.lightPlanner.place = "nowhere"; }), /lightPlanner\.place/);
  assert.match(errorsFor((s) => { s.chapters.items[1].at = 0; }), /chapters\.items\[1\]\.at/);
  assert.match(errorsFor((s) => { s.packages.items[0].price = "2,400"; }), /whole pounds/);
  assert.match(errorsFor((s) => { s.hero.film.wide.src = "img/reel.mov"; }), /\.mp4/);
  assert.match(errorsFor((s) => { s.films.items[0].venue = "elsewhere"; }), /one of the venues ids/);
  assert.match(errorsFor((s) => { s.venues.sources = []; }), /drone rules need their sources/);
  assert.match(errorsFor((s) => { s.musicPage.sources[0].checked = "Nov 2026"; }), /musicPage\.sources\[0\]\.checked/);
  assert.match(errorsFor((s) => { s.musicPage.sections[0].sources = [9]; }), /numbers of the sources/);
  assert.match(errorsFor((s) => { s.dayPlanner.blocks.meal = "two hours"; }), /dayPlanner\.blocks\.meal/);
  assert.match(errorsFor((s) => { s.dayPlanner.ceremony = "2pm"; }), /dayPlanner\.ceremony/);
  assert.match(errorsFor((s) => { s.progress.example = "X"; s.mode = "client"; }), /progress\.example: an example code is for demos only/);
  assert.match(errorsFor((s) => { s.delivery.steps[0].weeksAfter = -1; }), /weeksAfter/);
});
