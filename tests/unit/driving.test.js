import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { blockSaving, districtOf, coverAnswer, passPlan, costToPass, roundTen, feesFresh, slotsFromCsv, progressFromCsv, span, clock, nextWeekdays, LEVELS, DVSA_HOURS } from "../../src/kits/driving/lib/driving.js";
import { READY, TEST_DAY, LINKS, FEES_SOURCE } from "../../src/kits/driving/lib/govuk.js";
import { HOME_PARTS, homeOrderProblem } from "../../src/kits/driving/home.js";
import { validateSite } from "../../src/core/lib/config.js";
import { loadCatalog } from "../../scripts/lib/catalog.js";

const demo = JSON.parse(readFileSync("sites/demos/driving/site.json", "utf8"));
const client = JSON.parse(readFileSync("tests/fixtures/sites/test-driving-client/site.json", "utf8"));
const look = JSON.parse(readFileSync("src/looks/verge/look.json", "utf8"));
const catalog = loadCatalog(process.cwd());
const errorsFor = (/** @type {(s: any) => void} */ change, base = demo) => { const s = structuredClone(base); change(s); return validateSite(s, { catalog }).join("\n"); };
const TZ = "Europe/London";
const at = (/** @type {string} */ s) => Date.parse(s);

test("the demo and the client fixture are valid", () => {
  assert.deepEqual(validateSite(demo, { catalog }), []);
  assert.deepEqual(validateSite(client, { catalog }), []);
  assert.equal(homeOrderProblem(look.homeOrder), null);
  assert.deepEqual([...look.homeOrder].sort(), Object.keys(HOME_PARTS).sort());
});

test("a block's saving and hourly rate, never negative", () => {
  assert.deepEqual(blockSaving(38, 10, 360), { perHour: 36, saving: 20 });
  assert.deepEqual(blockSaving(38, 30, 1110), { perHour: 37, saving: 30 });
  assert.equal(blockSaving(38, 10, 400).saving, 0);
});

test("do you cover me? reads a district from any postcode form", () => {
  assert.equal(districtOf("e14 9ge"), "E14");
  assert.equal(districtOf("E1W 2AA"), "E1W");
  assert.equal(districtOf("SE10"), "SE10");
  assert.equal(districtOf("hello"), null);
  const d = [{ district: "E14", name: "Poplar" }];
  assert.deepEqual(coverAnswer("E14 9GE", d), { state: "yes", district: "E14", name: "Poplar" });
  assert.deepEqual(coverAnswer("N1 9GU", d), { state: "no", district: "N1" });
  assert.deepEqual(coverAnswer("??", d), { state: "bad" });
});

test("when could I pass? counts the DVSA's 45 hours less the hours so far", () => {
  assert.equal(DVSA_HOURS, 45);
  assert.deepEqual(passPlan({ perWeek: 4, soFar: 0, today: "2026-11-17" }), { left: 45, weeks: 12, ready: "2027-02-09" });
  assert.deepEqual(passPlan({ perWeek: 4, soFar: 40, today: "2026-11-17" }), { left: 5, weeks: 2, ready: "2026-12-01" });
  assert.deepEqual(passPlan({ perWeek: 4, soFar: 50, today: "2026-11-17" }), { left: 0, weeks: 0, ready: null });
});

test("the cost to pass: hours at the booked rate, the tests, rounded to £10", () => {
  const fees = { practical: 62, theory: 23 };
  assert.equal(roundTen(1704), 1700);
  assert.deepEqual(costToPass({ left: 45, rate: 36, fees, theoryPassed: false }), { total: 1710, lessons: 1620, practical: 62, theory: 23 });
  assert.equal(costToPass({ left: 45, rate: 36, fees, theoryPassed: true }).total, 1680);
  // stale fees leave the tests out rather than show an old figure
  assert.deepEqual(costToPass({ left: 10, rate: 36, fees: null, theoryPassed: false }), { total: 360, lessons: 360, practical: 0, theory: 0 });
});

