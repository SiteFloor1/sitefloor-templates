import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  datesFromCsv, dayAnswer, nextOpenSaturday, clockWords, morningPlan, morningFor, quoteTotal, districtOf, travelFor,
  trialWindow, prepDates, calendar, lookText, travelText, numberWord,
} from "../../src/kits/bridalbeauty/lib/bridalbeauty.js";
import { HOME_PARTS, homeOrderProblem, onPagesProblem } from "../../src/kits/bridalbeauty/home.js";
import { pageData } from "../../src/kits/bridalbeauty/kit.js";
import { validateSite } from "../../src/core/lib/config.js";
import { loadCatalog } from "../../scripts/lib/catalog.js";

const demo = JSON.parse(readFileSync("sites/demos/bridalbeauty/site.json", "utf8"));
const client = JSON.parse(readFileSync("tests/fixtures/sites/test-bridalbeauty-client/site.json", "utf8"));
const look = JSON.parse(readFileSync("src/looks/cover/look.json", "utf8"));
const catalog = loadCatalog(process.cwd());
const errorsFor = (/** @type {(s: any) => void} */ change, base = demo) => { const s = structuredClone(base); change(s); return validateSite(s, { catalog }).join("\n"); };
const NOW = Date.parse("2026-11-09T10:00:00Z");
const TZ = "Europe/London";
const at = (/** @type {string} */ hm) => { const [h, m] = hm.split(":").map(Number); return h * 60 + m; };

test("the demo and the client fixture are valid", () => {
  assert.deepEqual(validateSite(demo, { catalog }), []);
  assert.deepEqual(validateSite(client, { catalog }), []);
});

test("the look's home order and pages name every section once and only what a page can hold", () => {
  assert.equal(homeOrderProblem(look.homeOrder), null);
  assert.equal(onPagesProblem(look.onPages), null);
  assert.match(homeOrderProblem(Object.keys(HOME_PARTS).slice(1)) ?? "", /leaves out/);
});

test("the diary reads the artist's sheet and fails closed on anything it can't trust", () => {
  const ok = datesFromCsv("date,status,updated_at\n2027-06-12,taken,2026-11-02 09:12\n2027-06-19,held,\n2027-06-26,open,", NOW, 21, TZ);
  assert.equal(ok.ok, true);
  assert.deepEqual(ok.ok && ok.days, { "2027-06-12": "taken", "2027-06-19": "held" });
  assert.equal(datesFromCsv("date,status\n2027-06-12,taken", NOW, 21, TZ).ok, false, "no updated_at column");
  assert.equal(datesFromCsv("date,status,updated_at\n2027-06-12,maybe,2026-11-02 09:12", NOW, 21, TZ).ok, false, "unknown word");
  assert.equal(datesFromCsv("date,status,updated_at\n12/06/2027,taken,2026-11-02 09:12", NOW, 21, TZ).ok, false, "bad date");
  assert.equal(datesFromCsv("date,status,updated_at\n2027-06-12,taken,2026-09-01 09:00", NOW, 21, TZ).ok, false, "stale");
  assert.equal(datesFromCsv("date,status,updated_at\n2027-06-12,taken,", NOW, 21, TZ).ok, false, "never updated");
});

test("the cover's answer never says booked, and says ask when the diary can't be read", () => {
  const r = /** @type {any} */ ({ ok: true, days: { "2027-06-12": "taken", "2027-06-19": "held" }, updatedAt: NOW });
  assert.equal(dayAnswer("2027-06-05", "2026-11-09", r).state, "open");
  assert.equal(dayAnswer("2027-06-12", "2026-11-09", r).state, "taken");
  assert.equal(dayAnswer("2027-06-19", "2026-11-09", r).state, "held");
  assert.equal(dayAnswer("2026-11-01", "2026-11-09", r).state, "past");
  assert.equal(dayAnswer("2027-06-05", "2026-11-09", { ok: false }).state, "unknown");
  for (const d of ["2027-06-05", "2027-06-12", "2027-06-19"]) assert.doesNotMatch(dayAnswer(d, "2026-11-09", r).words, /booked/i);
  const sat = nextOpenSaturday("2026-11-09", r);
  assert.ok(sat && new Date(sat + "T12:00:00Z").getUTCDay() === 6 && sat > "2026-11-09");
});

test("the morning works back from the ceremony: everyone else first, the bride last, time spare", () => {
  const p = morningPlan({ ceremony: at("14:00"), bride: 120, guests: [{ label: "Bridesmaids", minutes: 70 }, { label: "Mothers", minutes: 70 }], travel: 20, dress: 30, buffer: 15, artists: 1 });
  assert.equal(p.leave, at("13:40"));
  assert.equal(p.dressAt, at("13:10"));
  assert.equal(p.ready, at("12:55"));
  assert.equal(p.start, at("08:35"));
  const bride = p.rows.at(-1);
  assert.ok(bride?.bride && bride.start === at("10:55") && bride.end === p.ready);
  for (let i = 1; i < p.rows.length; i++) assert.equal(p.rows[i].start, p.rows[i - 1].end, "one chair, no gaps or overlaps");
});

