import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { countWord, weekdayIndex, weekStart, hoursOf, diaryWeek, diaryFromCsv, firstMonth, sessionsIcs, utcStamp, weekPattern, sampleWeek, districtOf, coverageFor, timeline, blockRow } from "../../src/kits/trainer/lib/trainer.js";
import { HOME_PARTS, HOSTS, homeOrderProblem } from "../../src/kits/trainer/home.js";
import { validateSite } from "../../src/core/lib/config.js";
import { loadCatalog } from "../../scripts/lib/catalog.js";

const demo = JSON.parse(readFileSync("sites/demos/trainer/site.json", "utf8"));
const client = JSON.parse(readFileSync("tests/fixtures/sites/test-trainer-client/site.json", "utf8"));
const catalog = loadCatalog(process.cwd());
const errorsFor = (/** @type {(s: any) => void} */ change, base = demo) => { const s = structuredClone(base); change(s); return validateSite(s, { catalog }).join("\n"); };
const TZ = "Europe/London";
const WEEK = { days: ["mon", "tue", "wed", "thu", "fri", "sat"], from: "06:00", to: "20:00" };

test("the demo and the client fixture are valid", () => {
  assert.deepEqual(validateSite(demo, { catalog }), []);
  assert.deepEqual(validateSite(client, { catalog }), []);
});

test("words and weekdays", () => {
  assert.equal(countWord(5), "Five");
  assert.equal(countWord(0), "No");
  assert.equal(countWord(14), "14");
  assert.equal(weekdayIndex("2026-11-16"), 0); // Monday
  assert.equal(weekdayIndex("2026-11-22"), 6); // Sunday
  assert.deepEqual(hoursOf("06:00", "09:00"), ["06:00", "07:00", "08:00", "09:00"]);
});

test("the diary shows this week, or next week once the last working day has gone", () => {
  assert.equal(weekStart("2026-11-18", WEEK.days), "2026-11-16"); // Wednesday → this Monday
  assert.equal(weekStart("2026-11-21", WEEK.days), "2026-11-16"); // Saturday, still a working day
  assert.equal(weekStart("2026-11-22", WEEK.days), "2026-11-23"); // Sunday → next Monday
  assert.equal(weekStart("2026-11-20", ["mon", "tue", "wed", "thu"]), "2026-11-23"); // Friday after a Thursday finish
});

test("open hours that have passed are not offered; earlier days read as gone", () => {
  const open = [{ date: "2026-11-16", time: "06:00" }, { date: "2026-11-18", time: "07:00" }, { date: "2026-11-18", time: "18:00" }, { date: "2026-11-21", time: "08:00" }];
  const w = diaryWeek(WEEK, open, "2026-11-18", 10 * 60 + 30);
  assert.equal(w.monday, "2026-11-16");
  assert.equal(w.days.length, 6);
  assert.equal(w.hours.length, 15);
  assert.deepEqual(w.open, [{ date: "2026-11-18", time: "18:00" }, { date: "2026-11-21", time: "08:00" }]);
  assert.equal(w.days[0].gone, true);
  assert.equal(w.days[2].gone, false);
  assert.equal(w.days[2].cells.find((c) => c.time === "07:00")?.passed, true);
  assert.equal(w.days[2].cells.find((c) => c.time === "11:00")?.passed, false);
});

