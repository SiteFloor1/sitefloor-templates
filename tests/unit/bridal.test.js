import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { isYmd, ymdOf, addDaysYmd, daysBetween, ukDate, orderBy, diaryDates, diaryStatus, diaryIcs } from "../../src/core/lib/diary.js";
import { filterGowns, liveChoices, shortlistHash, shortlistFromHash, appointmentText, tryGownText, shortlistText } from "../../src/kits/bridal/lib/gowns.js";
import { HOME_PARTS, homeOrderProblem, onPagesProblem } from "../../src/kits/bridal/home.js";
import { validateSite } from "../../src/core/lib/config.js";
import { loadCatalog } from "../../scripts/lib/catalog.js";

const demo = JSON.parse(readFileSync("sites/demos/bridal/site.json", "utf8"));
const client = JSON.parse(readFileSync("tests/fixtures/sites/test-bridal-client/site.json", "utf8"));
const catalog = loadCatalog(process.cwd());
const errorsFor = (/** @type {(s: any) => void} */ change, base = demo) => { const s = structuredClone(base); change(s); return validateSite(s, { catalog }).join("\n"); };
const STEPS = [
  { id: "order", label: "Order your gown", weeksBefore: 40 },
  { id: "first", label: "First fitting", weeksBefore: 8 },
  { id: "final", label: "Final fitting", weeksBefore: 2 },
];

test("the demo and the client fixture are valid", () => {
  assert.deepEqual(validateSite(demo, { catalog }), []);
  assert.deepEqual(validateSite(client, { catalog }), []);
});

test("dates are real calendar days; impossible days are refused", () => {
  assert.ok(isYmd("2028-02-29"));
  assert.ok(!isYmd("2027-02-29"));
  assert.equal(ymdOf(2027, 2, 30), "");
  assert.equal(ymdOf(2027, 9, 18), "2027-09-18");
});

test("day arithmetic doesn't move across the clocks changing", () => {
  assert.equal(addDaysYmd("2027-03-29", -1), "2027-03-28"); // the Sunday the clocks go forward
  assert.equal(addDaysYmd("2026-10-26", -1), "2026-10-25"); // and back
  assert.equal(daysBetween("2026-10-29", "2026-11-05"), 7);
});

test("dates read in UK order whatever the machine's language", () => {
  assert.equal(ukDate("2027-09-18"), "Saturday 18 September 2027");
  assert.equal(ukDate("2027-09-18", false), "18 September 2027");
});

test("the diary works back from the wedding by the salon's own weeks, earliest first", () => {
  const d = diaryDates("2027-09-18", STEPS, "2026-10-29");
  assert.deepEqual(d.map((x) => [x.id, x.date]), [["order", "2026-12-12"], ["first", "2027-07-24"], ["final", "2027-09-04"]]);
  assert.ok(d.every((x) => !x.past));
  assert.equal(orderBy("2027-09-18", 40), "2026-12-12");
});

test("a late bride is told the order date has passed; a past wedding is not a diary", () => {
  const late = diaryStatus("2026-12-12", "2026-10-29", 40);
  assert.equal(late.late, true);
  assert.equal(late.weeks, 6);
  assert.equal(diaryDates("2026-12-12", STEPS, "2026-10-29")[0].past, true);
  assert.equal(diaryStatus("2026-10-01", "2026-10-29", 40).passed, true);
  assert.equal(diaryStatus("2027-09-18", "2026-10-29", 40).late, false);
  assert.equal(diaryStatus("2026-10-29", "2026-10-29", 0).days, 0);
});

test("the calendar file has all-day events for the steps still to come and the wedding", () => {
  const ics = diaryIcs({ wedding: "2027-09-18", dates: diaryDates("2027-09-18", STEPS, "2027-08-01"), salon: "Wexley", place: "Wexley, 6 Vane Mews, London", stamp: "20261029T120000Z" });
  assert.match(ics, /^BEGIN:VCALENDAR\r\n/);
  assert.ok(ics.endsWith("END:VCALENDAR\r\n"));
  assert.ok(!ics.includes("DTSTART;VALUE=DATE:20261212"), "a step already past is left out");
  assert.ok(ics.includes("DTSTART;VALUE=DATE:20270904") && ics.includes("DTEND;VALUE=DATE:20270905"));
  assert.ok(ics.includes("SUMMARY:The wedding"));
  assert.ok(ics.includes("LOCATION:Wexley\\, 6 Vane Mews\\, London"), "commas escaped");
  assert.ok(!/T\d{6}(?!Z)/.test(ics.replace("DTSTAMP:20261029T120000Z", "")), "no floating times");
});

const GOWNS = demo.gowns.items.map((/** @type {any} */ g) => ({ id: g.id, name: g.name, house: g.house, silhouette: g.silhouette, neckline: g.neckline, sleeve: g.sleeve }));

test("the finder narrows by every choice together and never offers an empty one", () => {
  assert.deepEqual(filterGowns(GOWNS, { sleeve: "long" }).map((g) => g.id), ["odile", "helene", "marguerite", "lior"]);
  assert.deepEqual(filterGowns(GOWNS, { silhouette: "ballgown", house: "studio-morrell" }).map((g) => g.id), ["celeste", "delphine"]);
  assert.equal(filterGowns(GOWNS, {}).length, GOWNS.length);
  const live = liveChoices(GOWNS, { sleeve: "long" }, "silhouette");
  assert.deepEqual([...live].sort(), ["a-line", "column", "fit-and-flare", "two-piece"]);
});

