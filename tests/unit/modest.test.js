import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { inches, pounds, daysWords, appointmentMessage, appointmentSummary, pickLength, hemAnswer, rulerMarks, chartRow, eidOrderDates, leftWords, appointmentDates, lookTotal, lookMessage, encodeFamily, decodeFamily, familyMessage } from "../../src/kits/modest/lib/modest.js";
import { eidWindows, pageData } from "../../src/kits/modest/kit.js";
import { HOME_PARTS, homeOrderProblem } from "../../src/kits/modest/home.js";
import { validateSite } from "../../src/core/lib/config.js";
import { loadCatalog } from "../../scripts/lib/catalog.js";

const demo = JSON.parse(readFileSync("sites/demos/taroub/site.json", "utf8"));
const client = JSON.parse(readFileSync("tests/fixtures/sites/test-modest-client/site.json", "utf8"));
const look = JSON.parse(readFileSync("src/looks/taroub/look.json", "utf8"));
const catalog = loadCatalog(process.cwd());
const errorsFor = (/** @type {(s: any) => void} */ change, base = demo) => { const s = structuredClone(base); change(s); return validateSite(s, { catalog }).join("\n"); };
const LENGTHS = demo.lengths.sizes;

test("the demo and the client fixture are valid", () => {
  assert.deepEqual(validateSite(demo, { catalog }), []);
  assert.deepEqual(validateSite(client, { catalog }), []);
});

test("the look's home order lists every section once", () => {
  assert.equal(homeOrderProblem(look.homeOrder), null);
  assert.match(homeOrderProblem(look.homeOrder.slice(1)) ?? "", /leaves out/);
  assert.equal(Object.keys(HOME_PARTS).length, look.homeOrder.length);
});

test("inches and pounds are written as the shop writes them", () => {
  assert.equal(inches(56), "56");
  assert.equal(inches(56.5), "56½");
  assert.equal(inches(0.74), "½");
  assert.equal(pounds(345), "£345");
  assert.equal(pounds(12.5), "£12.50");
  assert.equal(pounds(1175), "£1,175");
});

test("the length is the longest that clears the floor by half an inch", () => {
  assert.equal(pickLength(LENGTHS, 57), 56);
  assert.equal(pickLength(LENGTHS, 56.5), 56); // exactly half an inch clear
  assert.equal(pickLength(LENGTHS, 56.4), 54);
  assert.equal(pickLength(LENGTHS, 59), 58);
  assert.equal(pickLength(LENGTHS, 52.4), null);
  assert.equal(pickLength(LENGTHS, 70), 60);
  assert.equal(pickLength(LENGTHS, 57, 2), 54, "a shop's own clearance");
});

test("the hem line opens on 2″ heels and answers in words", () => {
  const L = demo.lengths;
  const shoe = L.shoes[L.start.shoe];
  assert.equal(shoe.label, "2″ heels");
  const a = hemAnswer({ lengths: L.sizes, clear: L.clear }, L.start.shoulderToFloor, shoe);
  assert.deepEqual([a.length, a.gap, a.reach], [58, 1, 59]);
  assert.equal(a.words, "Wear the 58. It stops 1″ above the floor in 2″ heels.");
  assert.equal(hemAnswer({ lengths: L.sizes }, 57, L.shoes[0]).words, "Wear the 56. It stops 1″ above the floor.");
  assert.match(hemAnswer({ lengths: L.sizes }, 50, L.shoes[0]).words, /Shorter than our shortest length/);
});

test("the ruler draws only lengths that reach no further than the floor, to scale", () => {
  const m = rulerMarks(LENGTHS, 57, 56);
  assert.deepEqual(m.lines.map((l) => l.length), [52, 54, 56]);
  assert.deepEqual(m.lines.map((l) => l.on), [false, false, true]);
  assert.ok(m.lines.every((l, i) => i === 0 || l.at > m.lines[i - 1].at), "longer lengths sit lower");
  assert.ok(m.floor > m.lines[2].at && m.floor < 1);
  assert.equal(m.gap?.words, "1″");
  assert.ok(m.gap && m.gap.at > m.lines[2].at && m.gap.at < m.floor, "the gap sits between the hem and the floor");
  assert.equal(rulerMarks(LENGTHS, 51, null).gap, null);
});