test("the sheet fails closed", () => {
  const now = Date.parse("2026-11-16T09:00:00Z");
  const good = "date,time,updated_at\n2026-11-18,07:00,2026-11-16 08:30\n2026-11-16,18:00,\n2026-11-18,07:00,\n2026-11-19,07:30,\nnot a date,08:00,";
  const r = diaryFromCsv(good, now, TZ, 36);
  assert.equal(r.ok, true);
  assert.deepEqual(r.ok && r.open, [{ date: "2026-11-16", time: "18:00" }, { date: "2026-11-18", time: "07:00" }]); // deduped, half hours and bad rows ignored
  assert.equal(diaryFromCsv(good, now + 40 * 3_600_000, TZ, 36).ok, false, "stale");
  assert.equal(diaryFromCsv("date,time,updated_at,name\n2026-11-18,07:00,2026-11-16 08:30,Sam", now, TZ, 36).ok, false, "a name in the sheet");
  assert.equal(diaryFromCsv("date,time\n2026-11-18,07:00", now, TZ, 36).ok, false, "no updated_at column");
  assert.equal(diaryFromCsv("date,time,updated_at\n2026-11-18,07:00,soon", now, TZ, 36).ok, false, "unreadable stamp");
  assert.equal(diaryFromCsv("", now, TZ, 36).ok, false);
});

test("the first month keeps the first session's weekday pattern and prices it from the trainer's own figures", () => {
  const prices = { first: 120, session: { 1: 115, 2: 110, 3: 105 }, travel: 20 };
  const twice = firstMonth({ date: "2026-11-16", time: "06:00" }, 2, prices, false); // a Monday: Mon and Thu
  assert.deepEqual(twice.dates, ["2026-11-19", "2026-11-23", "2026-11-26", "2026-11-30", "2026-12-03", "2026-12-07", "2026-12-10"]);
  assert.equal(twice.total, 120 + 110 * 7);
  assert.equal(twice.sessions, 8);
  const home3 = firstMonth({ date: "2026-11-18", time: "07:00" }, 3, prices, true); // a Wednesday: Wed, Fri, Sun→Mon
  assert.equal(home3.first.price, 140);
  assert.equal(home3.each, 125);
  assert.equal(home3.dates.length, 11);
  assert.equal(home3.total, 140 + 125 * 11);
  assert.ok(home3.dates.every((d) => weekdayIndex(d) !== 6), "never a Sunday");
  assert.equal(firstMonth({ date: "2026-11-16", time: "06:00" }, 1, { first: 90, session: { 1: 80 } }, true).each, 80, "no travel price, none added");
});

test("the calendar file carries every session in UTC, across the clocks going back", () => {
  assert.equal(utcStamp("2026-07-01", "07:00", TZ), "20260701T060000Z"); // BST
  assert.equal(utcStamp("2026-11-16", "07:00", TZ), "20261116T070000Z"); // GMT
  const ics = sessionsIcs({ sessions: [{ date: "2026-10-23", time: "07:00", title: "First session" }, { date: "2026-10-26", time: "07:00", title: "Session" }], minutes: 60, name: "Marrick", place: "Marrick, 9 Elystan Mews, London", tz: TZ, stamp: "20261015T090000Z" });
  assert.match(ics, /DTSTART:20261023T060000Z/);
  assert.match(ics, /DTSTART:20261026T070000Z/);
  assert.match(ics, /DTEND:20261026T080000Z/);
  assert.match(ics, /LOCATION:Marrick\\, 9 Elystan Mews\\, London/);
  assert.equal((ics.match(/BEGIN:VEVENT/g) ?? []).length, 2);
});

test("home order and site checks", () => {
  assert.equal(homeOrderProblem(Object.keys(HOME_PARTS)), null);
  assert.match(String(homeOrderProblem(["trainer-month"])), /leaves out/);
  assert.match(errorsFor((s) => { s.diary.source = "sheet"; }), /csvUrl/);
  assert.match(errorsFor((s) => { s.firstMonth.prices.first = -5; }), /prices\.first/);
  assert.match(errorsFor((s) => { s.firstMonth.steps[0].text = "Guaranteed to lose 5 kg in a month."; }), /promise/);
  assert.match(errorsFor((s) => { s.qualifications.items[0].awardingBody = ""; }), /awardingBody/);
  assert.match(errorsFor((s) => { s.qualifications.registerUrl = "http://example.com"; }), /registerUrl/);
  assert.match(errorsFor((s) => { s.diary.source = "simulated"; }, client), /simulated/);
});

