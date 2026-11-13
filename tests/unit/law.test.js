import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { encodePack, decodePack, packProblem, packWhen, packIcs } from "../../src/kits/law/lib/pack.js";
import { leadFor, mailHref, partiesFrom, firstContactBody } from "../../src/kits/law/lib/route.js";
import { scenarioProblems, layout, flowsUpTo } from "../../src/kits/law/lib/succession.js";
import { SRA_SERVICES, isBadgeFrame, isSraNumber } from "../../src/kits/law/lib/sra.js";
import { HOME_PARTS, homeOrderProblem, onPagesProblem } from "../../src/kits/law/home.js";
import { validateSite } from "../../src/core/lib/config.js";
import { headersFile } from "../../src/core/lib/seo.js";
import { FEATURES, forKit } from "../../src/features/registry.js";
import { loadCatalog } from "../../scripts/lib/catalog.js";

const demo = JSON.parse(readFileSync("sites/demos/law/site.json", "utf8"));
const client = JSON.parse(readFileSync("tests/fixtures/sites/test-law-client/site.json", "utf8"));
const catalog = loadCatalog(process.cwd());
const errorsFor = (/** @type {(s: any) => void} */ change, base = demo) => { const s = structuredClone(base); change(s); return validateSite(s, { catalog }).join("\n"); };
const KNOWN = { people: ["hugo-ashdown", "eleanor-pryce"], ways: ["front", "mews"], bring: ["photo-id", "will"] };
const PACK = /** @type {const} */ ({ v: 1, d: "2026-11-12", t: "10:30", m: 60, p: "hugo-ashdown", e: "front", b: ["photo-id"], n: "Anna" });

test("the demo and the client fixture are valid", () => {
  assert.deepEqual(validateSite(demo, { catalog }), []);
  assert.deepEqual(validateSite(client, { catalog }), []);
});

test("a law firm can't switch on gift vouchers, the Instagram feed, reviews or the shared team page", () => {
  for (const id of ["vouchers", "work", "gallery", "reviews", "team"]) assert.ok(!forKit(/** @type {any} */ (FEATURES.find((f) => f.id === id)), "law"), id);
  assert.match(errorsFor((s) => { s.features.push("vouchers"); s.vouchers = {}; }), /"vouchers" is not available for kit "law"/);
  assert.ok(forKit(/** @type {any} */ (FEATURES.find((f) => f.id === "vouchers")), "bridal"), "other kits keep them");
});

test("regulation and complaints are always on: the SRA Transparency Rules require them", () => {
  assert.match(errorsFor((s) => { s.features = s.features.filter((/** @type {string} */ f) => f !== "complaints"); }), /"complaints" is required/);
  assert.match(errorsFor((s) => { s.features = s.features.filter((/** @type {string} */ f) => f !== "regulation"); }), /"regulation" is required/);
});

test("a demo can never carry a real SRA number, and a client must carry its real one and its badge", () => {
  assert.match(errorsFor((s) => { s.regulation.sraNumber = "612345"; }), /demo sites are fictional/);
  assert.match(errorsFor((s) => { s.people.items[0].sraId = "612345"; }), /people.items\[0\].sraId: demo sites are fictional/);
  assert.match(errorsFor((s) => { s.regulation.sraNumber = "000000"; }, client), /is the demo number/);
  assert.match(errorsFor((s) => { delete s.regulation.badgeFrame; }, client), /regulation.badgeFrame/);
  assert.match(errorsFor((s) => { s.regulation.badgeFrame = "https://evil.example/badge.html"; }, client), /regulation.badgeFrame/);
  assert.match(errorsFor((s) => { s.regulation.badgeFrame = "https://cdn.yoshki.com/iframe/1r.html"; }), /demo is fictional and has no SRA badge/);
  assert.ok(isBadgeFrame("https://cdn.yoshki.com/iframe/55845r.html"));
  assert.ok(!isSraNumber("12a45"));
});

test("only a solicitor has an SRA ID, and every solicitor shows one", () => {
  assert.match(errorsFor((s) => { delete s.people.items[0].sraId; }), /people.items\[0\].sraId/);
  assert.match(errorsFor((s) => { s.people.items[6].sraId = "000000"; }), /only solicitors have an SRA ID/);
});

