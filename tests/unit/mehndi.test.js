import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  datesFromCsv, dayAnswer, mehndiDay, guestPlan, hoursWords, artistsWords, planDates, weekIcs, icsStamp,
  dateText, guestText, designText, plannerText, familyText, personalText, NHS_PPD,
} from "../../src/kits/mehndi/lib/mehndi.js";
import { HOME_PARTS, homeOrderProblem, onPagesProblem } from "../../src/kits/mehndi/home.js";
import { validateSite } from "../../src/core/lib/config.js";
import { loadCatalog } from "../../scripts/lib/catalog.js";

const demo = JSON.parse(readFileSync("sites/demos/mehndi/site.json", "utf8"));
const client = JSON.parse(readFileSync("tests/fixtures/sites/test-mehndi-client/site.json", "utf8"));
const look = JSON.parse(readFileSync("src/looks/loupe/look.json", "utf8"));
const catalog = loadCatalog(process.cwd());
const errorsFor = (/** @type {(s: any) => void} */ change, base = demo) => { const s = structuredClone(base); change(s); return validateSite(s, { catalog }).join("\n"); };
const NOW = Date.parse("2026-11-09T10:00:00Z");
const TZ = "Europe/London";

test("the demo and the client fixture are valid", () => {
  assert.deepEqual(validateSite(demo, { catalog }), []);
  assert.deepEqual(validateSite(client, { catalog }), []);
});

test("the look's home order and pages name every section once and only what a page can hold", () => {
  assert.equal(homeOrderProblem(look.homeOrder), null);
  assert.equal(onPagesProblem(look.onPages), null);
  assert.match(homeOrderProblem(Object.keys(HOME_PARTS).slice(1)) ?? "", /leaves out/);
  assert.match(onPagesProblem({ "bridal-mehndi": ["visit"] }) ?? "", /only/);
});

test("a misspelt setting is refused, not ignored", () => {
  assert.match(errorsFor((s) => { s.packages.items[0].prise = 30; }), /packages\.items\[0\]\.prise: unknown setting/);
  assert.match(errorsFor((s) => { s.hero.find.size = 30; }), /hero\.find\.size: unknown setting/);
  assert.match(errorsFor((s) => { s.guests.perArtist = 180; }), /guests\.perArtist: unknown setting/);
});

test("simulated data never reaches a client site, and the sheet must be a published Google Sheet", () => {
  assert.match(errorsFor((s) => { s.dateCheck = { source: "simulated", message: "Hi," }; }, client), /simulated data is only allowed on demo sites/);
  assert.match(errorsFor((s) => { s.dateCheck.csvUrl = "https://example.com/dates.csv"; }, client), /published Google Sheet CSV/);
});

test("the artist's own figures are checked so the page can't mislead", () => {
  assert.match(errorsFor((s) => { s.hero.find.x = 120; }), /hero\.find\.x/);
  assert.match(errorsFor((s) => { s.packages.items[0].hours = 4.2; }), /packages\.items\[0\]\.hours/);
  assert.match(errorsFor((s) => { s.guests.start = 500; }), /guests\.start/);
  assert.match(errorsFor((s) => { s.guests.defaultSize = "huge"; }), /guests\.defaultSize/);
  assert.match(errorsFor((s) => { s.designs.items[0].style = "boho"; }), /designs\.items\[0\]\.style/);
  assert.match(errorsFor((s) => { s.darkest.daysBefore = 9; }), /darkest\.daysBefore/);
  assert.match(errorsFor((s) => { delete s.planner.steps[3].mehndi; }), /exactly one step as the mehndi/);
  assert.match(errorsFor((s) => { s.planner.steps[0].mehndi = true; }), /exactly one step as the mehndi/);
  assert.match(errorsFor((s) => { s.stainDays.stages[1].day = 0; }, client), /stainDays\.stages\[1\]\.day: days from the mehndi evening/);
  assert.match(errorsFor((s) => { s.stainDays.stages = s.stainDays.stages.slice(0, 1); }, client), /stainDays\.stages: 2 to 4/);
});

test("the diary: dates not listed are free; few and taken come from the sheet", () => {
  const csv = "date,status,updated_at\n2027-06-12,taken,2026-11-02 09:12\n2027-06-19,A few,\n2027-07-03,open,\n";
  const r = datesFromCsv(csv, NOW, 21, TZ);
  assert.ok(r.ok);
  assert.deepEqual(r.ok && r.days, { "2027-06-12": "taken", "2027-06-19": "few" });
  assert.equal(dayAnswer("2027-06-12", "2026-11-09", r).state, "taken");
  assert.equal(dayAnswer("2027-06-19", "2026-11-09", r).state, "few");
  assert.equal(dayAnswer("2027-06-26", "2026-11-09", r).state, "open");
  assert.equal(dayAnswer("2026-10-01", "2026-11-09", r).state, "past");
});