test("the goal finder's sample week spreads sessions from Monday and cycles the programme's sessions", () => {
  assert.deepEqual(weekPattern(0, 2), [0, 3]);
  assert.deepEqual(weekPattern(5, 2), [5, 1]); // Saturday, then Tuesday
  assert.deepEqual(weekPattern(4, 3), [4, 0, 1]); // a Sunday moves to Monday
  assert.deepEqual(sampleWeek(3, ["A", "B"]).map((x) => `${x.day} ${x.focus}`), ["Monday A", "Wednesday B", "Friday A"]);
});

test("coverage answers from the trainer's own districts", () => {
  assert.equal(districtOf("sw10 9aa"), "SW10");
  assert.equal(districtOf("W8"), "W8");
  assert.equal(districtOf("EC1A1BB"), "EC1A");
  assert.equal(districtOf("hello"), null);
  const areas = [{ id: "home", label: "Home", districts: ["SW3", "SW10"] }, { id: "park", label: "Park", districts: ["SW3"] }];
  assert.deepEqual(coverageFor("SW10 9AA", areas)?.areas.map((a) => a.covered), [true, false]);
  assert.deepEqual(coverageFor("SW19", areas)?.areas.map((a) => a.covered), [false, false]);
  assert.equal(coverageFor("", areas), null);
});

test("twelve weeks: same weekdays, bank holidays and closed days left out, phases by week", () => {
  const phases = [{ from: 1, to: 4, name: "F" }, { from: 5, to: 8, name: "B" }, { from: 9, to: 12, name: "O" }];
  const t = timeline({ start: "2026-12-21", perWeek: 2, postcode: "SW3 2QF", closed: ["2026-12-24"], phases });
  assert.equal(t.weeks.length, 12);
  assert.deepEqual(t.weeks[0].sessions, [{ date: "2026-12-21", holiday: false }, { date: "2026-12-24", holiday: true }]);
  assert.ok(t.holidays.includes("2026-12-28")); // Boxing Day falls on a Saturday in 2026; the substitute is Monday 28th
  assert.equal(t.booked.length, 24 - t.holidays.length);
  assert.equal(t.weeks[4].phase, "B");
  assert.equal(t.finish, t.booked[t.booked.length - 1]);
  // Scotland's own holidays come from the postcode.
  const s = timeline({ start: "2027-01-01", perWeek: 1, postcode: "EH1 1AA", phases });
  assert.ok(s.holidays.includes("2027-01-01"));
});

test("a block's price per session is worked out from the trainer's own totals", () => {
  assert.deepEqual(blockRow({ sessions: 10, price: 1100, duo: 1500 }), { sessions: 10, total: 1100, each: 110, duoTotal: 1500, duoEach: 75 });
  assert.equal(blockRow({ sessions: 3, price: 350 }).each, 117);
  assert.equal(blockRow({ sessions: 1, price: 120 }).duoEach, null);
});

test("hosted sections leave the home page only for a page that exists in the kit", () => {
  for (const [part, page] of Object.entries(HOSTS)) {
    assert.ok(part in HOME_PARTS, part);
    assert.ok(page.startsWith("trainer-") || ["team", "plan-visit"].includes(page), page);
  }
});

test("programmes rest on qualifications the trainer holds and never treat", () => {
  assert.match(errorsFor((s) => { s.programmes.items[1].qualification = "Level 4 Certificate in Something Else"; }), /programmes\.items\[1\]\.qualification: .*only what the trainer holds/);
  assert.match(errorsFor((s) => { delete s.programmes.items[1].care; }), /programmes\.items\[1\]\.care/);
  assert.match(errorsFor((s) => { s.programmes.items[2].line = "Sessions that fix back pain."; }), /reads as a health claim/);
  assert.match(errorsFor((s) => { s.programmes.items[0].text.push("Lose 5 kg in a month."); }), /promise of results/);
  assert.match(errorsFor((s) => { s.goalFinder.goals[0].programme = "nope"; }), /goalFinder\.goals\[0\]\.programme/);
  assert.match(errorsFor((s) => { s.nutrition.qualification = "A diploma I don't have"; }), /nutrition\.qualification/);
});

