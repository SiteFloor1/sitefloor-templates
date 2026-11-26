// Hol kit (holiday-let and Airbnb management): the estimate worked only from the company's own figures, with own
// weeks taken off and London held to 90 nights; published figures refused when they can't be right; the sample
// statement's sums; the changeover's times; the rules dated, linked to official pages and going stale after six
// months; the booked-stays sheet failing closed; the guidebook code; and what a site must carry (the fee with VAT,
// guest totals, no invented owner reviews on a demo).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validateSite } from "../../src/core/lib/config.js";
import { loadCatalog } from "../../scripts/lib/catalog.js";
import { estimate, figuresProblems, LONDON_NIGHTS } from "../../src/kits/hol/lib/estimate.js";
import { pounds, feeOn } from "../../src/kits/hol/lib/money.js";
import { REGIONS, rulesState, rulesProblems } from "../../src/kits/hol/lib/rules.js";
import { staysFromCsv, isStale, freeRuns, runText, isBooked } from "../../src/kits/hol/lib/calendar.js";
import { reviewText, statementProblems, turnoverProblems, turnoverHours, codeHash, tidyCode } from "../../src/kits/hol/lib/owners.js";
import { HOME_PARTS, homeOrderProblem } from "../../src/kits/hol/home.js";
import { pageData, csp } from "../../src/kits/hol/kit.js";
import { demoStaysCsv } from "../../src/demo/hol-calendar-provider.js";

const demo = JSON.parse(readFileSync("sites/demos/holiday-lets/site.json", "utf8"));
const client = JSON.parse(readFileSync("tests/fixtures/sites/test-hol-client/site.json", "utf8"));
const catalog = loadCatalog(process.cwd());
const errorsFor = (/** @type {(s: any) => void} */ change, base = demo) => { const s = structuredClone(base); change(s); return validateSite(s, { catalog }).join("\n"); };
const FIG = { year: 2025, percent: 20, sizes: [{ beds: 3, night: 450, nights: 145, homes: 8, lowest: 37100, highest: 64700 }] };

test("the demo and the client fixture are valid", () => {
  assert.deepEqual(validateSite(demo, { catalog }), []);
  assert.deepEqual(validateSite(client, { catalog }), []);
});

test("the estimate: guests pay × nights, less the fee with VAT, with its basis and range", () => {
  const e = estimate(FIG, 3, 0);
  assert.ok(e);
  assert.equal(e.guests, 65250); assert.equal(e.fee, 13050); assert.equal(e.toYou, 52200); assert.equal(e.nights, 145);
  assert.match(e.basis, /^Our estimate, not a promise, from what our 8 three-bedroom homes earned in 2025\. The lowest paid its owner £37,100, the highest £64,700\.$/);
  assert.equal(estimate(FIG, 2, 0), null, "no published figures for that size: no estimate");
});

