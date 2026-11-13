import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { reorderText, bringLine, clockWords, eveningBefore, allDayTrigger, withReminders, aGarment, swatchSetText, specText, partyExtraWeeks, partySteps, partyText, seasonWords, clothsFor, fromPrice, appointmentText, swatchText, travelText, showDates, upcoming, travelIcs, fittingIcs, cleanCode, commissionFromCsv, fittingWhen } from "../../src/kits/tailor/lib/tailor.js";
import { usedKinds, wordsOf } from "../../src/kits/tailor/lib/lexicon.js";
import { HOME_PARTS, homeOrderProblem, onPagesProblem } from "../../src/kits/tailor/home.js";
import { diaryIcs } from "../../src/core/lib/diary.js";
import { validateSite } from "../../src/core/lib/config.js";
import { loadCatalog } from "../../scripts/lib/catalog.js";

const demo = JSON.parse(readFileSync("sites/demos/tailor/site.json", "utf8"));
const client = JSON.parse(readFileSync("tests/fixtures/sites/test-tailor-client/site.json", "utf8"));
const catalog = loadCatalog(process.cwd());
const errorsFor = (/** @type {(s: any) => void} */ change, base = demo) => { const s = structuredClone(base); change(s); return validateSite(s, { catalog }).join("\n"); };
const STAGES = ["cut", "baste", "forward", "finished"];
const CLOTHS = ["midnight", "flannel"];
const NOW = Date.parse("2026-11-04T12:00:00Z");
const csv = (rows) => ["code,stage,next_fitting,cloth,updated_at", ...rows].join("\n");
const read = (rows, code = "FL4K7M2Q", stale = 14) => commissionFromCsv(csv(rows), code, STAGES, CLOTHS, NOW, stale, "Europe/London");

test("the demo and the client fixture are valid", () => {
  assert.deepEqual(validateSite(demo, { catalog }), []);
  assert.deepEqual(validateSite(client, { catalog }), []);
});

test("the cloth book: seasons in words, all-year cloths under every season", () => {
  assert.equal(seasonWords(["spring", "summer"]), "Spring and summer");
  assert.equal(seasonWords(["autumn", "winter", "spring"]), "Autumn, winter and spring");
  assert.equal(seasonWords(["all-year"]), "All year");
  const items = [{ id: "a", seasons: ["winter"] }, { id: "b", seasons: ["all-year"] }, { id: "c", seasons: ["summer"] }];
  assert.deepEqual(clothsFor(items, "winter").map((c) => c.id), ["a", "b"]);
  assert.equal(clothsFor(items, "").length, 3);
});

test("prices are the house's or none; messages never say booked", () => {
  assert.equal(fromPrice(4800), "From £4,800");
  assert.equal(fromPrice(null), "");
  const text = appointmentText("Hello Fennick & Lowe.", { garments: ["Overcoat", "Trousers"], when: "A Saturday", wedding: "2027-06-12" });
  assert.equal(text, "Hello Fennick & Lowe.\nI'm thinking of: Overcoat, Trousers.\nBest for me: A Saturday.\nIt's for a wedding on Saturday 12 June 2027.");
  assert.doesNotMatch(text, /booked|confirmed/i);
  assert.equal(appointmentText("Hello.", { garments: [], when: "" }), "Hello.");
  assert.match(swatchText("Hello.", { name: "Midnight", cloth: "Worsted" }), /swatch of Midnight \(worsted\)/);
  assert.match(travelText("Hello.", { city: "Leeds", venue: "A room", from: "2027-02-11", to: "2027-02-12" }), /in Leeds \(A room, 11–12 February 2027\)/);
});