test("the chart's rows agree with the hem line: every shoulder-to-floor in a row gets that row's length in flats", () => {
  for (const r of demo.lengths.chart) for (let sf = r.from; sf <= r.to; sf += 0.5) assert.equal(pickLength(LENGTHS, sf), r.length, `${sf}″`);
  assert.equal(chartRow(demo.lengths.chart, 57)?.length, 56);
  assert.equal(chartRow(demo.lengths.chart, 70), null);
});

test("Eid dates: the next expected window, cut-offs counted back from its first day, past ones closed", () => {
  const windows = [{ name: "Eid al-Adha", from: "2027-05-14", to: "2027-05-19" }, { name: "Eid al-Fitr", from: "2027-03-08", to: "2027-03-12" }];
  const cut = [{ label: "UK delivery", daysBefore: 5 }, { label: "Made to measure", daysBefore: 21 }];
  const r = eidOrderDates(windows, cut, "2027-02-20");
  assert.equal(r?.name, "Eid al-Fitr");
  assert.equal(r?.words, "Eid al-Fitr is expected between 8 March 2027 and 12 March 2027, when the moon is sighted.");
  assert.deepEqual(r?.rows.map((x) => [x.by, x.left, x.open]), [["2027-03-03", 11, true], ["2027-02-15", -5, false]]);
  assert.equal(r?.rows[0].byWords, "Wednesday 3 March 2027");
  assert.deepEqual(r?.rows.map(leftWords), ["in 11 days", "closed"]);
  assert.equal(eidOrderDates(windows, cut, "2027-03-10")?.name, "Eid al-Fitr", "during the window, still this Eid");
  assert.equal(eidOrderDates(windows, cut, "2027-03-13")?.name, "Eid al-Adha");
  assert.equal(eidOrderDates(windows, cut, "2027-06-01"), null, "no Eid ahead: nothing, never a guess");
  assert.equal(leftWords({ left: 0, open: true }), "today");
  assert.equal(leftWords({ left: 1, open: true }), "tomorrow");
});

test("the build passes Eid windows for the coming years from the shared lunar table", () => {
  const w = eidWindows(2027);
  assert.ok(w.some((x) => x.name === "Eid al-Fitr" && x.from === "2027-03-08"));
  assert.ok(w.some((x) => x.name === "Eid al-Adha" && x.from === "2027-05-14"));
  assert.ok(w.every((x) => x.from <= x.to));
});

test("appointments: the standing times from tomorrow, closed days left out", () => {
  const weekly = { sat: ["10:30", "13:00"], sun: ["12:30"] };
  const d = appointmentDates(weekly, "2026-11-20", 9, ["2026-11-22"]); // Friday; Sunday 22 closed
  assert.deepEqual(d.map((x) => x.date), ["2026-11-21", "2026-11-28", "2026-11-29"]);
  assert.equal(d[0].words, "Saturday 21 November 2026");
  assert.deepEqual(d[0].times, ["10:30", "13:00"]);
  assert.deepEqual(appointmentDates(weekly, "2026-11-21", 1), [{ date: "2026-11-22", words: "Sunday 22 November 2026", times: ["12:30"] }], "never today");
});

test("words: one day, and the appointment request", () => {
  assert.equal(daysWords(1), "1 day");
  assert.equal(daysWords(5), "5 days");
  const d = { words: "Saturday 24 October 2026" };
  assert.equal(appointmentMessage("Taroub", d, "13:00", 1, "Eid"), "Hello Taroub, I'd like to request a private appointment on Saturday 24 October 2026 at 13:00, for 1 person. It's for: Eid.");
  assert.equal(appointmentSummary(d, "13:00", 1), "Saturday 24 October 2026 at 13:00, for one.");
  assert.equal(appointmentMessage("Taroub", undefined, "", 2, "Eid"), "Hello Taroub, I'd like to ask about a private appointment.");
});

test("complete the look: required pieces always count; the message carries her length and the total", () => {
  const items = [{ name: "The Layl", price: 345 }, { name: "Long jersey hijab", price: 28 }, { name: "Inner slip", price: 45, optional: true }];
  assert.equal(lookTotal(items, []).total, 373);
  const t = lookTotal(items, [false, false, true]);
  assert.equal(t.total, 418);
  assert.equal(lookMessage("Taroub", "The Layl, complete", t.picked, 58, t.total), "Hello Taroub, I'd like to order The Layl, complete: The Layl in the 58, Long jersey hijab, Inner slip. That's £418.");
});

