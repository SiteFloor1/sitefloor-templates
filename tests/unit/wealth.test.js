import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validateSite } from "../../src/core/lib/config.js";
import { FEATURES, forKit } from "../../src/features/registry.js";
import { loadCatalog } from "../../scripts/lib/catalog.js";
import { insightsFromCsv, holdReason, slugOf, isTicked } from "../../src/kits/wealth/lib/insights.js";
import { isFrn, isIrn, isDemoNumber, PROMISES, OMBUDSMAN } from "../../src/kits/wealth/lib/fca.js";
import { looksSensitive, meetingMessage, mailHref } from "../../src/kits/wealth/lib/meeting.js";
import { readMap, mapText, byGeneration } from "../../src/kits/wealth/lib/family-map.js";
import { officeNow, officeLine } from "../../src/kits/wealth/lib/offices.js";
import { HOME_PARTS, homeOrderProblem, onPagesProblem } from "../../src/kits/wealth/home.js";
import { csp, pageData } from "../../src/kits/wealth/kit.js";
import { eventsFromCsv, eventHold, eventIcs, replyHref } from "../../src/kits/wealth/lib/events.js";
import { approvalHold } from "../../src/kits/wealth/lib/approval.js";
import { SECTIONS, SOURCES } from "../../src/kits/wealth/lib/wishes.js";

const demo = JSON.parse(readFileSync("sites/demos/wealth/site.json", "utf8"));
const client = JSON.parse(readFileSync("tests/fixtures/sites/test-wealth-client/site.json", "utf8"));
const catalog = loadCatalog(process.cwd());
const errorsFor = (/** @type {(s: any) => void} */ change, base = demo) => { const s = structuredClone(base); change(s); return validateSite(s, { catalog }).join("\n"); };
const HEAD = "Title,Category,Date,Summary,Body,Author,Photo,Approved,Approved by,Approved on";
const row = (/** @type {Partial<Record<string, string>>} */ o = {}) => {
  const r = { title: "Planning a sale", category: "Business owners", date: "2026-10-01", summary: "A short note.", body: "One.\n\nTwo.", author: "Tom", photo: "coast", approved: "TRUE", by: "R. Hale", on: "2026-09-30", ...o };
  return [r.title, r.category, r.date, r.summary, `"${r.body}"`, r.author, r.photo, r.approved, r.by, r.on].join(",");
};

test("the demo and the client fixture are valid", () => {
  assert.deepEqual(validateSite(demo, { catalog }), []);
  assert.deepEqual(validateSite(client, { catalog }), []);
});

test("a wealth manager can't switch on reviews, galleries, vouchers or the shared team page", () => {
  for (const id of ["reviews", "gallery", "work", "vouchers", "team", "photo-band"]) assert.ok(!forKit(/** @type {any} */ (FEATURES.find((f) => f.id === id)), "wealth"), id);
  assert.match(errorsFor((s) => { s.features.push("reviews"); s.reviews = []; }), /"reviews" is not available for kit "wealth"/);
});

test("the FCA line and Is this really us? are always on", () => {
  assert.match(errorsFor((s) => { s.features = s.features.filter((/** @type {string} */ f) => f !== "fca"); }), /"fca" is required/);
  assert.match(errorsFor((s) => { s.features = s.features.filter((/** @type {string} */ f) => f !== "check"); }), /"check" is required/);
});

test("a demo never carries a real FCA number, and a client must carry its real one", () => {
  assert.match(errorsFor((s) => { s.regulation.frn = "612345"; }), /regulation.frn: demo sites are fictional/);
  assert.match(errorsFor((s) => { s.advisers.items[0].irn = "ABC01234"; }), /advisers.items\[0\].irn: demo sites are fictional/);
  assert.match(errorsFor((s) => { s.regulation.frn = "000000"; }, client), /is a demo number/);
  assert.match(errorsFor((s) => { s.regulation.frn = "12345"; }, client), /six or seven digits/);
  assert.ok(isFrn("1234567") && !isFrn("12345a"));
  assert.ok(isIrn("ABC01234") && !isIrn("AB012345") && isDemoNumber("HXL00000") && !isDemoNumber("HXL00001"));
});

