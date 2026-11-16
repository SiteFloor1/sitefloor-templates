// Financial advisers kit (ifa): the fee arithmetic, the pension dates, the tracing list, the review reminder, and the
// settings checks that keep a site inside the FCA's rules.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validateSite } from "../../src/core/lib/config.js";
import { loadCatalog } from "../../scripts/lib/catalog.js";
import { statement, chargeOn, scheduleProblem, readAmount, money, chargeWords } from "../../src/kits/ifa/lib/fees.js";
import { milestones, fresh, CHECKED } from "../../src/kits/ifa/lib/milestones.js";
import { readEntries, tracingText, TRACING } from "../../src/kits/ifa/lib/tracing.js";
import { reviewIcs } from "../../src/kits/ifa/lib/year.js";
import { promises, isFrn, isIrn, isDemoNumber, isRegisterLink, OMBUDSMAN } from "../../src/kits/ifa/lib/fca.js";
import { homeOrderProblem } from "../../src/kits/ifa/home.js";

const demo = JSON.parse(readFileSync("sites/demos/ifa/site.json", "utf8"));
const client = JSON.parse(readFileSync("tests/fixtures/sites/test-ifa-client/site.json", "utf8"));
const catalog = loadCatalog(process.cwd());
const errorsFor = (/** @type {(s: any) => void} */ change, base = demo) => { const s = structuredClone(base); change(s); return validateSite(s, { catalog }).join("\n"); };
const NOW = Date.parse("2026-11-16T10:00:00Z");

test("the demo and the client fixture are valid", () => {
  assert.deepEqual(validateSite(demo, { catalog }), []);
  assert.deepEqual(validateSite(client, { catalog }), []);
});

test("fees: the demo's statement, a minimum, tiers, fixed fees and the limits", () => {
  const s = statement(250000, demo.fees.schedule);
  assert.ok(s.ok);
  assert.deepEqual([s.initial, s.ongoing, s.monthly, s.firstYear].map(money), ["£3,750.00", "£1,875.00", "£156.25", "£5,625.00"]);
  assert.equal(money(/** @type {any} */ (statement(50000, demo.fees.schedule)).initial), "£1,500.00", "the minimum applies");
  const tiers = { tiers: [{ upTo: 100000, rate: 1 }, { rate: 0.5 }] };
  assert.equal(chargeOn(tiers, 300000), 100000 + 100000, "1% of the first £100,000 and 0.5% of the next £200,000, in pence");
  assert.equal(chargeOn({ fixed: 950 }, 1), 95000);
  assert.deepEqual(statement(0, demo.fees.schedule), { ok: false, why: "amount" });
  assert.deepEqual(statement(10000, { ...demo.fees.schedule, from: 50000 }), { ok: false, why: "below" });
  assert.deepEqual(statement(1000, { initial: { rate: -1 }, ongoing: { rate: 1 } }), { ok: false, why: "schedule" });
  assert.ok(scheduleProblem({ initial: { rate: 1.5, fixed: 10 }, ongoing: { rate: 1 } }));
  assert.equal(readAmount("£250,000"), 250000);
  assert.equal(chargeWords({ rate: 1.5, min: 1500 }), "1.5% (at least £1,500)");
});

test("pension dates: the two clear groups, change-over years and stale rules fail closed", () => {
  const r = milestones(1980, NOW);
  assert.ok(r.ok);
  assert.deepEqual(/** @type {any} */ (r).items.map((/** @type {any} */ m) => [m.what, m.age, m.year]), [["pension", 57, 2037], ["state", 68, 2048]]);
  assert.deepEqual(/** @type {any} */ (milestones(1965, NOW)).items.map((/** @type {any} */ m) => m.year), [2020, 2032]);
  for (const y of [1960, 1961, 1972, 1977, 1978]) assert.deepEqual(milestones(y, NOW), { ok: false, why: "changeover" }, String(y));
  assert.deepEqual(milestones(1940, NOW), { ok: false, why: "year" });
  assert.deepEqual(milestones(2020, NOW), { ok: false, why: "year" });
  const late = Date.parse(`${CHECKED}T00:00:00Z`) + 181 * 86_400_000;
  assert.equal(fresh(late), false);
  assert.deepEqual(milestones(1980, late), { ok: false, why: "stale" });
});

