import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { classesOn, weekFrom, upcoming, reformerMarks, placesWords, findClass, waitlistText, weekIcs, saidTime, dayName, shortDay } from "../../src/kits/pilates/lib/classes.js";
import { placesFromCsv } from "../../src/kits/pilates/lib/places.js";
import { HOME_PARTS, homeOrderProblem, onPagesProblem } from "../../src/kits/pilates/home.js";
import { validateSite } from "../../src/core/lib/config.js";
import { loadCatalog } from "../../scripts/lib/catalog.js";

const demo = JSON.parse(readFileSync("sites/demos/pilates/site.json", "utf8"));
const client = JSON.parse(readFileSync("tests/fixtures/sites/test-pilates-client/site.json", "utf8"));
const catalog = loadCatalog(process.cwd());
const errorsFor = (/** @type {(s: any) => void} */ change, base = demo) => { const s = structuredClone(base); change(s); return validateSite(s, { catalog }).join("\n"); };
const TZ = "Europe/London";
const tt = { reformers: 6, weekly: { thu: [{ time: "18:00", class: "tempo" }, { time: "07:00", class: "sculpt", teacher: "Anna" }], fri: [{ time: "09:15", class: "foundation" }] } };
const hours = { timezone: TZ, weekly: {}, exceptions: [{ date: "2026-12-24", ranges: [] }] };

test("the demo and the client fixture are valid", () => {
  assert.deepEqual(validateSite(demo, { catalog }), []);
  assert.deepEqual(validateSite(client, { catalog }), []);
});

test("a day's classes come earliest first, and a closed day has none", () => {
  assert.deepEqual(classesOn(tt, hours, "2026-10-29").map((c) => c.time), ["07:00", "18:00"]);
  assert.equal(classesOn(tt, hours, "2026-10-29")[0].teacher, "Anna");
  assert.equal(classesOn(tt, hours, "2026-10-29")[0].key, "2026-10-29 07:00");
  assert.deepEqual(classesOn(tt, hours, "2026-12-24"), [], "Christmas Eve is a Thursday, but the studio is closed");
  assert.equal(weekFrom(tt, hours, "2026-10-29").length, 7);
});

test("upcoming skips classes that have started and can be limited to one class", () => {
  const now = { date: "2026-10-29", minutes: 7 * 60 };
  assert.deepEqual(upcoming(tt, hours, now, 2).map((c) => c.key), ["2026-10-29 18:00", "2026-10-30 09:15"]);
  assert.deepEqual(upcoming(tt, hours, now, 1, "foundation").map((c) => c.key), ["2026-10-30 09:15"]);
  assert.equal(upcoming(tt, hours, now, 3, "pottery").length, 0);
});

test("the reformer marks: booked first, free last; unknown places draw nothing", () => {
  assert.deepEqual(reformerMarks(6, 2), [true, true, true, true, false, false]);
  assert.deepEqual(reformerMarks(6, 0), [true, true, true, true, true, true]);
  assert.deepEqual(reformerMarks(6, 9), [false, false, false, false, false, false]);
  assert.equal(reformerMarks(6, null), null);
  assert.equal(reformerMarks(6, -1), null);
  assert.equal(placesWords(0), "Full");
  assert.equal(placesWords(1), "1 left");
});

test("times and days are said the way a UK studio says them", () => {
  assert.equal(saidTime("09:15"), "9.15");
  assert.equal(saidTime("18:00"), "18.00");
  assert.equal(dayName("2026-10-29"), "Thursday 29 October");
  assert.equal(shortDay("2026-11-01"), "Sun 1");
});

test("find your first class: pregnancy first, then new, then pace", () => {
  const map = { new: "foundation", slower: "stretch", steady: "sculpt", faster: "tempo", pregnancy: "prenatal" };
  assert.equal(findClass({ pregnancy: true, isNew: true, pace: "faster" }, map).class, "prenatal");
  assert.equal(findClass({ pregnancy: false, isNew: true, pace: "faster" }, map).class, "foundation");
  assert.equal(findClass({ pregnancy: false, isNew: false, pace: "faster" }, map).class, "tempo");
  const noPreg = { new: "foundation", slower: "stretch", steady: "sculpt", faster: "tempo" };
  assert.equal(findClass({ pregnancy: true, isNew: false, pace: "steady" }, noPreg).class, "sculpt", "no pregnancy class: the answer is ignored");
});

test("messages fill in the class, day and time", () => {
  assert.equal(waitlistText("Add me to {class} on {day} at {time}.", { class: "Sculpt", day: "Thursday 29 October", time: "7.00" }), "Add me to Sculpt on Thursday 29 October at 7.00.");
});