test("offering a service rule 1 lists means publishing its price and service information", () => {
  assert.match(errorsFor((s) => { s.pricing.services = s.pricing.services.filter((/** @type {any} */ x) => x.service !== "probate"); }), /no price and service information for "probate"/);
  assert.match(errorsFor((s) => { s.features = s.features.filter((/** @type {string} */ f) => f !== "pricing"); }), /"pricing" is required/);
  assert.match(errorsFor((s) => { s.pricing.services[0].excludes = []; }), /isn't included/);
  assert.match(errorsFor((s) => { s.pricing.services[0].price = { from: 900, to: 400 }; }), /price.to/);
  assert.match(errorsFor((s) => { s.pricing.services[0].disbursements[0].note = undefined; }), /disbursements\[0\].note/);
  assert.match(errorsFor((s) => { s.pricing.services[0].team = ["nobody"]; }), /team/);
  assert.equal(Object.keys(SRA_SERVICES).length, 8);
});

test("matters need the client's approval and a public source, and never promise or boast of a result", () => {
  assert.match(errorsFor((s) => { s.matters.items[0].approved = false; }), /client has approved/);
  assert.match(errorsFor((s) => { s.matters.items[0].text = "We won the case for the trustees."; }), /not a result or a promise/);
  assert.match(errorsFor((s) => { s.matters.items[0].source = { name: "x", url: "http://x" }; }), /already public/);
});

test("misspelt settings are refused, not ignored", () => {
  assert.match(errorsFor((s) => { s.regulation.sraNo = "000000"; }), /regulation.sraNo: unknown setting/);
  assert.match(errorsFor((s) => { s.practice.items[0].leader = "x"; }), /practice.items\[0\].leader: unknown setting/);
  assert.match(errorsFor((s) => { s.meetingPack.example = "abc"; }), /meetingPack.example/);
});

test("a generated page can't take another page's name", () => {
  assert.match(errorsFor((s) => { s.practice.items[0].id = "pricing"; s.pricing.services.length; }), /"pricing" is the name of another page/);
  assert.match(errorsFor((s) => { s.insights.items[0].id = "family"; }), /already a page on this site/);
});

test("the meeting pack round-trips through its link and refuses anything it doesn't know", () => {
  const code = encodePack(PACK);
  assert.match(code, /^[\w-]+$/);
  assert.deepEqual(decodePack(`#${code}`, KNOWN), { ok: true, pack: PACK });
  assert.deepEqual(decodePack("", KNOWN), { ok: false, why: "empty" });
  assert.equal(decodePack("not-a-pack", KNOWN).ok, false);
  assert.equal(packProblem({ ...PACK, p: "stranger" }, KNOWN), "who you are meeting");
  assert.equal(packProblem({ ...PACK, d: "2026-02-30" }, KNOWN), "the date");
  assert.equal(packProblem({ ...PACK, b: ["bank-statement"] }, KNOWN), "what to bring");
  assert.equal(packProblem({ ...PACK, x: 1 }, KNOWN), 'unknown part "x"');
  assert.equal(packProblem({ ...PACK, n: "<script>" }, KNOWN), "the name");
  assert.equal(packWhen(PACK), "Thursday 12 November 2026, 10:30");
  assert.equal(validateSite(demo, { catalog }).length, 0, "the demo's example pack decodes against its own people");
});

test("the meeting's calendar file is in UTC, an hour long", () => {
  const ics = packIcs({ pack: PACK, who: "Hugo Ashdown", firm: "Calder Wyke", place: "4 Wykeham Yard, London", timeZone: "Europe/London", stamp: new Date("2026-10-29T12:00:00Z") });
  assert.match(ics, /DTSTART:20261112T103000Z/); // GMT in November
  assert.match(ics, /DTEND:20261112T113000Z/);
  assert.match(ics, /SUMMARY:Meeting with Hugo Ashdown\\, Calder Wyke/);
  const summer = packIcs({ pack: { ...PACK, d: "2027-06-10" }, who: "x", firm: "y", place: "z", timeZone: "Europe/London", stamp: new Date() });
  assert.match(summer, /DTSTART:20270610T093000Z/); // BST
});

test("the first message carries only who is involved and how to reply", () => {
  const people = [{ id: "a", name: "Ann", role: "Partner", email: "ann@x.co.uk" }];
  assert.equal(leadFor("wills", [{ id: "wills", name: "Wills", lead: "a" }], people)?.name, "Ann");
  assert.equal(leadFor("nope", [], people), null);
  assert.deepEqual(partiesFrom(" Smith Ltd,\n\nJo Bloggs; smith ltd \n"), ["Smith Ltd", "Jo Bloggs"]);
  const body = firstContactBody({ name: "Anna Lee", reach: "anna@example.com", area: "Family", parties: ["Jo Bloggs"], firm: "Calder Wyke" });
  assert.match(body, /please check you can act for me/);
  assert.match(body, /- Jo Bloggs/);
  assert.equal(body.split("\n").length, 9);
  assert.equal(mailHref("a@b.co", "Hi there", "x&y"), "mailto:a@b.co?subject=Hi%20there&body=x%26y");
});

test("the succession map is drawn down the generations and refuses figures and promises", () => {
  const sc = demo.succession.scenarios[0];
  assert.deepEqual(scenarioProblems(sc), []);
  const nodes = layout(sc, 720, 132);
  assert.ok(nodes.every((n) => n.x > 0 && n.x < 720));
  assert.equal(nodes.find((n) => n.id === "grandchildren")?.y, 66 + 2 * 132);
  assert.equal(flowsUpTo(sc, 0).length, 2);
  assert.match(scenarioProblems({ ...sc, steps: [{ gen: 1, title: "x", text: "y", flows: [["grandchildren", "you"]] }] }).join(), /not up/);
  assert.match(errorsFor((s) => { s.succession.scenarios[0].steps[0].text = "Saves 40% inheritance tax."; }), /no figures/);
  assert.match(errorsFor((s) => { s.succession.note = "Just an example."; }), /illustration/);
});

test("the SRA badge's host is allowed only for a firm that has a badge", () => {
  assert.match(headersFile(client, "production"), /frame-src https:\/\/cdn\.yoshki\.com/);
  assert.doesNotMatch(headersFile(demo, "preview"), /frame-src/);
});

test("the look's home order and moved sections are complete and allowed", () => {
  const look = catalog.looks.portland;
  assert.equal(homeOrderProblem(look.homeOrder), null);
  assert.equal(onPagesProblem(look.onPages), null);
  assert.match(String(homeOrderProblem(Object.keys(HOME_PARTS).slice(1))), /leaves out/);
  assert.match(String(onPagesProblem({ "people-page": ["visit"] })), /only people, photo-band/);
});

// ---- second round: tools and showpieces
import { intestacy, FIXED_SUM } from "../../src/kits/law/lib/intestacy.js";
import { estimate, bounds, vat } from "../../src/kits/law/lib/estimate.js";
import { cleanMatterCode, matterFromCsv, addDaysYmd, longDate, remindersIcs, hoursIn } from "../../src/kits/law/lib/matter.js";
import { wallTimeToUtc } from "../../src/core/lib/hours.js";

test("intestacy follows the rules of England and Wales", () => {
  assert.equal(intestacy({ spouse: true }).shares[0].gets, "Everything.");
  const both = intestacy({ spouse: true, children: true });
  assert.match(both.shares[0].gets, /first £322,000 and half/);
  assert.match(both.shares[1].gets, /other half/);
  assert.equal(FIXED_SUM, 322000);
  assert.equal(intestacy({ children: true }).shares[0].gets.startsWith("Everything"), true);
  assert.match(intestacy({ grandchildrenOfDeadChild: true }).shares[0].who, /children of your child who has died/);
  assert.equal(intestacy({ parents: true, siblings: true }).shares[0].who, "Your parents");
  assert.match(intestacy({ halfSiblings: true, grandparents: true }).shares[0].who, /half-brothers/);
  assert.equal(intestacy({}).shares[0].who, "The Crown");
  assert.match(intestacy({ partner: true }).notes.join(), /unmarried partner inherits nothing/);
  assert.equal(intestacy({ partner: true }).shares[0].who, "The Crown", "a partner alone inherits nothing");
});

test("the estimator stays inside the published range", () => {
  const qs = demo.estimator.questions;
  assert.deepEqual(estimate(3500, qs, {}), { low: 3500, high: 3500 });
  assert.deepEqual(estimate(3500, qs, { property: 1, tax: 1 }), { low: 4750, high: 6000 });
  assert.deepEqual(bounds(3500, qs), { min: 3500, max: 9000 });
  assert.equal(vat(3500), 4200);
  assert.match(errorsFor((s) => { s.estimator.questions[0].options[2].high = 3000; }), /may never go outside it/);
  assert.match(errorsFor((s) => { s.estimator.service = "licensing"; }), /estimator.service/);
});

test("your matter by code: random codes only, fails closed", () => {
  const csv = "code,stage,updated_at\nCW7K2QX9,valuing,2026-10-28 10:00\nAAAA1111,nonsense,2026-10-28 10:00\n";
  const stages = ["instructed", "gathering", "valuing"];
  const now = Date.parse("2026-10-29T10:00:00Z");
  assert.equal(cleanMatterCode("cw7k-2qx9"), "CW7K2QX9");
  assert.equal(cleanMatterCode("ABC123"), "", "too short to be safe");
  assert.deepEqual(matterFromCsv(csv, "CW7K2QX9", stages, now, 14, "Europe/London").ok, true);
  assert.equal(/** @type {any} */ (matterFromCsv(csv, "CW7K2QX9", stages, now, 14, "Europe/London")).stage, 2);
  assert.deepEqual(matterFromCsv(csv, "ZZZZ9999", stages, now, 14, "Europe/London"), { ok: false, reason: "unknown" });
  assert.deepEqual(matterFromCsv(csv, "AAAA1111", stages, now, 14, "Europe/London"), { ok: false, reason: "unreadable" });
  assert.deepEqual(matterFromCsv(csv, "CW7K2QX9", stages, now + 30 * 86_400_000, 14, "Europe/London"), { ok: false, reason: "stale" });
  assert.deepEqual(matterFromCsv("name,stage\nx,y", "CW7K2QX9", stages, now, 14, "Europe/London"), { ok: false, reason: "unreadable" });
  assert.match(errorsFor(() => {}, { ...client, matterCode: demo.matterCode }), /matterCode.source: simulated data is only allowed on demo sites/);
});

test("reminders and dates: all-day events, UK words, the firm's hours in another zone", () => {
  assert.equal(addDaysYmd("2026-12-30", 3), "2027-01-02");
  assert.equal(longDate("2026-11-09"), "Monday 9 November 2026");
  const ics = remindersIcs([{ id: "r", date: "2026-11-09", title: "Register the death, then tell us" }], "Test", new Date("2026-11-01T00:00:00Z"));
  assert.match(ics, /DTSTART;VALUE=DATE:20261109/);
  assert.match(ics, /DTEND;VALUE=DATE:20261110/);
  assert.match(ics, /SUMMARY:Register the death\\, then tell us/);
  assert.equal(hoursIn([["09:00", "18:00"]], "2026-11-03", "Europe/London", "Asia/Hong_Kong", wallTimeToUtc), "17:00–02:00 (next day)");
  assert.equal(hoursIn([["09:00", "18:00"]], "2026-07-07", "Europe/London", "America/New_York", wallTimeToUtc), "04:00–13:00");
});

test("the new tools' settings are checked", () => {
  assert.match(errorsFor((s) => { s.bereavement.steps[0].link.url = "https://example.com"; }), /on gov.uk/);
  assert.match(errorsFor((s) => { s.yourHours.zones[0].zone = "Mars/Olympus"; }), /IANA time zone/);
  assert.match(errorsFor((s) => { s.willReminder.practice = "nope"; }), /willReminder.practice/);
  assert.match(errorsFor((s) => { s.matterCode.example = "short"; }), /matterCode.example/);
  assert.match(errorsFor((s) => { s.matterSteps.matters[0].practice = "nope"; }), /matterSteps.matters\[0\].practice/);
  assert.match(errorsFor((s) => { s.glossary.terms = s.glossary.terms.slice(0, 2); }), /at least three/);
  assert.match(errorsFor((s) => { s.insights.items[0].photo = { src: "x.webp" }; }), /insights.items\[0\].photo/);
});

test("audit Y-02 to Y-07: no extra columns, no figures anywhere in the map, a dated fixed sum, steps in day order", () => {
  const stages = ["instructed", "gathering", "valuing"], now = Date.parse("2026-10-29T10:00:00Z");
  assert.deepEqual(matterFromCsv("code,stage,updated_at,client\nCW7K2QX9,valuing,2026-10-28 10:00,Mrs Anna Brook\n", "CW7K2QX9", stages, now, 14, "Europe/London"), { ok: false, reason: "unreadable" });
  assert.deepEqual(matterFromCsv("code,stage,updated_at\nCW7K2QX9,valuing,2026-10-28 10:00,Anna Brook\n", "CW7K2QX9", stages, now, 14, "Europe/London"), { ok: false, reason: "unreadable" });
  assert.equal(matterFromCsv("code,stage,updated_at,client\nCW7K2QX9,valuing,2026-10-28 10:00,\n", "CW7K2QX9", stages, now, 14, "Europe/London").ok, true, "an empty extra column is fine");
  assert.match(errorsFor((s) => { s.succession.scenarios[0].nodes[2].label = "A £325,000 nil-rate band trust"; }), /nodes\[2\].label: no figures/);
  assert.match(errorsFor((s) => { s.succession.intro = "Save 40% inheritance tax."; }), /succession.intro: no figures/);
  assert.match(intestacy({ spouse: true, children: true }).notes.join(), /deaths on or after 26 July 2023/);
  assert.match(errorsFor((s) => { [s.bereavement.steps[1], s.bereavement.steps[2]] = [s.bereavement.steps[2], s.bereavement.steps[1]]; }), /order the steps by their reminder day/);
});