test("gov.uk fees show only while they were checked in the last six months", () => {
  assert.equal(feesFresh("2026-11-16", "2026-11-17"), true);
  assert.equal(feesFresh("2026-11-16", "2027-05-17"), true);
  assert.equal(feesFresh("2026-11-16", "2027-05-19"), false);
  assert.equal(feesFresh("2026-11-18", "2026-11-17"), false);
  assert.equal(feesFresh("16/11/2026", "2026-11-17"), false);
});

test("times read as a learner says them", () => {
  assert.equal(clock("16:00"), "4pm");
  assert.equal(clock("09:30"), "9:30am");
  assert.equal(clock("12:00"), "12pm");
  assert.equal(span("16:00", 2), "4–6pm");
  assert.equal(span("11:00", 2), "11am–1pm");
  assert.equal(span("07:00", 1.5), "7–8:30am");
  assert.deepEqual(nextWeekdays("2026-11-17", [4, 6, 1]), ["2026-11-19", "2026-11-21", "2026-11-23"]); // a Tuesday
});

test("next free lessons: future rows only, sorted; stale, private or broken sheets fail closed", () => {
  const now = at("2026-11-17T10:00:00Z");
  const csv = "date,time,hours,gearbox,updated_at\n2026-11-21,09:00,2,automatic,2026-11-17 08:10\n2026-11-19,16:00,2,manual,\n2026-11-17,08:00,2,manual,\n2026-11-20,25:00,2,manual,\n";
  const r = slotsFromCsv(csv, now, TZ, 48);
  assert.ok(r.ok);
  assert.deepEqual(r.slots.map((s) => s.date), ["2026-11-19", "2026-11-21"]);
  assert.equal(slotsFromCsv(csv, at("2026-11-20T10:00:00Z"), TZ, 48).ok, false, "two days old");
  assert.equal(slotsFromCsv(csv.replace("manual,\n2026-11-17", "manual,,Jo Bloggs\n2026-11-17"), now, TZ, 48).ok, false, "a name outside the columns");
  assert.equal(slotsFromCsv("date,time\n2026-11-19,16:00", now, TZ, 48).ok, false, "missing columns");
  assert.equal(slotsFromCsv("", now, TZ, 48).ok, false);
});

test("the progress card: by code, levels 1 to 5, never a name; unknown codes and stale sheets say so", () => {
  const skills = ["Mirrors", "Roundabouts", "Parallel parking"];
  const csv = `code,lessons,last_lesson,covered,practise,Mirrors,Roundabouts,Parallel parking,updated_at\nAB12CD34,18,2026-11-15,Roundabouts,Mirror checks,5,3,,2026-11-15 19:40\n`;
  const now = at("2026-11-17T10:00:00Z");
  const r = progressFromCsv(csv, "ab12 cd34", now, TZ, 336, skills);
  assert.ok(r.ok);
  assert.deepEqual(r.learner.skills, [{ skill: "Mirrors", level: 5 }, { skill: "Roundabouts", level: 3 }, { skill: "Parallel parking", level: 0 }]);
  assert.equal(r.learner.lessons, 18);
  assert.equal(r.learner.last, "2026-11-15");
  assert.deepEqual(progressFromCsv(csv, "x", now, TZ, 336, skills), { ok: false, reason: "code" });
  assert.deepEqual(progressFromCsv(csv, "ZZ99ZZ99", now, TZ, 336, skills), { ok: false, reason: "unknown" });
  assert.deepEqual(progressFromCsv(csv, "AB12CD34", at("2026-12-10T10:00:00Z"), TZ, 336, skills), { ok: false, reason: "sheet" });
  assert.deepEqual(progressFromCsv(csv, "AB12CD34", now, TZ, 336, ["Mirrors", "Bay parking"]), { ok: false, reason: "sheet" });
  assert.equal(LEVELS.length, 5);
});