test("own weeks come off at the same rate as any other week; London stops at 90 nights unless permitted", () => {
  const two = estimate(FIG, 3, 2);
  assert.equal(two?.nights, Math.round(145 - 14 * (145 / 365)));
  assert.match(two?.basis ?? "", /less 2 weeks of your own stays/);
  const london = estimate({ ...FIG, london: true }, 3, 0);
  assert.equal(london?.nights, LONDON_NIGHTS); assert.equal(london?.capped, true); assert.match(london?.basis ?? "", /held to London's 90 nights/);
  assert.equal(estimate({ ...FIG, london: true }, 3, 0, { permission: true })?.nights, 145);
});

test("published figures that can't be right are refused", () => {
  assert.deepEqual(figuresProblems(FIG), []);
  assert.match(figuresProblems(undefined).join(), /without them the estimate is left off/);
  assert.match(figuresProblems({ ...FIG, sizes: [{ ...FIG.sizes[0], nights: 400 }] }).join(), /365 nights/);
  assert.match(figuresProblems({ ...FIG, sizes: [{ ...FIG.sizes[0], homes: 1 }] }).join(), /at least 3 homes/);
  assert.match(figuresProblems({ ...FIG, sizes: [{ ...FIG.sizes[0], lowest: 70000 }] }).join(), /lowest is above highest/);
  assert.match(figuresProblems({ ...FIG, sizes: [FIG.sizes[0], FIG.sizes[0]] }).join(), /listed twice/);
});

test("money: whole pounds with commas, pence only when there are any", () => {
  assert.equal(pounds(52200), "£52,200"); assert.equal(pounds(18.5), "£18.50"); assert.equal(pounds(-18), "−£18");
  assert.equal(feeOn(10000, 20), 2000);
});

test("every rule links to an official page with the date it was checked, and goes stale after six months", () => {
  assert.deepEqual(rulesProblems(), []);
  assert.deepEqual(REGIONS.map((r) => r.id), ["england", "london", "scotland", "wales"]);
  const r = REGIONS[0].rules[0];
  assert.equal(rulesState({ ...r, checked: "2026-11-26" }, "2027-05-26"), "current");
  assert.equal(rulesState({ ...r, checked: "2026-11-26" }, "2027-05-27"), "check");
  assert.match(REGIONS.find((x) => x.id === "london")?.rules[0].text ?? "", /90 nights a year without planning permission/);
});

test("the booked-stays sheet: rows read, newest update kept, stale or empty fails closed", () => {
  const csv = "home,from,to,updated_at\nglass,2026-12-01,2026-12-05,2026-11-26T08:40:00Z\nglass,bad,2026-12-09,2026-11-26T08:40:00Z\nglass,2026-12-10,2026-12-08,2026-11-25T08:40:00Z";
  const r = staysFromCsv(csv);
  assert.equal(r.stays.length, 1);
  assert.equal(r.updated, Date.parse("2026-11-26T08:40:00Z"));
  assert.equal(isStale(r.updated, Date.parse("2026-11-27T20:00:00Z"), 36), false);
  assert.equal(isStale(r.updated, Date.parse("2026-11-27T20:41:00Z"), 36), true);
  assert.equal(isStale(staysFromCsv("nothing,here").updated, Date.now()), true);
  assert.equal(isBooked(r.stays, "glass", "2026-12-04"), true);
  assert.equal(isBooked(r.stays, "glass", "2026-12-05"), false, "the leaving day is free for the next guest");
});

test("free runs: three nights or more, the leaving day free, worded as dates", () => {
  const stays = [{ home: "a", from: "2026-12-01", to: "2026-12-05" }, { home: "a", from: "2026-12-07", to: "2026-12-20" }];
  const runs = freeRuns(stays, "a", "2026-11-28", { weeks: 4 });
  assert.deepEqual(runs.map((x) => [x.from, x.to, x.nights]), [["2026-11-28", "2026-12-01", 3], ["2026-12-20", "2026-12-26", 6]]);
  assert.equal(runText(runs[0]), "28 Nov to 1 Dec");
  assert.equal(runText({ from: "2026-12-13", to: "2026-12-20" }), "13 to 20 Dec");
});

test("the demo sheet is fresh in the morning and three days old with #stale", () => {
  const now = Date.parse("2026-11-26T10:00:00Z");
  const fresh = staysFromCsv(demoStaysCsv(now, "Europe/London"));
  assert.equal(isStale(fresh.updated, now), false);
  assert.ok(fresh.stays.length > 10);
  assert.equal(isStale(staysFromCsv(demoStaysCsv(now, "Europe/London", true)).updated, now), true);
});

test("the review request is one message in the owner's words", () => {
  assert.equal(reviewText("Hello Tressa.", { where: "TR2", beds: "3", now: "Not let yet", note: " " }), "Hello Tressa.\nWhere: TR2\nBedrooms: 3\nHow it's let now: Not let yet");
});

test("the sample statement must add up; the changeover's times run in order", () => {
  assert.deepEqual(statementProblems(demo.statement, demo.fees.percent), []);
  assert.match(statementProblems({ ...demo.statement, paid: 7300 }, 20).join(), /is £7,278, not £7,300/);
  assert.deepEqual(turnoverProblems(demo.turnover.steps), []);
  assert.equal(turnoverHours(demo.turnover.steps), 6);
  assert.match(turnoverProblems([{ time: "10:00" }, { time: "09:00" }, { time: "25:00" }]).join(), /after the step before.*a time like 10:30/);
});

test("the guidebook code is tidied and hashed, never carried as the code", () => {
  assert.equal(tidyCode(" glass-7 "), "GLASS7");
  assert.equal(codeHash("glass 7"), codeHash("GLASS7"));
  assert.notEqual(codeHash("GLASS7"), codeHash("GLASS8"));
  const data = JSON.stringify(pageData(demo));
  assert.ok(!data.includes("GLASS7"), "the page carries the hash, not the code");
  assert.equal(pageData(demo).guides.glasshouse, codeHash("GLASS7"));
});

test("a site must show the fee with VAT and the rules; guest prices are totals; the estimate needs published figures", () => {
  assert.match(errorsFor((s) => { s.features = s.features.filter((/** @type {string} */ f) => f !== "hol-fees"); }), /"hol-fees" is required/);
  assert.match(errorsFor((s) => { s.fees.vatIncluded = false; }), /fees\.vatIncluded: must be true/);
  assert.match(errorsFor((s) => { delete s.homes.items[0].stay; }), /homes\.items\[0\]\.stay: the guest's total/);
  assert.match(errorsFor((s) => { delete s.estimate; }), /estimate/);
  assert.match(errorsFor((s) => { s.estimate.percent = 18; }), /must match fees\.percent/);
  assert.match(errorsFor((s) => { s.statement.paid = 1; }), /statement/);
});

test("owner stories are client only, real and dated; a guidebook carries no codes", () => {
  assert.match(errorsFor((s) => { s.features.push("hol-stories"); s.stories = client.stories; }), /client only/);
  assert.match(errorsFor((s) => { s.stories.items[0].date = "last year"; }, client), /stories\.items\[0\]\.date/);
  assert.match(errorsFor((s) => { s.guides.items[0].wifi = "Password 48213907"; }), /not security/);
  assert.match(errorsFor((s) => { s.homes.calendar.source = "simulated"; }, client), /simulated stays are for demos/);
});

test("home order and page data", () => {
  assert.deepEqual(Object.keys(HOME_PARTS), ["hol-turnover", "hol-homes", "hol-fees", "hol-rules"]);
  assert.equal(homeOrderProblem(["hol-turnover"]), "homeOrder leaves out: hol-homes, hol-fees, hol-rules");
  assert.equal(pageData(demo).estimate.percent, 20);
  assert.deepEqual(csp(client), { sheets: true });
  assert.deepEqual(csp(demo), { sheets: false });
});