test("nothing the firm writes may promise returns or performance (COBS 4.2)", () => {
  assert.match(errorsFor((s) => { s.help.items[1].line = "Portfolios that outperform the market."; }), /help.items\[1\].line: promises a return/);
  assert.match(errorsFor((s) => { s.situations.items[0].line = "Aim for 8% a year."; }), /promises a return/);
  assert.match(errorsFor((s) => { s.lifeEvents.items[0].timeline.steps[0].us = "Save £40,000"; }), /an illustration carries no figures/);
  for (const ok of ["We charge 20% VAT on planning fees", "Gifts to charity can reduce inheritance tax"]) assert.ok(!PROMISES.test(ok), ok);
  for (const bad of ["guaranteed income", "risk-free", "returns of 7%", "6% growth"]) assert.ok(PROMISES.test(bad), bad);
});

test("the capital-at-risk sentence can be reworded but never dropped", () => {
  assert.match(errorsFor((s) => { s.regulation.capitalAtRisk = "Investments are for the long term."; }), /must still say plainly that capital is at risk/);
  assert.equal(errorsFor((s) => { s.regulation.capitalAtRisk = "Your capital is at risk when you invest."; }), "");
});

test("the headline is eight words at most; the plain line says what the firm does", () => {
  assert.match(errorsFor((s) => { s.hero.title = "Wealth, looked after for families across many generations to come"; }), /eight words at most/);
  assert.match(errorsFor((s) => { delete s.hero.intro; }), /hero.intro/);
});

