import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  timeWords, lengthWords, sessionsWords, ageGroups, ageLabel, trialText, dateWords, yearItems, nextItem, yearIcs,
  placesFromCsv, placesWords, catchUps, pathFrom, showDayFromCsv, showDayRow, normaliseCode,
} from "../../src/kits/ballet/lib/ballet.js";
import { HOME_PARTS } from "../../src/kits/ballet/home.js";
import { pageData } from "../../src/kits/ballet/kit.js";
import { validateSite } from "../../src/core/lib/config.js";
import { loadCatalog } from "../../scripts/lib/catalog.js";

const demo = JSON.parse(readFileSync("sites/demos/ballet/site.json", "utf8"));
const client = JSON.parse(readFileSync("tests/fixtures/sites/test-ballet-client/site.json", "utf8"));
const look = JSON.parse(readFileSync("src/looks/round/look.json", "utf8"));
const catalog = loadCatalog(process.cwd());
const errorsFor = (/** @type {(s: any) => void} */ change, base = demo) => { const s = structuredClone(base); change(s); return validateSite(s, { catalog }).join("\n"); };
const NOW = Date.parse("2026-11-17T10:00:00Z");
const TZ = "Europe/London";
const classes = demo.classes.items;

test("the demo and the client fixture are valid", () => {
  assert.deepEqual(validateSite(demo, { catalog }), []);
  assert.deepEqual(validateSite(client, { catalog }), []);
});

test("the look's home order is the kit's home sections, in order", () => {
  assert.deepEqual(look.homeOrder, Object.keys(HOME_PARTS));
});

test("a misspelt setting is refused, not ignored", () => {
  assert.match(errorsFor((s) => { s.classes.items[0].minutse = 30; }), /classes\.items\[0\]\.minutse: unknown setting/);
  assert.match(errorsFor((s) => { s.shows.items[0].tickets.soldout = true; }), /tickets\.soldout: unknown setting/);
});

test("simulated data never reaches a client site, and the sheets must be published Google Sheets", () => {
  assert.match(errorsFor((s) => { s.places.source = "simulated"; }, client), /places\.source: simulated data is for demos/);
  assert.match(errorsFor((s) => { s.places.csvUrl = "https://example.com/x.csv"; }, client), /places\.csvUrl/);
  assert.match(errorsFor((s) => { s.mode = "client"; s.showDay.source = "simulated"; }), /showDay\.source: simulated data is for demos/);
});

test("the school's own classes, dates and shows are checked so the page can't mislead", () => {
  assert.match(errorsFor((s) => { s.classes.items[1].ages = [4, 3]; }), /classes\.items\[1\]\.ages/);
  assert.match(errorsFor((s) => { s.classes.items[1].sessions[0].time = "4pm"; }), /sessions\[0\]\.time/);
  assert.match(errorsFor((s) => { s.classes.items[1].id = s.classes.items[0].id; }), /used twice/);
  assert.match(errorsFor((s) => { s.year.items[1].end = "2026-12-01"; }), /year\.items\[1\]\.end: on or after the date/);
  assert.match(errorsFor((s) => { s.uniform.sets[0].classes = ["nope"]; }), /no class "nope"/);
  assert.match(errorsFor((s) => { s.exams.items[0].classes = ["nope"]; }), /no class "nope"/);
  assert.match(errorsFor((s) => { s.shows.items[0].tickets.url = "http://insecure.example"; }), /tickets\.url/);
  assert.match(errorsFor((s) => { s.showDay.show = "spring"; }), /showDay\.show: no show "spring"/);
  assert.match(errorsFor((s) => { s.handbook.updated = "September"; }), /handbook\.updated/);
});

test("ages, days, times and lengths read as a parent says them", () => {
  assert.equal(timeWords("16:00"), "4.00pm");
  assert.equal(timeWords("09:15"), "9.15am");
  assert.equal(timeWords("12:00"), "12.00pm");
  assert.equal(lengthWords(40), "40 minutes");
  assert.equal(lengthWords(60), "1 hour");
  assert.equal(lengthWords(75), "1 hour 15");
  assert.equal(lengthWords(120), "2 hours");
  assert.equal(sessionsWords([{ day: "sat", time: "10:00" }, { day: "tue", time: "16:00" }]), "Tuesdays 4.00pm or Saturdays 10.00am");
  assert.equal(ageLabel([2, 2]), "2");
  assert.equal(ageLabel([3, 4]), "3–4");
});

test("the finder's groups: every age range once, youngest first, two classes sharing a range together", () => {
  const groups = ageGroups(classes);
  assert.deepEqual(groups.map((g) => g.label), ["2", "3–4", "5–6", "7–8", "9–11", "12–14", "15–18"]);
  assert.deepEqual(groups[3].classes.map((c) => c.id), ["two", "boys"]);
});

test("the trial message carries the age, the class and when; without a class it's a plain question", () => {
  assert.equal(trialText("Hello Wrenna,", { ages: [3, 4], name: "Little ballet", when: "Saturday 10.00am" }),
    "Hello Wrenna, could my child (age 3 to 4) try Little ballet, Saturday 10.00am?");
  assert.equal(trialText("Hello Wrenna,", {}), "Hello Wrenna, could my child come to a trial class?");
});