test("trunk-show dates read in UK order across months and years; finished ones drop off", () => {
  assert.equal(showDates({ from: "2026-11-19", to: "2026-11-21" }), "19–21 November 2026");
  assert.equal(showDates({ from: "2026-11-30", to: "2026-12-02" }), "30 November – 2 December 2026");
  assert.equal(showDates({ from: "2026-12-30", to: "2027-01-02" }), "30 December 2026 – 2 January 2027");
  assert.equal(showDates({ from: "2027-01-25", to: "2027-01-25" }), "Monday 25 January 2027");
  const list = [{ id: "b", from: "2027-01-25", to: "2027-01-28" }, { id: "a", from: "2026-10-08", to: "2026-10-09" }, { id: "c", from: "2026-11-03", to: "2026-11-05" }];
  assert.deepEqual(upcoming(list, "2026-11-04").map((t) => t.id), ["c", "b"]);
});

test("calendar files: a trunk show runs all day across its days; a fitting is at its hour in UTC", () => {
  const t = travelIcs({ id: "leeds", city: "Leeds", venue: "A room, near the station", from: "2027-02-11", to: "2027-02-12" }, "Fennick & Lowe", "20261104T120000Z");
  assert.match(t, /DTSTART;VALUE=DATE:20270211\r\nDTEND;VALUE=DATE:20270213/);
  assert.match(t, /LOCATION:A room\\, near the station/);
  // 11:00 in London on 12 November is 11:00 UTC; in June it is 10:00 UTC
  const ms = Date.parse("2026-11-12T11:00:00Z");
  const f = fittingIcs({ code: "FL4K7M2Q", startMs: ms, minutes: 45, title: "Forward fitting", place: "3 Pellow Yard", house: "Fennick & Lowe" }, "20261104T120000Z");
  assert.match(f, /DTSTART:20261112T110000Z\r\nDTEND:20261112T114500Z/);
  assert.match(f, /SUMMARY:Forward fitting · Fennick & Lowe/);
  assert.equal(fittingWhen(Date.parse("2027-06-10T10:00:00Z"), "Europe/London"), "Thursday 10 June 2027, 11:00");
});

test("commission codes: cleaned, and too short or odd ones refused", () => {
  assert.equal(cleanCode(" fl4k-7m2q "), "FL4K7M2Q");
  assert.equal(cleanCode("FL4K"), "");
  assert.equal(cleanCode("FL4K7M2Q!"), "");
});

test("the commission sheet: the stage, the next fitting and the cloth for one code", () => {
  const r = read(["FL4K7M2Q,forward,2026-11-12 11:00,midnight,2026-11-03 16:20", "AB12CD34,cut,,,2026-11-01 09:00"]);
  assert.equal(r.ok, true);
  assert.equal(r.stage, 2);
  assert.equal(r.next, Date.parse("2026-11-12T11:00:00Z"));
  assert.equal(r.cloth, "midnight");
  const other = read(["FL4K7M2Q,forward,2026-11-12 11:00,midnight,2026-11-03 16:20", "AB12CD34,cut,,,2026-11-01 09:00"], "AB12CD34");
  assert.deepEqual([other.ok, other.stage, other.next, other.cloth], [true, 0, null, ""]);
  // a fitting already past isn't offered as the next one
  assert.equal(read(["FL4K7M2Q,forward,2026-11-02 11:00,,2026-11-03 16:20"]).next, null);
});

test("the commission sheet fails closed: names, unknown codes, stages or cloths, stale rows", () => {
  assert.deepEqual(read(["FL4K7M2Q,forward,,,2026-11-03 16:20,Mr Smith"]), { ok: false, reason: "unreadable" });
  assert.deepEqual(commissionFromCsv("code,stage,updated_at,name\nFL4K7M2Q,cut,2026-11-03 16:20,Smith", "FL4K7M2Q", STAGES, CLOTHS, NOW, 14, "Europe/London"), { ok: false, reason: "unreadable" });
  assert.deepEqual(read(["AB12CD34,cut,,,2026-11-03 16:20"]), { ok: false, reason: "unknown" });
  assert.deepEqual(read(["FL4K7M2Q,cut,,,2026-11-03 16:20", "FL4K7M2Q,baste,,,2026-11-03 16:20"]), { ok: false, reason: "unknown" });
  assert.deepEqual(read(["FL4K7M2Q,pressing,,,2026-11-03 16:20"]), { ok: false, reason: "unreadable" });
  assert.deepEqual(read(["FL4K7M2Q,cut,,velvet,2026-11-03 16:20"]), { ok: false, reason: "unreadable" });
  assert.deepEqual(read(["FL4K7M2Q,cut,11/12/2026 11:00,,2026-11-03 16:20"]), { ok: true, stage: 0, next: Date.parse("2026-12-11T11:00:00Z"), cloth: "", updatedAt: Date.parse("2026-11-03T16:20:00Z") });
  assert.deepEqual(read(["FL4K7M2Q,cut,,,2026-10-01 09:00"]), { ok: false, reason: "stale" });
  assert.deepEqual(read(["FL4K7M2Q,cut,,,2026-11-09 09:00"]), { ok: false, reason: "unreadable" }); // updated in the future
  assert.deepEqual(commissionFromCsv("nothing here", "FL4K7M2Q", STAGES, CLOTHS, NOW, 14, "Europe/London"), { ok: false, reason: "unreadable" });
});