test("situations finish the sentence, link to real moments, and life-event links must exist", () => {
  assert.match(errorsFor((s) => { s.situations.items[0].label = "Selling a business"; }), /starts in lower case/);
  assert.match(errorsFor((s) => { s.situations.items[0].event = "sailing"; }), /"sailing" isn't one of the moments/);
  assert.match(errorsFor((s) => { s.lifeEvents.items[0].insights = ["no-such-note"]; }), /isn't one of the insights/);
  assert.match(errorsFor((s) => { s.lifeEvents.items[0].id = "insights"; s.situations.items[0].event = "insights"; s.help.items[2].event = "insights"; s.advisers.items[1].leads = []; }), /"insights" is the name of another page/);
});

test("insights: a sheet source needs its published CSV link; simulated data is for demos only", () => {
  assert.match(errorsFor((s) => { s.insights.csvUrl = "https://example.com/sheet.csv"; }, client), /Publish to web link/);
  assert.match(errorsFor((s) => { s.insights.source = "simulated"; s.insights.sample = HEAD; }, client), /"simulated" is for demos only/);
  assert.match(errorsFor((s) => { delete s.insights.items[0].approvedOn; }), /nothing shows without it/);
  assert.match(errorsFor((s) => { s.insights.items[0].photo = "harbour"; }), /one of the names in insights.photos/);
});

test("a sheet row shows only when compliance has ticked it, named the approver and dated it", () => {
  const today = "2026-11-04";
  assert.equal(holdReason({ approved: "", title: "x" }, today), "not approved");
  assert.equal(holdReason({ approved: "yes", "approved by": "", title: "x" }, today), "approved, but no name in Approved by");
  assert.equal(holdReason({ approved: "TRUE", "approved by": "R", "approved on": "04/11/2026" }, today), "approved, but Approved on isn't a date (YYYY-MM-DD)");
  assert.equal(holdReason({ approved: "TRUE", "approved by": "R", "approved on": "2026-12-01" }, today), "approval dated in the future");
  assert.ok(isTicked("✓") && isTicked(" yes ") && !isTicked("no") && !isTicked(""));
  const csv = [HEAD, row(), row({ title: "Draft", approved: "" }), row({ title: "Beat the market", summary: "Our funds outperform." }), row({ title: "Later", date: "2026-12-01" }), row({ title: "Older", date: "2026-09-01", photo: "harbour" })].join("\n");
  const r = insightsFromCsv(csv, { today, photos: ["coast", "river"] });
  assert.deepEqual(r.items.map((x) => x.title), ["Planning a sale", "Older"]);
  assert.deepEqual(r.held.map((h) => h.why), ["not approved", "promises a return or performance", "not published yet (dated in the future)"]);
  assert.deepEqual(r.items[0].body, ["One.", "Two."]);
  assert.equal(r.items[1].photo, "coast", "an unknown photo name uses the site's first insight photo");
  assert.throws(() => insightsFromCsv("Name,Date\nx,y", { today, photos: [] }), /Title and Approved/);
});

test("insight addresses are whole words, 40 characters at most, and the demo's sample sheet hides its drafts", () => {
  assert.equal(slugOf("Selling your business: what to sort out in the year before"), "selling-your-business-what-to-sort-out");
  assert.equal(slugOf("Talking to children about the family’s wealth"), "talking-to-children-about-the-familys");
  const r = insightsFromCsv(demo.insights.sample, { today: "2026-11-04", photos: Object.keys(demo.insights.photos) });
  assert.deepEqual(r.items.map((x) => x.id), demo.insights.items.map((/** @type {any} */ x) => x.id), "the sheet and the build agree");
  assert.equal(r.held.length, 3);
});

test("a meeting request asks nothing about money and refuses account, card or sort-code numbers", () => {
  assert.ok(looksSensitive("Account 12345678") && looksSensitive("sort code 20-00-00") && !looksSensitive("Tuesday after 4pm"));
  const ok = meetingMessage({ name: "Ann", reach: "+44 7911 123456", about: "selling a business", where: "By video", when: "Mornings", adviser: "Tom Ashworth" }, "Lyall Harrow");
  assert.ok(ok.ok);
  if (ok.ok) {
    assert.match(ok.body, /about selling a business/);
    assert.match(mailHref("a@b.co", ok), /^mailto:a@b\.co\?subject=First%20meeting/);
  }
  assert.deepEqual(meetingMessage({ name: "", reach: "x", about: "", where: "", when: "" }, "F"), { ok: false, field: "name", why: "Please give your name." });
  const bad = meetingMessage({ name: "Ann", reach: "ann@x.co", about: "", where: "", when: "my account is 12345678" }, "F");
  assert.equal(bad.ok, false);
});

test("the family map reads only what it expects and stays plain text", () => {
  assert.deepEqual(readMap("not json"), { v: 1, people: [], advisers: [] });
  const m = readMap({ v: 1, people: [{ name: "  Ann  ", gen: 9 }, { name: "" }], advisers: [{ role: "Wizard", name: "Bob" }] });
  assert.equal(m.people.length, 1);
  assert.equal(m.people[0].gen, 3, "an unknown generation is clamped");
  assert.equal(m.advisers[0].role, "Another adviser");
  assert.equal(byGeneration(m)[3].people[0].name, "Ann");
  assert.match(mapText(m, "Lyall Harrow"), /Grandchildren: Ann[\s\S]*Another adviser: Bob/);
});

test("an office's time now and when it next opens", () => {
  const hours = { timezone: "Europe/London", weekly: { mon: [["08:30", "18:00"]], tue: [["08:30", "18:00"]], wed: [], thu: [], fri: [], sat: [], sun: [] } };
  const open = officeNow(hours, new Date("2026-11-02T10:15:00Z")); // Monday
  assert.deepEqual([open.time, open.open, officeLine(open)], ["10:15", true, "Open now"]);
  assert.equal(officeLine(officeNow(hours, new Date("2026-11-02T07:00:00Z"))), "Closed. We open at 08:30");
  assert.equal(officeLine(officeNow(hours, new Date("2026-11-03T19:00:00Z"))), "Closed. We open on Monday at 08:30");
  assert.equal(officeNow({ ...hours, timezone: "Asia/Singapore" }, new Date("2026-11-02T10:15:00Z")).time, "18:15");
});

test("home sections, hosting and what the browser receives", () => {
  assert.equal(homeOrderProblem(Object.keys(HOME_PARTS)), null);
  assert.match(String(homeOrderProblem(["help"])), /leaves out/);
  assert.match(String(onPagesProblem({ "advisers-page": ["office"] })), /only advisers/);
  const data = pageData(client);
  assert.equal(data.insights.source, "sheet");
  assert.equal(data.insights.sample, undefined, "a client never receives demo rows");
  assert.equal(data.offices[1].hours.timezone, "Europe/Zurich");
  assert.equal(csp(client).sheets, true);
  assert.equal(csp(demo).sheets, false, "the demo's simulated sheet needs no network");
  assert.equal(OMBUDSMAN.weeks, 8);
});

test("an event shows only once compliance has approved it, and only while it is still to come", () => {
  const ok = { approved: "TRUE", "approved by": "R. Hale", "approved on": "2026-10-01", title: "Talk", date: "2026-11-20", start: "18:00", end: "19:00", place: "London", summary: "A talk." };
  assert.equal(approvalHold(ok, "2026-11-04"), null);
  assert.equal(eventHold(ok, "2026-11-04"), null);
  assert.match(eventHold({ ...ok, approved: "" }, "2026-11-04") ?? "", /approv/i);
  assert.match(eventHold({ ...ok, "approved on": "2026-12-01" }, "2026-11-04") ?? "", /./);
  assert.match(eventHold({ ...ok, date: "2026-11-01" }, "2026-11-04") ?? "", /./);
  assert.match(eventHold({ ...ok, end: "17:00" }, "2026-11-04") ?? "", /./);
  assert.match(eventHold({ ...ok, summary: "Returns guaranteed." }, "2026-11-04") ?? "", /./);
  const r = eventsFromCsv(demo.events.sample, "2026-11-04");
  assert.equal(r.items.length, 4);
  assert.equal(r.held.length, 3);
  assert.equal(r.items[0].approvedOn, "2026-10-28");
});

test("an event's calendar file is in UTC, and replies go to the firm's email or its own form", () => {
  const e = eventsFromCsv(demo.events.sample, "2026-11-04").items[0];
  const ics = eventIcs({ event: e, firm: "Lyall Harrow", timeZone: "Europe/London", stamp: new Date("2026-11-04T10:00:00Z") });
  assert.match(ics, /DTSTART:20261119T180000Z/);
  assert.match(ics, /DTEND:20261119T193000Z/);
  const summer = eventIcs({ event: { ...e, date: "2027-06-10" }, firm: "Lyall Harrow", timeZone: "Europe/London", stamp: new Date() });
  assert.match(summer, /DTSTART:20270610T170000Z/); // BST
  assert.match(replyHref(e, "events@firm.example"), /^mailto:events@firm\.example\?subject=/);
  assert.equal(replyHref({ ...e, reply: "https://forms.example/x" }, "events@firm.example"), "https://forms.example/x");
});

test("the documents checklist carries no figures, and needs a moment with documents", () => {
  assert.match(errorsFor((s) => { s.lifeEvents.items[0].documents[0].items.push("Keep £10,000 aside"); }), /no figures/);
  assert.match(errorsFor((s) => { for (const e of s.lifeEvents.items) delete e.documents; }), /documents/);
  assert.match(errorsFor((s) => { s.events.items.push({ id: "x", title: "T", kind: "Seminar", date: "2026-12-01", start: "18:00", end: "19:00", place: "London", summary: "S", approvedBy: "R" }); }), /approvedOn/);
  assert.match(errorsFor((s) => { s.advisers.items[0].book = "http://example.com"; }), /https/);
  assert.match(errorsFor((s) => { s.advisers.items[0].id = "events"; }), /another page/);
});

test("every section of the letter-of-wishes guide names a source that exists", () => {
  assert.ok(SECTIONS.length >= 4);
  for (const s of SECTIONS) for (const k of [s.from].flat()) assert.ok(SOURCES[k]?.url?.startsWith("https://"), `${s.title}: ${k}`);
});

test("no promise of returns anywhere in the settings, in any common wording, but a warning that nothing is guaranteed is fine", () => {
  const wordings = ["Guaranteed income for life", "Consistent outperformance", "An inflation-beating portfolio", "We beat the FTSE 100", "We beat our benchmark", "You will never lose money", "No risk to your capital", "Top-decile performance", "Top quartile returns", "Returns of 8% a year"];
  for (const w of wordings) assert.match(errorsFor((s) => { s.help.intro = w; }), /promises a return/, w);
  assert.match(errorsFor((s) => { s.pages[0].blocks[0].body = "We beat the market every year."; }), /pages\[0\].*promises a return/);
  assert.match(errorsFor((s) => { s.business.description = "Wealth management with guaranteed growth."; }), /business\.description.*promises/);
  assert.match(errorsFor((s) => { s.questions[0].a = "Our clients never lose money."; }), /questions.*promises/);
  assert.match(errorsFor((s) => { s.messages.general = "Hello, I'd like your risk-free plan."; }), /messages\.general.*promises/);
  assert.doesNotMatch(errorsFor((s) => { s.help.intro = "Nothing is guaranteed: investments can fall as well as rise. Investing is not risk-free."; }), /promises a return/);
  assert.equal(insightsFromCsv("Title,Category,Date,Summary,Body,Author,Photo,Approved,Approved by,Approved on\nX,Markets,2026-10-01,Consistent outperformance.,B,A,,TRUE,R,2026-09-30", { today: "2026-11-04", photos: [] }).items.length, 0);
});

test("with adviser pages on, each adviser needs a photo", () => {
  assert.match(errorsFor((s) => { delete s.advisers.items[1].photo; }), /advisers\.items\[1\]\.photo/);
});