test("the shortlist travels in a link, keeping only this salon's gowns, once each", () => {
  assert.equal(shortlistHash(["ottilie", "iris"]), "#shortlist=ottilie.iris");
  assert.equal(shortlistHash([]), "");
  assert.deepEqual(shortlistFromHash("#shortlist=iris.nope.iris.ottilie", ["ottilie", "iris"]), ["iris", "ottilie"]);
  assert.deepEqual(shortlistFromHash("#studio-morrell", ["ottilie"]), []);
});

test("the WhatsApp messages say who, when and what, and never that anything is booked", () => {
  const t = appointmentText({ opening: "Hello Wexley.", wedding: "Saturday 18 September 2027", party: 3, when: "A Saturday", houses: ["Studio Morrell"], gowns: ["Ottilie"], notes: "Size 12" });
  assert.match(t, /Wedding: Saturday 18 September 2027/);
  assert.match(t, /Coming: me and 2 guests/);
  assert.match(t, /Designers I'd like to see: Studio Morrell/);
  assert.match(t, /Gowns I'd like to try: Ottilie/);
  assert.equal(appointmentText({ opening: "Hi", party: 1 }), "Hi\n\nWedding: date not set yet\nComing: just me");
  assert.match(appointmentText({ opening: "Hi", party: 2 }), /me and 1 guest$/m);
  for (const s of [t, tryGownText("Hi", { name: "Iris", houseName: "Vale & Oriel" }), shortlistText("Hi", [{ name: "Iris", houseName: "Vale & Oriel" }])]) assert.doesNotMatch(s, /booked|confirmed|reserved/i);
});

test("a look's home order must list every section exactly once", () => {
  assert.equal(homeOrderProblem(Object.keys(HOME_PARTS)), null);
  assert.match(String(homeOrderProblem(Object.keys(HOME_PARTS).slice(1))), /leaves out/);
  assert.equal(homeOrderProblem(catalog.looks.dove.homeOrder), null);
});

test("a look may move only the sections each page can show", () => {
  assert.equal(onPagesProblem(catalog.looks.dove.onPages), null);
  assert.match(String(onPagesProblem({ "gift-page": ["appointment"] })), /only vouchers, page-links/);
  assert.match(String(onPagesProblem({ "nowhere": [] })), /can't hold/);
});

test("the demo's price range runs to the couture house, and three gowns lead the home page", () => {
  const prices = demo.gowns.items.map((/** @type {any} */ g) => g.price).filter(Boolean);
  assert.equal(Math.max(...prices), 28000);
  assert.equal(demo.gowns.items.filter((/** @type {any} */ g) => g.editorial).length, 3);
});

test("validation catches what would mislead a bride", () => {
  assert.match(errorsFor((s) => { s.gowns.items[0].house = "nobody"; }), /gowns.items\[0\].house/);
  assert.match(errorsFor((s) => { s.gowns.items[0].neckline = "plunging"; }), /neckline/);
  assert.match(errorsFor((s) => { s.gowns.items[0].price = 0; }), /price/);
  assert.match(errorsFor((s) => { s.diary.orderStep = "nothing"; }), /diary.orderStep/);
  assert.match(errorsFor((s) => { s.diary.steps[0].weeksBefore = 200; }), /weeksBefore/);
  assert.match(errorsFor((s) => { s.trunkShows.items[0].to = "2027-01-01"; }), /ends before it starts/);
  assert.match(errorsFor((s) => { s.trunkShows.formUrl = "https://example.com/list"; }), /Google Form/);
  assert.match(errorsFor((s) => { s.appointment.feeLink = "https://pay.example.com"; }), /Stripe/);
  assert.match(errorsFor((s) => { s.appointment.facts = []; }), /appointment.facts/);
});

test("a misspelt setting is refused, not silently ignored", () => {
  assert.match(errorsFor((s) => { s.appointment.feelink = s.appointment.feeLink; }), /appointment\.feelink: unknown setting/);
  assert.match(errorsFor((s) => { s.diary.steps[0].weeksbefore = 40; }), /diary\.steps\[0\]\.weeksbefore: unknown setting/);
  assert.match(errorsFor((s) => { s.gowns.items[0].colour = "ivory"; }), /gowns\.items\[0\]\.colour: unknown setting/);
  assert.match(errorsFor((s) => { s.trunkShows.items[0].venue = "upstairs"; }), /trunkShows\.items\[0\]\.venue: unknown setting/);
  assert.match(errorsFor((s) => { s.hero.mirror.centre.caption = "x"; }), /hero\.mirror\.centre\.caption: unknown setting/);
});

test("the fee link is a test link on a demo and a live link on a client site", () => {
  assert.match(errorsFor((s) => { s.appointment.feeLink = "https://buy.stripe.com/live123"; }), /demo sites must use a Stripe test-mode link/);
  assert.match(errorsFor((s) => { s.appointment.feeLink = "https://buy.stripe.com/test_abc"; }, client), /client sites need the salon's live link/);
  assert.equal(errorsFor((s) => { s.appointment.feeLink = "https://buy.stripe.com/abc123"; }, client), "");
});