test("your week as a calendar file keeps the studio's time zone", () => {
  const ics = weekIcs({ items: [{ date: "2026-10-29", time: "23:30", minutes: 50, name: "Late, class" }], studio: "Ottoline", place: "4 Mews, London", tz: TZ, stamp: "20261029T120000Z" });
  assert.match(ics, /DTSTART;TZID=Europe\/London:20261029T233000/);
  assert.match(ics, /DTEND;TZID=Europe\/London:20261030T002000/, "a class running past midnight ends the next day");
  assert.match(ics, /SUMMARY:Late\\, class · Ottoline/);
  assert.match(ics, /UID:2026-10-29-2330@ottoline/);
  assert.ok(ics.endsWith("END:VCALENDAR\r\n"));
});

test("places from the sheet fail closed", () => {
  const now = Date.parse("2026-10-29T09:00:00Z"); // 09:00 GMT, 29 Oct
  const csv = (...rows) => ["date,time,left,updated_at", ...rows].join("\n");
  const r = placesFromCsv(csv(
    "2026-10-29,09:15,2,2026-10-29 08:50", // fresh: used
    "2026-10-29,08:00,3,2026-10-29 08:50", // started: dropped
    "2026-10-29,18:00,4,2026-10-29 06:00", // stale count: dropped
    "2026-10-29,19:15,0,2026-10-28 20:00", // an old "full" is stale too: dropped
    "2026-10-29,20:00,0,2026-10-29 08:55", // fresh full: used
    "2026-10-29,17:00,9,2026-10-29 08:55", // more places than reformers: that class says nothing
    "2026-10-30,07:00,two,2026-10-29 08:50", // unreadable: dropped
    "2026-10-30,09:15,1,2026-10-29 11:00", // updated in the future: dropped
    "2026-10-30,12:30,-1,2026-10-29 08:50", // negative: dropped
  ), now, TZ, 30, 6);
  assert.ok(r.ok);
  assert.deepEqual(r.ok && r.left, { "2026-10-29 09:15": 2, "2026-10-29 20:00": 0 });
  const over = placesFromCsv(csv("2026-10-29,09:15,2,2026-10-29 08:40", "2026-10-29,09:15,7,2026-10-29 08:55"), now, TZ, 30, 6);
  assert.deepEqual(over.ok && over.left, {}, "a class with an impossible count shows nothing, even beside a good row");
  const named = ["date,time,left,updated_at,name", "2026-10-29,09:15,2,2026-10-29 08:50,Jane"].join("\n");
  assert.deepEqual(placesFromCsv(named, now, TZ, 30, 6), { ok: false }, "anything in a column it doesn't expect refuses the sheet");
  assert.ok(placesFromCsv(named.replace(",Jane", ","), now, TZ, 30, 6).ok, "an empty extra column is harmless");
  assert.deepEqual(placesFromCsv("", now, TZ, 30), { ok: false });
  assert.deepEqual(placesFromCsv("when,left\n1,2", now, TZ, 30), { ok: false });
  const newer = placesFromCsv(csv("2026-10-29,09:15,3,2026-10-29 08:40", "2026-10-29,09:15,1,2026-10-29 08:55"), now, TZ, 30);
  assert.equal(newer.ok && newer.left["2026-10-29 09:15"], 1, "the latest row for a class wins");
});

test("validation: what a studio could get wrong is refused", () => {
  assert.match(errorsFor((s) => { s.places = { source: "simulated" }; }, client), /simulated places are for demos only/);
  assert.match(errorsFor((s) => { s.introCard.payLink = "https://buy.stripe.com/test_x"; }, client), /test-mode link; client sites need/);
  assert.match(errorsFor((s) => { s.introCard.payLink = "https://buy.stripe.com/live_x"; }), /demo sites must use a Stripe test-mode link/);
  assert.match(errorsFor((s) => { s.timetable.weekly.mon[0].class = "spin"; }), /timetable.weekly.mon\[0\].class: a class id from classTypes/);
  assert.match(errorsFor((s) => { s.timetable.weekly.mon[1].time = s.timetable.weekly.mon[0].time; }), /one room runs one class at a time/);
  assert.match(errorsFor((s) => { s.timetable.weekly.tues = []; }), /timetable.weekly.tues: unknown setting/);
  assert.match(errorsFor((s) => { s.messages.book = "Hello"; }), /messages.book/);
  assert.match(errorsFor((s) => { s.waitlist.message = "Add me"; }), /waitlist.message/);
  assert.match(errorsFor((s) => { s.classFinder.new = "nope"; }), /classFinder.new/);
  assert.match(errorsFor((s) => { s.introCard.price = 45.5; }), /introCard.price/);
  assert.match(errorsFor((s) => { s.retreats.items[0].to = "2027-05-01"; }), /ends before it starts/);
  assert.match(errorsFor((s) => { s.retreats.formUrl = "https://example.com/form"; }), /Google Form/);
  assert.match(errorsFor((s) => { s.reformerClip.captions[1].from = 1; }), /in time order/);
  assert.match(errorsFor((s) => { s.reformerClip.captions[3].to = 30; }), /after the clip ends/);
  assert.match(errorsFor((s) => { delete s.hero.photo; }), /hero.photo/);
  assert.match(errorsFor((s) => { s.places = { source: "sheet", csvUrl: "https://example.com/x.csv" }; }), /published as CSV/);
});