test("the lexicon offers only the kinds the house uses, in a fixed order", () => {
  const items = [{ kind: "pocket" }, { kind: "lapel" }, { kind: "pocket" }];
  assert.deepEqual(usedKinds(items).map((k) => k.id), ["lapel", "pocket"]);
  assert.equal(wordsOf(items, "pocket").length, 2);
  assert.equal(wordsOf(items, "").length, 3);
});

test("home order: every tailor look lists every home section once; only allowed sections move to pages", () => {
  for (const p of Object.values(HOME_PARTS)) assert.ok(existsSync(new URL(`../../src/${p}`, import.meta.url)), p);
  for (const [id, look] of Object.entries(catalog.looks)) if (look.kits.includes("tailor")) {
    assert.equal(homeOrderProblem(look.homeOrder), null, id);
    assert.equal(onPagesProblem(look.onPages), null, id);
  }
  assert.match(homeOrderProblem(Object.keys(HOME_PARTS).slice(1)) ?? "", /leaves out: cloth-book/);
  assert.match(onPagesProblem({ team: ["visit"] }) ?? "", /only reviews, gallery/);
});

test("settings checks: prices, seasons, stages with photos, sheet-only on clients, real dates", () => {
  assert.match(errorsFor((s) => { s.garments.items[0].from = "4800"; }), /garments\.items\[0\]\.from/);
  assert.match(errorsFor((s) => { s.cloths.items[0].seasons = ["monsoon"]; }), /cloths\.items\[0\]\.seasons/);
  assert.match(errorsFor((s) => { s.commission.stages = ["first", "cut"]; }), /process step "first" needs a photo/);
  assert.match(errorsFor((s) => { s.commission.stages = ["cut", "pressing"]; }), /commission\.stages\[1\]/);
  assert.match(errorsFor((s) => { s.commission.source = "simulated"; }, client), /simulated data is for demos/);
  assert.match(errorsFor((s) => { s.commission.csvUrl = "https://example.com/sheet.csv"; }, client), /published to the web as CSV/);
  assert.match(errorsFor((s) => { s.commission.example = "FL4K7M2Q"; }, client), /demo's sample code only/);
  assert.match(errorsFor((s) => { s.travels.items[0].to = "2026-02-30"; }), /real dates/);
  assert.match(errorsFor((s) => { s.lexicon.items[0].kind = "hat"; }), /lexicon\.items\[0\]\.kind/);
  assert.match(errorsFor((s) => { s.weddingOrder.orderStep = "nope"; }), /weddingOrder\.orderStep/);
  assert.match(errorsFor((s) => { s.garments.colour = "navy"; }), /garments\.colour: unknown setting/);
});

test("the swatch set asks for up to five cloths in one message", () => {
  const six = ["A", "B", "C", "D", "E", "F"].map((n) => ({ name: n, cloth: "Worsted" }));
  const text = swatchSetText("Hello.", six);
  assert.equal(text.split("\n").filter((l) => l.startsWith("· ")).length, 5);
  assert.match(text, /^Hello\.\nCould you send me swatches of these cloths\?\n· A \(worsted\)/);
  assert.match(swatchSetText("Hello.", six.slice(0, 1)), /swatch of A \(worsted\)/);
});

test("the specification card's message lists each choice and the cloth", () => {
  const t = specText("Hello.", [{ group: "Lapel", label: "Peak" }, { group: "Fastening", label: "Double breasted" }], { name: "Midnight", cloth: "Worsted" }, "Dinner suit");
  assert.equal(t, "Hello.\nMy specification for a dinner suit:\nLapel: Peak\nFastening: Double breasted\nCloth: Midnight (worsted)");
  assert.doesNotMatch(specText("Hello.", [], null, ""), /Cloth|for a/);
});

test("a larger wedding party starts earlier by the house's own rule; other steps stay where the house set them", () => {
  const rules = [{ from: 4, extraWeeks: 2 }, { from: 7, extraWeeks: 4 }];
  assert.deepEqual([1, 3, 4, 6, 7, 10].map((n) => partyExtraWeeks(n, rules)), [0, 0, 2, 2, 4, 4]);
  assert.equal(partyExtraWeeks(9, []), 0);
  const steps = [{ id: "start", weeksBefore: 16 }, { id: "baste", weeksBefore: 12 }];
  assert.deepEqual(partySteps(steps, "start", 2), [{ id: "start", weeksBefore: 18 }, { id: "baste", weeksBefore: 12 }]);
  const msg = partyText("Hello.", { wedding: "2027-06-12", size: 5, cloth: "Midnight", lines: ["First appointment: Saturday 6 February 2027"] });
  assert.equal(msg, "Hello.\nOur wedding is on Saturday 12 June 2027: suits for 5 of us.\nThe cloth for everyone: Midnight.\n\nFirst appointment: Saturday 6 February 2027");
  assert.match(partyText("Hello.", { wedding: "2027-06-12", size: 1, cloth: "", lines: [] }), /a suit for me\.$/);
});

test("new pages: every specification option has a photograph, sources are links, slugs don't clash", () => {
  assert.match(errorsFor((s) => { delete s.spec.groups[0].options[0].photo; }), /spec\.groups\[0\]\.options\[0\]\.photo/);
  assert.match(errorsFor((s) => { s.spec.groups[0].id = "cloth"; }), /come from the cloth book/);
  assert.match(errorsFor((s) => { s.explained.sources = []; }), /explained\.sources/);
  assert.match(errorsFor((s) => { s.explained.sources[0].url = "savilerowbespoke.com"; }), /an https link/);
  assert.match(errorsFor((s) => { s.garmentPages.items[1].slug = "suits"; }), /"suits" is already a page/);
  assert.match(errorsFor((s) => { s.journal.items[0].slug = "cloth"; }), /"cloth" is already a page/);
  assert.match(errorsFor((s) => { s.journal.items[0].date = "22/10/2026"; }), /journal\.items\[0\]\.date/);
  assert.match(errorsFor((s) => { s.weddingOrder.party.rules[0].extraWeeks = -1; }), /extraWeeks/);
});

test("a suit, an overcoat, an odd jacket", () => {
  assert.deepEqual(["Suit", "Overcoat", "Odd jacket", "Dinner suit", "Trousers"].map(aGarment), ["a suit", "an overcoat", "an odd jacket", "a dinner suit", "a pair of trousers"]);
  assert.match(specText("Hi.", [], null, "Overcoat"), /for an overcoat:/);
});

test("the fitting reminder sounds at the house's time the evening before, through the clock change", () => {
  assert.equal(clockWords("18:00"), "6pm");
  assert.equal(clockWords("18:30"), "6:30pm");
  assert.equal(bringLine(["the shoes and shirt you'll wear with it", "your order card"]), "Bring the shoes and shirt you'll wear with it and your order card.");
  assert.equal(bringLine([]), "");
  // Thursday 12 November 2026, 11:00 London (GMT): Wednesday 18:00 = 18:00Z
  assert.equal(new Date(eveningBefore(Date.parse("2026-11-12T11:00:00Z"), "18:00", "Europe/London")).toISOString(), "2026-11-11T18:00:00.000Z");
  // Monday 30 March 2026 after the clocks go forward on Sunday the 29th: Sunday 18:00 BST = 17:00Z
  assert.equal(new Date(eveningBefore(Date.parse("2026-03-30T09:00:00Z"), "18:00", "Europe/London")).toISOString(), "2026-03-29T17:00:00.000Z");
  assert.equal(allDayTrigger("18:00"), "TRIGGER:-PT6H");
  assert.equal(allDayTrigger("19:30"), "TRIGGER:-PT4H30M");
  const ics = fittingIcs({ code: "FL4K7M2Q", startMs: Date.parse("2026-11-12T11:00:00Z"), minutes: 60, title: "Forward fitting", place: "3 Pellow Yard", house: "Fennick & Lowe",
    reminder: { atMs: Date.parse("2026-11-11T18:00:00Z"), items: ["your order card"] } }, "20261104T120000Z");
  assert.match(ics, /BEGIN:VALARM\r\nACTION:DISPLAY\r\nTRIGGER;VALUE=DATE-TIME:20261111T180000Z\r\nDESCRIPTION:Forward fitting at Fennick & Lowe tomorrow\. Bring your order card\.\r\nEND:VALARM\r\nEND:VEVENT/);
  assert.doesNotMatch(fittingIcs({ code: "X1234567", startMs: 0, minutes: 60, title: "T", place: "P", house: "H" }, "S"), /VALARM/);
});

test("the wedding party's calendar file: the alarm only on the fittings the house lists", () => {
  const plain = diaryIcs({ wedding: "2027-06-12", dates: [
    { id: "start", label: "First appointment", date: "2027-02-20", past: false },
    { id: "baste", label: "Baste fitting", date: "2027-03-20", past: false },
    { id: "forward", label: "Forward fitting", date: "2027-05-01", past: false },
  ], salon: "Fennick & Lowe", place: "P", stamp: "S", title: "wedding party" });
  const ics = withReminders(plain, ["baste", "forward"], { at: "18:00", items: ["your order card"] }, "Fennick & Lowe");
  const events = ics.split("BEGIN:VEVENT").slice(1);
  assert.deepEqual(events.map((e) => e.includes("BEGIN:VALARM")), [false, true, true, false]);
  assert.match(events[1], /DESCRIPTION:Baste fitting at Fennick & Lowe tomorrow\. Bring your order card\./);
  assert.match(events[1], /TRIGGER:-PT6H/);
});

test("ordering again from the pattern: code, garment, cloth and change, never a measurement", () => {
  assert.equal(reorderText("Hello.", { code: "FL4K7M2Q", garment: "Trousers", cloth: "Charcoal (flannel)", changes: "  a touch\n longer " }),
    "Hello.\nI'd like to order again from my pattern: a pair of trousers.\nOrder code: FL4K7M2Q\nCloth: Charcoal (flannel)\nChange: a touch longer");
  assert.match(reorderText("Hello.", { code: "FL4K7M2Q", garment: "Overcoat", cloth: "", changes: "" }), /: an overcoat\.\nOrder code: FL4K7M2Q\nCloth: I'd like help choosing at the house$/);
  assert.doesNotMatch(reorderText("Hello.", { code: "FL4K7M2Q", garment: "", cloth: null, changes: "" }), /Cloth|Change/);
});

test("new settings: the reminder's time and steps, a group for some garments only, the re-order page", () => {
  assert.match(errorsFor((s) => { s.fittingReminder.at = "09:00"; }), /fittingReminder\.at/);
  assert.match(errorsFor((s) => { s.fittingReminder.items = ["x".repeat(61)]; }), /fittingReminder\.items/);
  assert.match(errorsFor((s) => { s.fittingReminder.weddingSteps = ["wedding"]; }), /fittingReminder\.weddingSteps/);
  assert.match(errorsFor((s) => { s.spec.groups[3].for = ["kilt"]; }), /spec\.groups\[3\]\.for/);
  assert.match(errorsFor((s) => { delete s.reorder.message; }), /reorder\.message/);
  assert.equal(errorsFor(() => {}), "");
});