test("client stories need consent; samples stay on demos", () => {
  assert.match(errorsFor((s) => { s.stories.source = "sample"; }, client), /sample stories are for demos/);
  assert.match(errorsFor((s) => { delete s.stories.items[0].consent; }, client), /stories\.items\[0\]\.consent/);
  assert.match(errorsFor((s) => { s.stories.items[0].words = ["Results in 6 weeks, guaranteed."]; }, client), /promise of results/);
});

test("prices, phases, packages and coverage are checked", () => {
  assert.match(errorsFor((s) => { s.pricesPage.blocks[1].payLink = "https://pay.example.com/x"; }), /Stripe Payment Link/);
  assert.match(errorsFor((s) => { s.pricesPage.blocks.reverse(); }), /smallest block first/);
  assert.match(errorsFor((s) => { s.timeline.phases[1].from = 6; }), /following on from the phase before/);
  assert.match(errorsFor((s) => { s.timeline.phases.pop(); }), /cover all twelve weeks/);
  assert.match(errorsFor((s) => { s.packages.items[0].people = 1; }), /packages\.items\[0\]\.people/);
  assert.match(errorsFor((s) => { s.coverage.areas[0].districts = ["Chelsea"]; }), /postcode districts/);
  assert.match(errorsFor((s) => { s.journal.articles[1].slug = s.journal.articles[0].slug; }), /used twice/);
});

test("promised results are refused in every piece of the trainer's copy (TR-01)", () => {
  const bad = ["Lose a stone in eight weeks.", "Lose two stone.", "Drop half a stone before summer.", "Results after 12 weeks.", "Six weeks to a leaner you.",
    "Visible abs in 30 days.", "Inches off your waist.", "Melt fat fast.", "Shred 10lbs.", "Your best body in 90 days.", "Abs by summer in twelve weeks.",
    "Get beach-body ready.", "Tone up in four weeks.", "A flatter stomach by summer.", "Get lean in 6 weeks.", "Transform your body in 12 weeks.", "Lose weight fast."];
  for (const line of bad) assert.match(errorsFor((s) => { s.programmes.items[3].line = line; }), /promise of results/, line);
  // Everywhere the trainer writes: vouchers, seasonal banners, the photo band, page links, the gallery, messages, Plan your visit.
  const places = [(s, v) => { s.vouchers.terms = v; }, (s, v) => { s.seasons[0].banner = v; }, (s, v) => { s.photoBand.caption = v; }, (s, v) => { s.pageLinks[0].title = v; },
    (s, v) => { s.gallery.photos[0].caption = v; }, (s, v) => { s.messages.general = v; }, (s, v) => { s.visitInfo.intro = v; }, (s, v) => { s.qualifications.insured = v; }];
  for (const put of places) assert.match(errorsFor((s) => put(s, "Lose 2 stone by summer, guaranteed.")), /promise of results/);
  // Honest lines stay allowed.
  const fine = ["Twelve weeks, every session dated.", "Six weeks after the birth, once your GP says so.", "The empty bar weighs twenty kilos.", "Forty-five minutes of strength."];
  for (const line of fine) assert.doesNotMatch(errorsFor((s) => { s.programmes.items[3].line = line; }), /promise|health claim/, line);
  // Google reviews are the reviewer's own words.
  assert.equal(errorsFor((s) => { s.reviews.items[0].text = "Lost a stone in eight weeks!"; }), "");
});