test("home order and pages: every section once, moves only where allowed", () => {
  const look = catalog.looks.dune;
  assert.equal(homeOrderProblem(look.homeOrder), null);
  assert.equal(look.homeOrder.length, Object.keys(HOME_PARTS).length);
  assert.equal(onPagesProblem(look.onPages), null);
  assert.match(String(onPagesProblem({ "private-page": ["timetable"] })), /only reviews/);
  assert.match(String(homeOrderProblem(["timetable"])), /leaves out/);
});

import { settingsToHash, settingsFromHash, cleanCode, passportFromCsv, nextMilestone, packOptions, daysUntil, workshopIcs, ordinal } from "../../src/kits/pilates/lib/members.js";

const machine = demo.machine;

test("reformer settings survive the link, and anything out of range is dropped", () => {
  const s = { name: "Leah", springs: { red: 1, blue: 2 }, footbar: 2, headrest: "up", straps: "long", gear: 3, note: "Lighter on the left knee" };
  const h = settingsToHash(s, machine);
  assert.deepEqual(settingsFromHash(`#${h}`, machine), s);
  const bad = settingsFromHash("s-red=9&f=7&h=sideways&t=long&g=0&x=<script>", machine);
  assert.deepEqual(bad && { springs: bad.springs, footbar: bad.footbar, headrest: bad.headrest, straps: bad.straps, gear: bad.gear, note: bad.note }, { springs: {}, footbar: 0, headrest: "", straps: "long", gear: 0, note: "script" });
  assert.equal(settingsFromHash("", machine), null, "an empty link shows no card");
  assert.equal(settingsFromHash("n=Leah", machine), null, "a name alone is not a card");
});

test("the class passport reads one member's row and fails closed", () => {
  const now = Date.parse("2026-11-02T12:00:00Z");
  const csv = ["code,card,left,expires,total,month,updated_at", "K7M2QX4P,Ten classes,4,2027-01-31,47,6,2026-11-02 09:00", "OLD12345,Five classes,2,2026-12-01,10,1,2026-10-20 09:00", "MEM99999,Membership,,,112,9,2026-11-02 08:00", "BAD11111,Ten,x,2027-01-01,1,1,2026-11-02 08:00",
    "FEB30XXX,Ten,2,2027-02-30,9,1,2026-11-02 08:00", "MONTH999,Ten,2,,3,5,2026-11-02 08:00", "TWICE123,Ten,2,,9,1,2026-11-02 08:00", "TWICE123,Five,1,,4,1,2026-11-02 08:30"].join("\n");
  const p = passportFromCsv(csv, "k7m2-qx4p", now, TZ, 48);
  assert.deepEqual(p, { ok: true, card: "Ten classes", left: 4, expires: "2027-01-31", total: 47, month: 6, updatedAt: Date.parse("2026-11-02T09:00:00Z") });
  assert.equal(passportFromCsv(csv, "MEM99999", now, TZ, 48).ok && passportFromCsv(csv, "MEM99999", now, TZ, 48).left, null);
  assert.deepEqual(passportFromCsv(csv, "OLD12345", now, TZ, 48), { ok: false, reason: "stale" });
  assert.deepEqual(passportFromCsv(csv, "NOPE9999", now, TZ, 48), { ok: false, reason: "unknown" });
  for (const code of ["BAD11111", "FEB30XXX", "MONTH999", "TWICE123"]) assert.deepEqual(passportFromCsv(csv, code, now, TZ, 48), { ok: false, reason: "unreadable" }, code);
  assert.deepEqual(passportFromCsv(csv.replace("updated_at", "updated_at,email").replace("09:00\n", "09:00,a@b.example\n"), "K7M2QX4P", now, TZ, 48), { ok: false, reason: "unreadable" }, "anything in an extra column refuses the sheet");
  assert.deepEqual(passportFromCsv("a,b\n1,2", "K7M2QX4P", now, TZ, 48), { ok: false, reason: "unreadable" });
  assert.equal(cleanCode("ab"), "");
  assert.equal(cleanCode("ABC1234"), "", "codes are at least 8 characters");
  assert.equal(cleanCode("abcd-1234-wxyz"), "ABCD1234WXYZ");
  assert.deepEqual(nextMilestone(47, [100, 25, 50]), { at: 50, toGo: 3 });
  assert.equal(nextMilestone(300, [25, 50]), null);
  assert.deepEqual([1, 2, 3, 11, 12, 13, 21, 22, 50, 101, 111].map(ordinal), ["1st", "2nd", "3rd", "11th", "12th", "13th", "21st", "22nd", "50th", "101st", "111th"]);
});

