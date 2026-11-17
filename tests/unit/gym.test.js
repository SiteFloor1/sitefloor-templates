import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { membershipTotal, priceWords, usualAt, compareWords, quietWords, hourWords, agoWords, countFromCsv, placesFromCsv, placesWords, weekOf, parseUkDate, ukNumeric, shortDate, numberWords, racePlan, planSessions, planIcs, busyDay } from "../../src/kits/gym/lib/gym.js";
import { HOME_PARTS, HOSTS, homeOrderProblem } from "../../src/kits/gym/home.js";
import { companyKey } from "../../src/kits/gym/features/gym-corporate/gym-corporate.js";
import { validateSite } from "../../src/core/lib/config.js";
import { loadCatalog } from "../../scripts/lib/catalog.js";

const demo = JSON.parse(readFileSync("sites/demos/gym/site.json", "utf8"));
const client = JSON.parse(readFileSync("tests/fixtures/sites/test-gym-client/site.json", "utf8"));
const look = JSON.parse(readFileSync("src/looks/afterdark/look.json", "utf8"));
const catalog = loadCatalog(process.cwd());
const errorsFor = (/** @type {(s: any) => void} */ change, base = demo) => { const s = structuredClone(base); change(s); return validateSite(s, { catalog }).join("\n"); };
const TZ = "Europe/London";
const at = (/** @type {string} */ s) => Date.parse(s);

test("the demo and the client fixture are valid", () => {
  assert.deepEqual(validateSite(demo, { catalog }), []);
  assert.deepEqual(validateSite(client, { catalog }), []);
});

test("prices: the headline is the lawful total, every mandatory fee in (DMCC Act, CMA209)", () => {
  const club = { monthly: 129, minimumMonths: 12, mandatoryFees: [{ name: "Joining fee", amount: 30 }] };
  assert.deepEqual(membershipTotal(club), { kind: "term", total: 1578, months: 12, monthly: 129, fees: club.mandatoryFees, feeTotal: 30 });
  assert.deepEqual(priceWords(club), { headline: "£1,578 for 12 months, joining fee included", then: "", fine: "£129 a month for 12 months · joining fee £30" });
  const flex = { monthly: 149, minimumMonths: 0, mandatoryFees: [{ name: "Joining fee", amount: 30 }, { name: "Admin fee", amount: 10 }] };
  assert.deepEqual(priceWords(flex), { headline: "£189 the first month, joining and admin fees included", then: "then £149 a month", fine: "£149 a month, no minimum term · joining fee £30 · admin fee £10" });
  assert.equal(priceWords({ monthly: 89, minimumMonths: 12, mandatoryFees: [] }).headline, "£1,068 for 12 months");
  assert.match(priceWords({ monthly: 89, minimumMonths: 12, mandatoryFees: [] }).fine, /no joining fee$/);
  // The headline never shows the monthly price alone with the fee beside it ("£129 + £30").
  for (const p of [club, flex]) assert.doesNotMatch(priceWords(p).headline, /\+/);
});

test("prices: a membership without its mandatory fees, or with a price typed as text, is refused", () => {
  assert.match(errorsFor((s) => { delete s.clubMemberships.tiers[0].mandatoryFees; }), /mandatoryFees: list every fee a member must pay to join/);
  assert.match(errorsFor((s) => { s.clubMemberships.tiers[0].price = "£129 + joining fee"; }), /tiers\[0\]\.price: unknown setting/);
  assert.match(errorsFor((s) => { s.clubMemberships.tiers[0].mandatoryFees = [{ name: "Joining fee", amount: 0 }]; }), /whole pounds/);
  assert.match(errorsFor((s) => { delete s.corporate.rates[0].mandatoryFees; }), /corporate\.rates\[0\]\.mandatoryFees/);
  assert.match(errorsFor((s) => { s.corporate.rates[0].tier = "gold"; }), /an id in clubMemberships\.tiers/);
  assert.equal(errorsFor((s) => { s.clubMemberships.tiers[0].mandatoryFees = []; }), "");
});