test("the year: past dates drop off, shows and exams join in date order, the next is named, one calendar file", () => {
  const items = yearItems(demo.year.items, demo.shows.items, demo.exams.items, "2026-11-17");
  assert.equal(items[0].label, "Winter showcase");
  assert.ok(items.every((x, i) => i === 0 || items[i - 1].date <= x.date));
  assert.ok(items.some((x) => x.kind === "exam"));
  assert.equal(nextItem(items, "2026-12-13")?.label, "Autumn term ends");
  assert.equal(yearItems(demo.year.items, [], [], "2027-01-01").find((x) => x.id === "winter-hol")?.label, "Winter holiday"); // still running
  assert.equal(dateWords("2026-12-12"), "Saturday 12 December");
  assert.equal(dateWords("2026-12-12", "short"), "12 Dec");
  const ics = yearIcs({ items, school: "Wrenna", place: "Linden Hall, Richmond", stamp: "20261117T100000Z" });
  assert.match(ics, /^BEGIN:VCALENDAR\r\n/);
  assert.equal((ics.match(/BEGIN:VEVENT/g) ?? []).length, items.length);
  assert.match(ics, /DTSTART;VALUE=DATE:20261220\r\nDTEND;VALUE=DATE:20270104\r\n/); // the holiday runs to its end
  assert.match(ics, /LOCATION:Linden Hall\\, Richmond/);
});

test("places left: numbers and full from the sheet; it fails closed when old, unreadable or unknown", () => {
  const csv = "class,day,time,places,updated_at\nlittle,tue,16:00,2,2026-11-16 09:00\nlittle,Saturday,10:00,full,\none,wed,16:15,0,\n";
  const r = placesFromCsv(csv, NOW, 7, TZ);
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.equal(r.places["little|tue|16:00"], 2);
  assert.equal(r.places["little|sat|10:00"], "full");
  assert.equal(r.places["one|wed|16:15"], "full"); // 0 counts as full
  assert.deepEqual(placesWords(2), { state: "few", words: "2 places left" });
  assert.deepEqual(placesWords(1), { state: "few", words: "1 place left" });
  assert.equal(placesWords("full")?.state, "full");
  assert.equal(placesWords(undefined), null);
  assert.equal(placesFromCsv(csv, NOW + 9 * 86_400_000, 7, TZ).ok, false); // old
  assert.equal(placesFromCsv("class,day,time\nlittle,tue,16:00\n", NOW, 7, TZ).ok, false); // a column missing
  assert.equal(placesFromCsv("class,day,time,places,updated_at\nlittle,tue,16:00,lots,2026-11-16\n", NOW, 7, TZ).ok, false);
  assert.equal(placesFromCsv("class,day,time,places,updated_at\nlittle,tue,4pm,2,2026-11-16\n", NOW, 7, TZ).ok, false);
  assert.equal(placesFromCsv("class,day,time,places\nlittle,tue,16:00,2\n", NOW, 7, TZ).ok, false); // no date: can't tell it's current
});

test("catch-ups: the class's other sessions first, then the same level; never the one missed", () => {
  const out = catchUps(classes, "little", { day: "tue", time: "16:00" });
  assert.deepEqual(out.map((x) => `${x.cls.id} ${x.session.day}`), ["little sat"]);
  assert.deepEqual(catchUps(classes, "three", { day: "mon", time: "17:00" }), []);
  assert.deepEqual(catchUps(classes, "nope", { day: "mon", time: "17:00" }), []);
});

test("where she'll go next: runs of ages, the main class where two share an age", () => {
  const runs = pathFrom(classes, 4);
  assert.deepEqual(runs.map((r) => `${r.from}-${r.to} ${r.cls.id}`), ["4-4 little", "5-6 one", "7-8 two", "9-11 three", "12-14 four", "15-18 senior"]);
});

test("show day: a row per code, typed loosely; it fails closed when old or a column is missing", () => {
  const csv = "code,class,arrive,door,costume,hair,collect,notes,updated_at\nLB-TUE,Little ballet,1.15pm,Stage door,Pink tutu,Bun,4.30pm,,2026-11-16 18:00\n";
  const r = showDayFromCsv(csv, NOW, 14, TZ);
  assert.ok(r.ok);
  assert.equal(normaliseCode(" lb tue "), "LB-TUE");
  assert.equal(showDayRow(r, "lb tue")?.collect, "4.30pm");
  assert.equal(showDayRow(r, "B1-WED"), null);
  assert.equal(showDayFromCsv(csv, NOW + 20 * 86_400_000, 14, TZ).ok, false);
  assert.equal(showDayFromCsv("code,class\nLB-TUE,Little ballet\n", NOW, 14, TZ).ok, false);
});

test("the page carries only what the features that are on need", () => {
  const d = pageData(client);
  assert.equal(d.showDay, null);
  assert.equal(d.exams, null);
  assert.ok(d.places && d.classes && d.year && d.catchUp);
  assert.ok(pageData(demo).year?.items.some((/** @type {any} */ x) => x.kind === "show"));
});