test("tracing list: rows cleaned, nothing invented, the free service and the questions", () => {
  const e = readEntries([{ employer: "  Acme Ltd ", from: "1998", to: "nineteen", kind: "personal" }, { employer: "" }]);
  assert.deepEqual(e, [{ employer: "Acme Ltd", from: "1998", to: "", kind: "personal" }]);
  const t = tracingText(e, "Thursby");
  assert.match(t, /1\. Acme Ltd \(1998–\?\), personal pension/);
  assert.ok(t.includes(TRACING));
  assert.match(t, /General information, not advice\.$/);
  assert.equal(tracingText([], "Thursby"), "");
});

test("review reminder: a yearly all-day event in the month chosen", () => {
  const ics = reviewIcs({ firm: "Thursby", month: 4, today: new Date("2026-11-16T10:00:00Z"), note: "Your review with Thursby" });
  assert.match(ics, /BEGIN:VEVENT/);
  assert.match(ics, /RRULE:FREQ=YEARLY;BYMONTH=4;BYDAY=MO,TU,WE,TH,FR;BYSETPOS=1/, "the first weekday of April every year");
  assert.match(ics, /DTSTART;VALUE=DATE:20270401/);
});

test("FCA lines: promises are refused wherever the firm writes them; a 'not guaranteed' isn't a promise", () => {
  for (const p of ["Guaranteed income for life", "Returns of 8% expected", "Our funds outperform", "projected growth", "could grow to £1m", "7% a year"]) assert.ok(promises(p), p);
  for (const p of ["Pensions are not guaranteed", "Nothing is risk-free", "Investments can fall as well as rise"]) assert.ok(!promises(p), p);
  assert.match(errorsFor((s) => { s.hero.intro = "Guaranteed returns for retirement"; }), /hero\.intro: promises a return/);
  assert.match(errorsFor((s) => { s.journal.items[0].body[0] = "Our clients beat inflation."; }), /journal\.items\[0\]\.body\[0\]: promises/);
});

test("FCA numbers: demos use noughts and the register search; clients their own entry", () => {
  assert.ok(isFrn("000000") && isIrn("ABC01234") && isDemoNumber("HXA00000") && !isDemoNumber("912345"));
  assert.ok(isRegisterLink("https://register.fca.org.uk/s/firm?id=1") && !isRegisterLink("https://fca.org.uk/"));
  assert.match(errorsFor((s) => { s.regulation.frn = "912345"; }), /regulation\.frn: demo sites are fictional/);
  assert.match(errorsFor((s) => { s.regulation.frn = "000000"; }, client), /regulation\.frn: is a demo number/);
  assert.match(errorsFor((s) => { s.regulation.registerUrl = "https://register.fca.org.uk/"; }, client), /registerUrl: client sites link to their own entry/);
  assert.equal(OMBUDSMAN.phone, "0800 023 4567");
});

test("required pages can't be switched off, and restricted advice says what it's restricted to", () => {
  for (const id of ["ifa-fca", "ifa-independence", "ifa-check"]) assert.match(errorsFor((s) => { s.features = s.features.filter((/** @type {string} */ f) => f !== id); }), new RegExp(`"${id}" is required`));
  assert.match(errorsFor((s) => { delete s.independence.restrictedTo; }, client), /independence\.restrictedTo/);
  assert.match(errorsFor((s) => { s.fees.other = "Nothing else to pay."; }), /fees\.other/);
});

test("topics and guides: dated, sourced, and named apart from the kit's pages", () => {
  assert.match(errorsFor((s) => { s.topics.items[0].checked = "16/11/2026"; }), /topics\.items\[0\]\.checked/);
  assert.match(errorsFor((s) => { s.topics.items[0].sources = []; }), /topics\.items\[0\]\.sources/);
  assert.match(errorsFor((s) => { s.guides.items[0].id = "fees"; }), /"fees" is the name of another page/);
  assert.match(errorsFor((s) => { s.journal.items[0].approvedOn = "2026-12-01"; }), /approvedOn/);
  assert.match(errorsFor((s) => { s.milestones.topic = "nope"; }), /milestones\.topic/);
});

test("home order: only the kit's home parts, each once", () => {
  assert.equal(homeOrderProblem(["ifa-services", "ifa-advisers", "questions"]), null);
  assert.ok(homeOrderProblem(["ifa-services", "ifa-services"]));
  assert.ok(homeOrderProblem(["gallery"]));
});