test("the count: usual figures in words", () => {
  const busy = demo.busy;
  assert.equal(usualAt(busy, 1, 18), 128); // Monday 6pm
  assert.equal(usualAt(busy, 1, 3), null); // closed
  assert.equal(compareWords(31, 128, "Monday"), "Quieter than a usual Monday.");
  assert.equal(compareWords(160, 128, "Monday"), "Busier than a usual Monday.");
  assert.equal(compareWords(130, 128, "Monday"), "About as busy as a usual Monday.");
  assert.equal(compareWords(30, null, "Monday"), "");
  assert.equal(quietWords(busy, 1, 18), "Usually quiet from 10pm.");
  assert.deepEqual([0, 5, 12, 20].map(hourWords), ["midnight", "5am", "noon", "8pm"]);
  assert.equal(agoWords(0), "counted just now");
  assert.equal(agoWords(1), "counted a minute ago");
  assert.equal(agoWords(4), "counted 4 minutes ago");
});

test("the live count: only fresh, whole and possible", () => {
  const now = at("2026-11-16T18:42:00Z");
  assert.deepEqual(countFromCsv("updated_at,count\n2026-11-16 18:30,40\n2026-11-16 18:40,31", now, TZ, 15, 180), { ok: true, count: 31, at: at("2026-11-16T18:40:00Z") });
  assert.deepEqual(countFromCsv("updated_at,count\n2026-11-16 18:20,31", now, TZ, 15, 180), { ok: false }); // 22 minutes old
  assert.deepEqual(countFromCsv("updated_at,count\n2026-11-16 18:40,300", now, TZ, 15, 180), { ok: false }); // above capacity
  assert.deepEqual(countFromCsv("updated_at,count\n2026-11-16 18:40,3.5", now, TZ, 15, 180), { ok: false });
  assert.deepEqual(countFromCsv("updated_at,count\n2026-11-16 19:40,31", now, TZ, 15, 180), { ok: false }); // future
  assert.deepEqual(countFromCsv("updated_at,count,who\n2026-11-16 18:40,31,Sam", now, TZ, 15, 180), { ok: false }); // personal data
  assert.deepEqual(countFromCsv("<html>", now, TZ, 15, 180), { ok: false });
  // The newest row wins: an older typo doesn't turn the count off; a newest impossible one does.
  assert.deepEqual(countFromCsv("updated_at,count\n2026-11-16 18:10,lots\n2026-11-16 18:40,31", now, TZ, 15, 180), { ok: true, count: 31, at: at("2026-11-16T18:40:00Z") });
  assert.deepEqual(countFromCsv("updated_at,count\n2026-11-16 18:35,31\n2026-11-16 18:40,lots", now, TZ, 15, 180), { ok: false });
});

test("places left: fresh rows for sessions still to come, within the class size", () => {
  const now = at("2026-11-16T17:00:00Z");
  const sizes = { "hyrox-engine": 16, "sauna-plunge": 8 };
  const csv = ["date,time,class,left,updated_at",
    "2026-11-16,18:30,hyrox-engine,4,2026-11-16 16:55",
    "2026-11-16,16:30,hyrox-engine,2,2026-11-16 16:55", // started
    "2026-11-16,19:30,sauna-plunge,9,2026-11-16 16:55", // above size
    "2026-11-16,20:30,sauna-plunge,3,2026-11-16 16:30", // stale
    "2026-11-17,07:00,sauna-plunge,0,2026-11-16 16:58",
    "2026-11-17,07:00,yoga,5,2026-11-16 16:58"].join("\n"); // unknown id
  assert.deepEqual(placesFromCsv(csv, now, TZ, 15, sizes), { ok: true, left: { "2026-11-16 18:30 hyrox-engine": 4, "2026-11-17 07:00 sauna-plunge": 0 } });
  // The newest row for a session wins: a later "full" or impossible count hides the older "4 left" (GY-02).
  const head = "date,time,class,left,updated_at\n";
  assert.deepEqual(placesFromCsv(`${head}2026-11-16,18:30,hyrox-engine,4,2026-11-16 16:50\n2026-11-16,18:30,hyrox-engine,full,2026-11-16 16:58`, now, TZ, 15, sizes), { ok: true, left: {} });
  assert.deepEqual(placesFromCsv(`${head}2026-11-16,18:30,hyrox-engine,4,2026-11-16 16:50\n2026-11-16,18:30,hyrox-engine,30,2026-11-16 16:58`, now, TZ, 15, sizes), { ok: true, left: {} });
  assert.deepEqual(placesFromCsv(`${head}2026-11-16,18:30,hyrox-engine,full,2026-11-16 16:50\n2026-11-16,18:30,hyrox-engine,2,2026-11-16 16:58`, now, TZ, 15, sizes), { ok: true, left: { "2026-11-16 18:30 hyrox-engine": 2 } });
  assert.deepEqual(placesFromCsv(`${head}2026-11-16,18:30,hyrox-engine,2,2026-11-16 16:58\n2026-11-16,18:30,hyrox-engine,5,2026-11-16 16:50`, now, TZ, 15, sizes), { ok: true, left: { "2026-11-16 18:30 hyrox-engine": 2 } }); // order in the sheet doesn't matter
  assert.deepEqual(placesFromCsv("date,time,class,left,updated_at,name\n2026-11-16,18:30,hyrox-engine,4,2026-11-16 16:55,Sam", now, TZ, 15, sizes), { ok: false });
  assert.equal(placesWords(0), "Full");
  assert.equal(placesWords(1), "1 place left");
  assert.equal(placesWords(4), "4 places left");
});