test("gov.uk wording is linked to gov.uk", () => {
  assert.equal(READY.points.length, 5);
  assert.equal(TEST_DAY.steps.length, 5);
  for (const u of [READY.source, TEST_DAY.source, FEES_SOURCE, ...Object.values(LINKS).map((l) => l.url)]) assert.match(u, /^https:\/\/www\.gov\.uk\//);
});

test("no pass-rate claims, guarantees or promises in the instructor's copy", () => {
  assert.match(errorsFor((s) => { s.hero.intro = "Pass first time guaranteed."; }), /hero\.intro.*promise/);
  assert.match(errorsFor((s) => { s.areas.notCovered = "Our pass rate is the best in London."; }), /areas\.notCovered/);
  assert.match(errorsFor((s) => { s.journal.articles[0].body[0] = "92% of our pupils pass."; }), /journal\.articles\[0\]\.body\[0\]/);
  assert.match(errorsFor((s) => { s.business.description = "The fastest way to pass in East London."; }), /business\.description/);
  // the reviewer's own words aren't the instructor's claim
  assert.equal(errorsFor((s) => { s.reviews.items[0].text = "Passed first time, guaranteed I'd recommend."; }), "");
});

test("a pass rate only on a client site, in its own field, with its dates", () => {
  assert.match(errorsFor((s) => { s.instructors.passRate = { text: "61%", from: "2025-11-01", to: "2026-10-31" }; }), /never on a demo/);
  assert.match(errorsFor((s) => { s.instructors.passRate.to = "2025-10-01"; }, client), /instructors\.passRate/);
  assert.match(errorsFor((s) => { delete s.instructors.passRate.from; }, client), /instructors\.passRate/);
});

test("a DVSA badge number only as the client gives it, for an approved instructor", () => {
  assert.match(errorsFor((s) => { s.instructors.items[0].badge = "123456"; }), /never on a demo/);
  assert.match(errorsFor((s) => { s.instructors.items[1].badge = "654321"; }, client), /only for an approved driving instructor/);
  assert.match(errorsFor((s) => { s.instructors.items[0].badge = "AB12"; }, client), /digits only/);
  assert.match(errorsFor((s) => { s.instructors.items[0].status = "Fully qualified"; }), /"ADI".*"PDI"/);
});

test("test fees only as checked on gov.uk/driving-test-cost, with the date", () => {
  assert.match(errorsFor((s) => { s.fees.source = "https://example.com/fees"; }), /fees\.source/);
  assert.match(errorsFor((s) => { s.fees.checked = "November"; }), /fees\.checked/);
  assert.match(errorsFor((s) => { s.fees.practical = 61.5; }), /fees\.practical/);
});

test("prices: whole pounds; a block or course never dearer than single hours", () => {
  assert.match(errorsFor((s) => { s.lessons.manual.block.price = 400; }), /lessons\.manual\.block\.price.*dearer/);
  assert.match(errorsFor((s) => { s.lessons.automatic.hour = 41.5; }), /lessons\.automatic\.hour/);
  assert.match(errorsFor((s) => { delete s.lessons.manual; delete s.lessons.automatic; }), /manual, automatic or both/);
});

test("areas, live data and links are the client's own and real", () => {
  assert.match(errorsFor((s) => { s.areas.districts.push({ district: "E14", name: "Again" }); }), /listed twice/);
  assert.match(errorsFor((s) => { s.areas.districts[0].district = "e14"; }), /postcode district/);
  assert.match(errorsFor((s) => { s.slots.source = "simulated"; }, client), /simulated data is only allowed on demo sites/);
  assert.match(errorsFor((s) => { s.progress.csvUrl = "https://example.com/x.csv"; }, client), /progress\.csvUrl/);
  assert.match(errorsFor((s) => { s.progress.example = "AB12CD34"; }, client), /demo sites only/);
  assert.match(errorsFor((s) => { s.gearbox.links[0].url = "https://example.com"; }), /gov\.uk link/);
  assert.match(errorsFor((s) => { s.centres.sample = true; }, client), /centres\.sample/);
  assert.match(errorsFor((s) => { s.features.push("driving-passed"); s.passed = { title: "Passed", consent: "With agreement." }; s.gallery = demo.gallery; }), /driving-passed is for client sites/);
});