test("the diary fails closed: old, unreadable, unknown words or bad dates ask the bride to message", () => {
  const head = "date,status,updated_at\n";
  for (const csv of [
    `${head}2027-06-12,taken,2026-09-01 09:00\n`, // older than 21 days
    `${head}2027-06-12,taken,\n`, // never dated
    `${head}2027-06-12,booked,2026-11-08 09:00\n`, // a word it doesn't know
    `${head}2027-02-30,taken,2026-11-08 09:00\n`, // no such day
    `${head}2027-06-12,taken,11/08/2026 09:00 PM\n`, // unreadable time
    "day,state\n2027-06-12,taken\n", // wrong columns
    "",
  ]) assert.deepEqual(datesFromCsv(csv, NOW, 21, TZ), { ok: false }, csv);
  assert.equal(dayAnswer("2027-06-12", "2026-11-09", { ok: false }).state, "unknown");
  assert.match(dayAnswer("2027-06-12", "2026-11-09", null).words, /Ask/);
  assert.doesNotMatch(Object.values(["open", "few", "taken"]).map((s) => dayAnswer("2027-06-12", "2026-11-09", { ok: true, days: s === "open" ? {} : { "2027-06-12": /** @type {any} */ (s) }, updatedAt: NOW }).words).join(" "), /booked/i);
});

test("darkest on the day: the mehndi falls the artist's days before, across a clock change and a month end", () => {
  assert.equal(mehndiDay("2027-06-12", 2), "2027-06-10");
  assert.equal(mehndiDay("2027-03-29", 2), "2027-03-27"); // clocks go forward on the 28th
  assert.equal(mehndiDay("2027-03-01", 1), "2027-02-28");
});

test("the guest sum: as few artists as fit the night, rounded up to ten minutes, and honest when it's too many", () => {
  assert.deepEqual(guestPlan(24, 10, 180, 4), { artists: 2, minutes: 120, over: false });
  assert.deepEqual(guestPlan(1, 5, 180, 4), { artists: 1, minutes: 10, over: false });
  assert.deepEqual(guestPlan(18, 10, 180, 4), { artists: 1, minutes: 180, over: false });
  assert.deepEqual(guestPlan(120, 20, 180, 4), { artists: 4, minutes: 600, over: true });
  assert.equal(hoursWords(150), "2 hrs 30");
  assert.equal(hoursWords(60), "1 hr");
  assert.equal(hoursWords(40), "40 min");
  assert.equal(artistsWords(1), "One artist");
  assert.equal(artistsWords(3), "Three artists");
});

test("the wedding week: each step on its day, earliest first, past ones marked; one calendar file", () => {
  const dates = planDates("2027-06-12", demo.planner.steps, "2027-05-20");
  assert.deepEqual(dates.map((d) => [d.id, d.date, d.past]), [
    ["trial", "2027-05-01", true], ["outfit", "2027-05-22", false], ["prep", "2027-06-09", false], ["mehndi", "2027-06-10", false], ["off", "2027-06-11", false],
  ]);
  const ics = weekIcs({ artist: "Hatheli", place: "Studio 4, Southall", stamp: icsStamp(new Date("2026-11-09T10:00:00Z")), events: [{ id: "mehndi", date: "2027-06-10", title: "Your mehndi · Hatheli" }, { id: "wedding", date: "2027-06-12", title: "The wedding" }] });
  assert.match(ics, /DTSTART;VALUE=DATE:20270610\r\nDTEND;VALUE=DATE:20270611/);
  assert.match(ics, /UID:wedding-2027-06-12@hatheli/);
  assert.match(ics, /DTSTAMP:20261109T100000Z/);
  assert.match(ics, /LOCATION:Studio 4\\, Southall/);
  assert.ok(ics.endsWith("END:VCALENDAR\r\n"));
});

test("every message starts with the artist's opening and carries what the bride chose", () => {
  assert.equal(dateText("Hello Hatheli,", "2027-06-12"), "Hello Hatheli, is Saturday 12 June 2027 free for bridal mehndi?");
  assert.equal(dateText("Hello Hatheli,", ""), "Hello Hatheli, I'd like to check a date for bridal mehndi.");
  assert.equal(guestText("Hello Hatheli,", { guests: 24, size: "Floral trail", minutes: 10, price: 360, wedding: "2027-06-12" }),
    "Hello Hatheli, guest mehndi on Saturday 12 June 2027: 24 guests, floral trail each (about 10 min, from £360). Could you quote for us?");
  assert.equal(designText("Hello Hatheli,", "Arabic trail"), "Hello Hatheli, I'd like to ask about the Arabic trail design.");
  assert.equal(plannerText("Hello Hatheli,", "2027-06-12", "2027-06-10"), "Hello Hatheli, our wedding is Saturday 12 June 2027. Could we hold Thursday 10 June 2027 for my mehndi?");
  assert.equal(familyText("Hatheli", [{ label: "Your mehndi", date: "2027-06-10" }], "2027-06-12"),
    "Our mehndi week, from Hatheli:\nThursday 10 June 2027: Your mehndi\nSaturday 12 June 2027: the wedding");
  assert.equal(personalText("Hello Hatheli,", { kinds: ["Our names"], details: "Aman, with one n", where: "The fingers", wedding: "2027-06-12" }),
    "Hello Hatheli, I'd like something personal hidden in my bridal mehndi. What: Our names. Details: Aman, with one n. Where: The fingers. Our wedding is Saturday 12 June 2027. I'll send reference photos here.");
});

test("the NHS line on black henna is sourced, linked and dated", () => {
  assert.match(NHS_PPD.text, /PPD/);
  assert.equal(NHS_PPD.url, "https://www.nhs.uk/conditions/hair-dye-reactions/");
  assert.match(NHS_PPD.checked, /^\d{4}-\d{2}-\d{2}$/);
});