test("this week's sessions skip closed days", () => {
  const week = weekOf(demo.timetable.weekly, { ...demo.hours, exceptions: [{ date: "2026-11-17", ranges: [] }] }, "2026-11-16", 3);
  assert.deepEqual(week.map((d) => [d.date, d.sessions.length]), [["2026-11-16", 6], ["2026-11-17", 0], ["2026-11-18", 5]]);
  assert.equal(week[0].sessions[0].time, "06:30");
});

test("UK dates: typed dd/mm/yyyy, never the browser's own format", () => {
  assert.equal(parseUkDate("14/03/2027"), "2027-03-14");
  assert.equal(parseUkDate("4/3/2027"), "2027-03-04");
  assert.equal(parseUkDate("14.03.2027"), "2027-03-14");
  assert.equal(parseUkDate("03/14/2027"), ""); // no 14th month: US order is never guessed
  assert.equal(parseUkDate("31/02/2027"), "");
  assert.equal(parseUkDate("2027-03-14"), "");
  assert.equal(ukNumeric("2027-03-14"), "14/03/2027");
  assert.equal(shortDate("2027-03-14"), "14 Mar");
  assert.equal(numberWords(16), "Sixteen");
  assert.equal(numberWords(25), "25");
});

test("the race plan: whole weeks from the coming Monday, shared over the club's phases, the taper last", () => {
  const cfg = demo.hyrox;
  const plan = racePlan("2026-11-16", "2027-03-13", cfg); // Monday to a Saturday, 16 weeks and 5 days
  assert.equal(plan.ok, true);
  if (!plan.ok) return;
  assert.equal(plan.start, "2026-11-16");
  assert.equal(plan.weeks, 16);
  assert.deepEqual(plan.phases.map((p) => [p.name, p.weeks, p.from, p.to]), [
    ["Base", 5, "2026-11-16", "2026-12-20"], ["Build", 6, "2026-12-21", "2027-01-31"], ["Race-specific", 4, "2027-02-01", "2027-02-28"], ["Taper", 1, "2027-03-01", "2027-03-12"]]);
  assert.equal(plan.phases.slice(0, -1).reduce((s, p) => s + p.weeks, 0) + cfg.taper.weeks, 16);
  assert.equal(racePlan("2026-11-18", "2027-03-13", cfg).ok && /** @type {any} */ (racePlan("2026-11-18", "2027-03-13", cfg)).start, "2026-11-23"); // a Wednesday starts the next Monday
  assert.deepEqual(racePlan("2026-11-16", "2026-11-10", cfg), { ok: false, reason: "past", weeks: 0 });
  assert.equal(/** @type {any} */ (racePlan("2026-11-16", "2026-12-12", cfg)).reason, "short");
  assert.equal(/** @type {any} */ (racePlan("2026-11-16", "2027-11-13", cfg)).reason, "long");
});