test("two chairs share the party and both finish when the bride sits down", () => {
  const guests = Array.from({ length: 6 }, () => ({ label: "Bridesmaids", minutes: 70 }));
  const p = morningPlan({ ceremony: at("12:00"), bride: 120, guests, travel: 20, dress: 30, buffer: 15, artists: 2 });
  const brideStart = at("08:55");
  for (const lane of [0, 1]) {
    const rows = p.rows.filter((r) => !r.bride && r.lane === lane);
    assert.equal(Math.max(...rows.map((r) => r.end)), brideStart);
  }
  assert.equal(p.start, brideStart - 3 * 70);
});

test("the demo's morning starts at 7:25am, and a second artist joins only when one would start too early", () => {
  const d = pageData(demo);
  const m = morningFor(d, { service: "hair-makeup", ceremony: at("14:00"), counts: { maid: 2, mother: 1 } });
  assert.equal(clockWords(m.plan.start), "7:25am");
  assert.equal(m.artists, 1);
  assert.equal(m.early, false);
  const two = morningFor(d, { service: "hair-makeup", ceremony: at("14:00"), counts: { maid: 4, mother: 2 } });
  assert.equal(two.artists, 2);
  assert.equal(two.secondFee, 150);
  assert.equal(two.tooEarly, false);
  assert.ok(two.plan.start >= at("06:00"));
  assert.equal(quoteTotal({ bride: 520, lines: [{ price: 95, count: 6 }], early: two.earlyFee, second: two.secondFee }), 520 + 570 + two.earlyFee + 150);
  // Eight before an 11am ceremony can't fit even in two chairs: no start time is shown.
  assert.equal(morningFor(d, { service: "hair-makeup", ceremony: at("11:00"), counts: { maid: 6, mother: 2 } }).tooEarly, true);
  assert.equal(m.tooEarly, false);
});

test("travel goes by postcode district, with wildcards that never catch a longer area", () => {
  assert.equal(districtOf("sw4 0ab"), "SW4");
  assert.equal(districtOf("SW1A1AA"), "SW1A");
  assert.equal(districtOf("hello"), "");
  const cfg = demo.travel;
  assert.deepEqual(travelFor("SW4 7RL", cfg), { state: "free", district: "SW4", fee: 0 });
  assert.equal(travelFor("SW19 1AA", cfg).fee, 35);
  assert.equal(travelFor("GU1 1AA", cfg).fee, 60);
  assert.equal(travelFor("EC1A 1BB", cfg).fee, 35);
  assert.equal(travelFor("SE1 7PB", cfg).fee, 35);
  assert.equal(travelFor("S1 2HE", cfg).state, "ask", "Sheffield is not SE or SW");
  assert.equal(travelFor("", cfg).state, "bad");
  assert.match(travelText("Hello,", "SW19"), /SW19/);
});

test("the trial window and the skin countdown come from the wedding date", () => {
  assert.deepEqual(trialWindow("2027-08-14", { earliestWeeks: 24, latestWeeks: 4 }, "2026-11-09"), { from: "2027-02-27", to: "2027-07-17", late: false });
  assert.equal(trialWindow("2026-11-28", { earliestWeeks: 24, latestWeeks: 4 }, "2026-11-09").late, true);
  const steps = prepDates("2027-08-14", demo.skin.steps, "2026-11-09");
  assert.equal(steps[0].id, "routine");
  assert.equal(steps[0].date, "2027-05-22");
  assert.equal(steps.at(-1)?.date, "2027-08-14");
  assert.match(demo.skin.note, /clinician/);
});

test("calendar files carry all-day dates and floating local times", () => {
  const ics = calendar({ artist: "Isolde", place: "Clapham", stamp: "20261109T100000Z", events: [
    { id: "trial", date: "2027-06-01", title: "Trial, with Isolde" },
    { id: "chair", date: "2027-08-14", start: at("10:55"), end: at("12:55"), title: "In the chair" },
  ] });
  assert.match(ics, /DTSTART;VALUE=DATE:20270601\r\nDTEND;VALUE=DATE:20270602/);
  assert.match(ics, /DTSTART:20270814T105500\r\nDTEND:20270814T125500/);
  assert.doesNotMatch(ics, /T105500Z/);
  assert.match(ics, /SUMMARY:Trial\\, with Isolde/);
});

test("settings checks catch what would mislead a bride", () => {
  assert.match(errorsFor((s) => { s.dateCheck.source = "simulated"; }, client), /simulated/);
  assert.match(errorsFor((s) => { s.packages.bride[0].minutes = 62; }), /minutes/);
  assert.match(errorsFor((s) => { s.skin.note = "Ask a friend."; }), /clinician|doctor/);
  assert.match(errorsFor((s) => { s.hero.cutout = { src: "img/cover-cutout.png" }; }), /webp/i);
  assert.match(errorsFor((s) => { s.morning.ceremony.default = "20:00"; }), /ceremony/);
});

test("words: small numbers in words, times as a person says them, the look named in the message", () => {
  assert.equal(numberWord(3), "three");
  assert.equal(clockWords(at("14:00")), "2pm");
  assert.equal(clockWords(at("07:25")), "7:25am");
  assert.match(lookText("Hello Isolde,", "Satin, half up"), /"Satin, half up"/);
});