test("the family list round-trips through the link, refuses unknown pieces and lengths, and totals", () => {
  const pieces = [{ id: "layl", name: "The Layl", price: 345, lengths: [54, 56, 58] }, { id: "misk", name: "The Misk", price: 260, lengths: [52, 54] }];
  const people = [{ name: "Mum", piece: "layl", length: 56 }, { name: "Huda | ~ #", piece: "misk", length: 0 }];
  const hash = encodeFamily(people);
  assert.deepEqual(decodeFamily(`#${hash}`, pieces), people);
  assert.deepEqual(decodeFamily("#Ali~nope~56|Sara~misk~99|~layl~54", pieces), [{ name: "Sara", piece: "misk", length: 0 }, { name: "", piece: "layl", length: 54 }]);
  assert.equal(decodeFamily("#%E0%A4%A~layl~54", pieces).length, 0, "a broken link is skipped, not thrown");
  assert.equal(decodeFamily(`#${encodeFamily(Array(12).fill(people[0]))}`, pieces, 8).length, 8);
  const m = familyMessage("Taroub", people, pieces);
  assert.equal(m.total, 605);
  assert.equal(m.text, "Hello Taroub, our family's Eid order:\nMum: The Layl, the 56\nHuda | ~ #: The Misk, length to check\nThat's £605 for 2 pieces.");
});

test("page data carries only what the features that are on need", () => {
  const d = pageData(demo);
  assert.equal(d.lengths?.start.shoe, 2);
  assert.equal(d.looks?.sets[0].items[0].name, "The Layl");
  assert.equal(d.family?.pieces.length, demo.family.pieces.length);
  const starter = pageData({ ...demo, features: ["modest-collection", "modest-size-guide"] });
  assert.deepEqual([starter.lengths, starter.eid, starter.appointments, starter.looks, starter.family], [null, null, null, null, null]);
});

test("the checks catch a chart, look or piece that doesn't add up", () => {
  assert.match(errorsFor((s) => { s.pieces.items[0].lengths = [55]; }), /pieces.items\[0\].lengths/);
  assert.match(errorsFor((s) => { s.pieces.items[0].model.wears = 52; }), /model.wears/);
  assert.match(errorsFor((s) => { s.pieces.items[0].model.height = "tall"; }), /model.height/);
  assert.match(errorsFor((s) => { s.lengths.chart[1].from = 53; }), /don't overlap/);
  assert.match(errorsFor((s) => { s.lengths.chart[0].length = 51; }), /lengths.chart\[0\].length/);
  assert.match(errorsFor((s) => { s.lengths.start.shoe = 9; }), /lengths.start.shoe/);
  assert.match(errorsFor((s) => { s.looks.sets[0].items[0].optional = true; }), /starts with its abaya/);
  assert.match(errorsFor((s) => { s.looks.sets[0].payLink = "nope"; }), /isn't one of payLinks.items/);
  assert.match(errorsFor((s) => { s.payLinks.items[0].amount = 345; }), /the set as shown is £373/);
  assert.match(errorsFor((s) => { s.pieces.items[0].photo.small.width = 2000; }), /small.width/);
  assert.match(errorsFor((s) => { s.family.pieces.push("ghost"); }), /family.pieces/);
  assert.match(errorsFor((s) => { s.eid.cutoffs[0].daysBefore = -1; }), /daysBefore/);
  assert.match(errorsFor((s) => { s.appointments.weekly.sat = ["10am"]; }), /appointments.weekly.sat/);
  assert.match(errorsFor((s) => { s.hero.piece = "ghost"; }), /hero.piece/);
  assert.match(errorsFor((s) => { s.pieces.items[0].colour = "black"; }), /unknown setting/);
  assert.match(errorsFor((s) => { s.plan = "plus"; s.features = ["modest-collection", "modest-category-pages", "modest-length", "modest-appointment", "visit", "questions"]; s.nav = [s.nav[1]]; }), /each part of the collection is a page/);
});