test("the plan's sessions: each phase's classes once a week, from the timetable, at the club's times", () => {
  const plan = /** @type {any} */ (racePlan("2026-11-16", "2027-03-13", demo.hyrox));
  const sessions = planSessions(plan.phases, demo.timetable.weekly, demo.hours);
  const first = sessions.filter((s) => s.date <= "2026-11-22");
  assert.deepEqual(first.map((s) => [s.date, s.time, s.class]), [["2026-11-16", "19:00", "barbell"], ["2026-11-17", "18:00", "engine"], ["2026-11-17", "19:30", "mobility"]]);
  assert.equal(sessions.length, 15 * 3 + 4); // three a week before the taper; the taper's twelve days take its two classes twice
  // On the plan's first day, sessions already started are left out (GY-03).
  const later = planSessions(plan.phases, demo.timetable.weekly, demo.hours, { date: "2026-11-16", minutes: 19 * 60 + 30 });
  assert.equal(later.filter((s) => s.date <= "2026-11-22")[0].date, "2026-11-17");
  assert.ok(sessions.every((s) => s.date < "2027-03-13"));
  const ics = planIcs({ sessions: sessions.slice(0, 1), names: { barbell: { name: "Barbell club", minutes: 60 } }, race: "2027-03-13", club: "Halde", place: "Halde, Manchester", tz: TZ, stamp: "20261116T120000Z" });
  assert.match(ics, /DTSTART:20261116T190000Z\r\nDTEND:20261116T200000Z/); // GMT in November
  assert.match(ics, /SUMMARY:Barbell club · Halde/);
  assert.match(ics, /DTSTART;VALUE=DATE:20270313/);
  assert.ok(ics.endsWith("END:VCALENDAR\r\n"));
});

test("a day's usual busyness in words", () => {
  const b = busyDay(demo.busy, "mon");
  assert.equal(b.hours[0].h, 5);
  assert.equal(b.hours.length, 18);
  assert.equal(Math.max(...b.hours.map((x) => x.pct)), 100);
  assert.equal(b.words, "Usually busiest 5pm to 8pm; quietest 9am to 1pm.");
  assert.equal(busyDay({ capacity: 10, usual: { mon: Array(24).fill(null) } }, "mon").words, "Closed.");
});

test("corporate: companies match whatever the case, spacing or Ltd", () => {
  assert.equal(companyKey("Northmill Digital Ltd"), companyKey("northmill  digital"));
  assert.equal(companyKey("Smith & Sons PLC"), "smithandsons");
});

test("the count and places: simulated only on a demo, never older than 15 minutes", () => {
  assert.match(errorsFor((s) => { s.mode = "client"; s.indexable = true; }), /busy\.live\.source: simulated figures are for demos only/);
  assert.match(errorsFor((s) => { s.spaces.staleAfterMinutes = 30; }), /spaces\.staleAfterMinutes: 1 to 15/);
  assert.match(errorsFor((s) => { s.busy.usual.mon = [1, 2]; }), /busy\.usual\.mon: 24 values/);
  assert.match(errorsFor((s) => { s.busy.usual.mon[18] = 999; }), /busy\.usual\.mon\[18\]/);
  assert.match(errorsFor((s) => { s.spaces = { source: "sheet", csvUrl: "https://example.com/x.csv" }; }), /Google Sheet published as CSV/);
});

test("booking goes to the club's own app; promises are refused", () => {
  assert.match(errorsFor((s) => { s.booking = { provider: "whatsapp" }; }), /the club's booking app/);
  assert.match(errorsFor((s) => { s.timetable.weekly.mon[0].class = "zumba"; }), /one of the class ids/);
  assert.match(errorsFor((s) => { s.hyrox.intro = "Guaranteed to take minutes off your time."; }), /no promises of results/);
  assert.match(errorsFor((s) => { s.hyrox.phases[0].classes = ["yoga"]; }), /the club's own classes for this phase/);
  // A week for every phase and the taper, so no phase can run backwards (GY-03).
  assert.match(errorsFor((s) => { s.hyrox.minWeeks = 4; s.hyrox.taper.weeks = 3; }), /hyrox\.minWeeks: the shortest plan the club writes: at least 6 weeks/);
  assert.equal(errorsFor((s) => { s.hyrox.minWeeks = 4; }), "");
});

test("home sections: every section once, hosts are real page features, the look's order is complete", () => {
  assert.equal(homeOrderProblem(look.homeOrder), null);
  assert.match(String(homeOrderProblem(["gym-hyrox"])), /leaves out/);
  for (const id of Object.keys(HOSTS)) assert.ok(id in HOME_PARTS, id);
});