test("health claims are refused on every field and in all copy; someone else's treatment is fine (TR-02)", () => {
  const bad = [(s) => { s.programmes.items[1].line = "Treats diastasis recti and pelvic floor dysfunction."; }, (s) => { s.programmes.items[1].text[0] = "Fixes your pelvic floor."; },
    (s) => { s.programmes.items[2].line = "We'll get rid of your back pain."; }, (s) => { s.programmes.items[2].who = "Pain-free in six weeks."; },
    (s) => { s.programmes.items[2].text[0] = "Sessions that repair your knee."; }, (s) => { s.programmes.items[2].care = "We treat knee pain alongside your physio."; },
    (s) => { s.programmes.items[2].sessions[0] = "Recover from your injury"; }, (s) => { s.nutrition.approach[0] = "Food that heals."; },
    (s) => { s.journal.articles[0].body[0] = "Kettlebells cure back pain."; }, (s) => { s.questions[0].a = "I'll fix your posture."; },
    (s) => { s.programmes.items[2].line = "We treat your knee pain."; }, (s) => { s.programmes.items[3].line = "We treat your injuries."; },
    (s) => { s.programmes.items[2].text[0] = "Sessions that treat your sciatica."; }, (s) => { s.programmes.items[2].care = "We treat them alongside your physio."; },
    (s) => { s.programmes.items[2].who = "Eases your sciatica."; }, (s) => { s.journal.articles[2].body[0] = "Stretching relieves back pain."; }];
  for (const change of bad) assert.match(errorsFor(change), /health claim/);
  const fine = [(s) => { s.programmes.items[2].who = "Once your physio treatment has finished, or your physio's treatment is under way."; },
    (s) => { s.programmes.items[2].care = "I'll fit around your GP's treatment."; }, (s) => { s.vouchers.howToBuy = "Treat someone to a first month."; },
    (s) => { s.vouchers.terms = "Treat yourself, or treat a friend to a block."; }, (s) => { s.programmes.items[2].care = "Your physio treats it; I train around them."; },
    (s) => { s.journal.articles[2].body[1] = "Walking eases you back into the week."; }];
  for (const change of fine) assert.equal(errorsFor(change), "");
});

test("a demo takes no money; the twelve weeks keep to the opening hours (TR-03, TR-06)", () => {
  assert.match(errorsFor((s) => { s.pricesPage.blocks[1].payLink = "https://buy.stripe.com/abc123"; }), /a demo takes no money/);
  assert.equal(errorsFor((s) => { s.pricesPage.blocks[1].payLink = "https://buy.stripe.com/test_abc123"; }), "");
  assert.equal(errorsFor((s) => { s.pricesPage.blocks[1].payLink = "https://buy.stripe.com/abc123"; }, client), "");
  const phases = [{ from: 1, to: 12, name: "All" }];
  const weekly = { mon: [["06:00", "21:00"]], tue: [["06:00", "21:00"]], wed: [["06:00", "21:00"]], thu: [["06:00", "21:00"]], fri: [["06:00", "21:00"]], sat: [["07:00", "14:00"]], sun: [] };
  // Saturday at 19:00: closed (Saturday ends at 14:00); Tuesday after it, fine.
  const sat = timeline({ start: "2027-01-09", perWeek: 2, postcode: "SW3 2QF", weekly, time: "19:00", minutes: 60, phases });
  assert.deepEqual(sat.weeks[0].sessions, [{ date: "2027-01-09", holiday: true }, { date: "2027-01-12", holiday: false }]);
  // A session must end by closing: 20:30 for an hour runs past 21:00.
  assert.equal(timeline({ start: "2027-01-11", perWeek: 1, postcode: "SW3 2QF", weekly, time: "20:30", minutes: 60, phases }).booked.length, 0);
  assert.equal(timeline({ start: "2027-01-11", perWeek: 1, postcode: "SW3 2QF", weekly, time: "07:00", minutes: 60, phases }).booked.length, 11); // Easter Monday, 29 Mar 2027, left out
});