test("pack calculator: cheapest first, expiring packs and extra classes counted honestly", () => {
  const prices = { single: 28, packs: [{ id: "ten", name: "Ten", classes: 10, price: 240, months: 4 }], memberships: [{ id: "eight", name: "Eight", monthly: 175, classes: 8 }, { id: "unl", name: "Unlimited", monthly: 245, classes: "unlimited" }] };
  const once = packOptions(1, prices); // 4.33 a month: ten classes would last 2.3 months, inside 4
  assert.equal(once[0].id, "ten");
  assert.equal(once.find((o) => o.id === "single")?.perMonth, 121.33);
  const rare = packOptions(0.5, { ...prices, packs: [{ id: "ten", name: "Ten", classes: 10, price: 240, months: 2 }] }); // 2.17 a month: about 6 of the 10 run out unused
  assert.match(rare.find((o) => o.id === "ten")?.note ?? "", /6 classes run out/);
  const often = packOptions(4, prices); // 17.33 a month
  assert.equal(often[0].id, "unl");
  assert.match(often.find((o) => o.id === "eight")?.note ?? "", /includes 9 more at the single price/);
});

test("dates: days to the balance; a workshop in the calendar at the studio's time", () => {
  assert.equal(daysUntil("2026-11-02", "2027-03-31"), 149);
  assert.equal(daysUntil("2027-03-28", "2027-03-29"), 1, "a clock change doesn't lose a day");
  const ics = workshopIcs({ id: "springs-101", title: "The springs, explained", date: "2026-11-21", from: "10:00", to: "12:00", studio: "Ottoline", place: "4 Hesketh Mews", tz: TZ, stamp: "20261102T120000Z" });
  assert.match(ics, /DTSTART;TZID=Europe\/London:20261121T100000/);
  assert.match(ics, /SUMMARY:The springs\\, explained · Ottoline/);
});

test("validation: the Signature extras refuse what could mislead", () => {
  assert.match(errorsFor((s) => { s.passport = { source: "simulated", milestones: [25] }; }, client), /simulated data is for demos only/);
  assert.match(errorsFor((s) => { s.passport.example = "OTTO24"; }), /8–12 capital letters/);
  assert.match(errorsFor((s) => { s.method.items[0].classes = ["spin"]; }), /method.items\[0\].classes/);
  assert.match(errorsFor((s) => { delete s.classTypes.items[0].who; }), /classTypes.items\[0\].who/);
  assert.match(errorsFor((s) => { s.teacherPages.items[0].name = "Annie"; }), /exactly as in staff/);
  assert.match(errorsFor((s) => { s.retreats.items[0].placesLeft = 40; }), /no more than places/);
  assert.match(errorsFor((s) => { delete s.retreats.items[0].placesChecked; }), /the date the studio last counted/);
  assert.match(errorsFor((s) => { s.retreats.items[0].balanceDue = "2027-06-01"; }), /before the retreat starts/);
  assert.match(errorsFor((s) => { s.workshops.items[0].to = "09:00"; }), /ending after it starts/);
  assert.match(errorsFor((s) => { s.workshops.items[0].payLink = "https://buy.stripe.com/live_x"; }), /test-mode link/);
  assert.match(errorsFor((s) => { s.machine.springs = []; }), /machine.springs/);
  assert.match(errorsFor((s) => { s.packs.memberships[0].classes = "lots"; }), /unlimited/);
  assert.match(errorsFor((s) => { s.studioHire.maxPeople = 0; }), /studioHire.maxPeople/);
});
