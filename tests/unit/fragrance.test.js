import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { notesClauses, notesSentence, alsoIn, alsoInLine, per10ml, sizeScale, organMatches, launchState, daysBetween, dayMonth, initials, engraved, fill, pounds, joinAnd } from "../../src/kits/fragrance/lib/fragrance.js";
import { frameFor, frameFile, patternOf } from "../../src/kits/fragrance/lib/turntable.js";
import { giftTotal } from "../../src/kits/fragrance/lib/gifts.js";
import { HOME_PARTS, homeOrderProblem } from "../../src/kits/fragrance/home.js";
import { validateSite } from "../../src/core/lib/config.js";
import { loadCatalog } from "../../scripts/lib/catalog.js";

const demo = JSON.parse(readFileSync("sites/demos/verriere/site.json", "utf8"));
const client = JSON.parse(readFileSync("tests/fixtures/sites/test-fragrance-client/site.json", "utf8"));
const look = JSON.parse(readFileSync("src/looks/verriere/look.json", "utf8"));
const catalog = loadCatalog(process.cwd());
const errorsFor = (/** @type {(s: any) => void} */ change, base = demo) => { const s = structuredClone(base); change(s); return validateSite(s, { catalog }).join("\n"); };
const items = demo.fragrances.items;

test("the demo and the client fixture are valid", () => {
  assert.deepEqual(validateSite(demo, { catalog }), []);
  assert.deepEqual(validateSite(client, { catalog }), []);
});

test("the look's home order lists every section once", () => {
  assert.equal(homeOrderProblem(look.homeOrder), null);
  assert.match(homeOrderProblem(look.homeOrder.slice(1)) ?? "", /leaves out/);
  assert.equal(Object.keys(HOME_PARTS).length, look.homeOrder.length);
});

test("the notes read as one sentence, top to base, from the house's own notes", () => {
  const sable = items.find((/** @type {any} */ x) => x.id === "sable");
  assert.equal(notesSentence(sable.notes), "It opens on bergamot and sea salt, settles into iris and ambrette, and dries down to cedarwood and white musk.");
  assert.deepEqual(notesClauses(sable.notes).map((c) => c.tier), ["top", "heart", "base"]);
  // A missing tier drops its clause and the sentence still reads.
  assert.equal(notesSentence({ top: ["lemon"], base: ["vetiver"] }), "It opens on lemon, and dries down to vetiver.");
  assert.equal(notesSentence({ heart: ["rose", "iris", "violet"] }), "It settles into rose, iris and violet.");
  assert.equal(notesSentence({}), "");
  assert.equal(joinAnd(["a", "b", "c"]), "a, b and c");
});

test("a tapped note names the other scents that have it, and only the house's", () => {
  assert.deepEqual(alsoIn(items, "Iris", "sable").map((x) => x.name), ["No. 2 Poudre", "No. 7 Pluie"]);
  assert.equal(alsoInLine(items, "iris", "sable"), "Iris is also in No. 2 Poudre and No. 7 Pluie.");
  assert.equal(alsoInLine(items, "ambrette", "sable"), "Ambrette is only in this one.");
  // the page's script gets each scent's notes as one flat list (kit.js pageData)
  assert.equal(alsoInLine(items.map((/** @type {any} */ x) => ({ ...x, notes: [...x.notes.top, ...x.notes.heart, ...x.notes.base] })), "iris", "sable"), "Iris is also in No. 2 Poudre and No. 7 Pluie.");
  assert.equal(alsoInLine(items, "white  musk", "sable"), "White  musk is also in No. 2 Poudre and No. 1 Lin.");
});

test("sizes side by side: drawn to scale by volume, priced per 10 ml from the house's prices", () => {
  assert.equal(per10ml(95, 50), "£19.00");
  assert.equal(per10ml(70, 30), "£23.33");
  assert.equal(sizeScale(100, 100), 1);
  assert.equal(sizeScale(50, 100), 0.794); // the cube root: half the volume is about four fifths the height
  assert.ok(sizeScale(30, 100) < sizeScale(50, 100));
  assert.equal(pounds(95), "£95");
  assert.equal(pounds(4.5), "£4.50");
});

test("the organ: most matches first, the house's order otherwise, never a scent with none", () => {
  const m = organMatches(items, ["iris", "sea salt"]);
  assert.deepEqual(m.map((x) => x.item.id), ["sable", "pluie", "poudre"]);
  assert.deepEqual(m[0].matched, ["sea salt", "iris"]);
  assert.deepEqual(organMatches(items, ["saffron"]), []);
  assert.deepEqual(organMatches(items, ["Fig"]).map((x) => x.item.id), ["verger"]);
});

test("launch mode switches itself on the day and marks the scents new for the house's weeks", () => {
  const l = { date: "2027-02-01", newWeeks: 2 };
  assert.deepEqual(launchState(l, "2027-01-31"), { state: "before", daysTo: 1, isNew: false });
  assert.deepEqual(launchState(l, "2027-02-01"), { state: "open", daysTo: 0, isNew: true });
  assert.equal(launchState(l, "2027-02-14").isNew, true);
  assert.equal(launchState(l, "2027-02-15").isNew, false);
  assert.equal(launchState({ date: "2027-02-01" }, "2027-02-01").isNew, false);
  assert.equal(daysBetween("2027-03-27", "2027-03-29"), 2); // across the clocks going forward
  assert.equal(dayMonth("2027-03-01"), "1 March");
});

test("engraving keeps the house's letter limit and styles", () => {
  assert.equal(engraved("Ottilie · 1 May", "caps", 24), "OTTILIE · 1 MAY");
  assert.equal(engraved("Ada Lovelace", "initials", 24), "A.L.");
  assert.equal(engraved("a".repeat(30), "lower", 24).length, 24);
  assert.equal(initials("Ottilie · 1 May"), "O.M.");
  assert.equal(initials(""), "");
  assert.equal(giftTotal(95, 15, 5), 115);
  assert.equal(fill("Hello {name}, {x}", { name: "Verrière" }), "Hello Verrière, {x}");
});

test("the turntable: drag right turns back, wraps round, and a symmetric bottle reuses its frames", () => {
  assert.equal(frameFor(1, 0, 1440, 36), 1);
  assert.equal(frameFor(1, -16, 1440, 36), 2);
  assert.equal(frameFor(1, 16, 1440, 36), 36);
  assert.equal(frameFor(36, -16, 1440, 36), 1);
  assert.equal(frameFor(1, -8, 390, 36), 2); // at least 8 px a frame on a phone
  assert.equal(frameFile("img/turn/d-{n}.webp", 19, 18), "img/turn/d-01.webp");
  assert.equal(frameFile("img/turn/d-{n}.webp", 7), "img/turn/d-07.webp");
  assert.equal(patternOf("/img/turn/d-01.webp"), "/img/turn/d-{n}.webp");
});

test("no performance claims, comparisons or invented scarcity in the house's words", () => {
  assert.match(errorsFor((s) => { s.fragrances.items[0].line = "Long-lasting, 12 hours on skin"; }), /fragrances\.items\[0\]\.line/);
  assert.match(errorsFor((s) => { s.fragrances.items[1].character = "Smells like a famous one"; }), /performance claim or comparison/);
  assert.match(errorsFor((s) => { s.discovery.terms = "Selling fast"; }), /discovery\.terms/);
  assert.equal(errorsFor((s) => { s.fragrances.items[0].line = "Warm sand at the end of the day."; }), "");
});

test("the claims check reads every page and the common wordings, and lets plain words through", () => {
  const where = [
    ["the layering page", (/** @type {any} */ s, /** @type {string} */ t) => { s.pages[0].blocks[0].body = t; }, /pages\[0\]\.blocks\[0\]\.body/],
    ["a page description", (/** @type {any} */ s, /** @type {string} */ t) => { s.pages[0].description = t; }, /pages\[0\]\.description/],
    ["a question's answer", (/** @type {any} */ s, /** @type {string} */ t) => { s.questions[0].a = t; }, /questions\[0\]\.a/],
    ["the business line", (/** @type {any} */ s, /** @type {string} */ t) => { s.business.description = t; }, /business\.description/],
    ["a fragrance's line", (/** @type {any} */ s, /** @type {string} */ t) => { s.fragrances.items[0].line = t; }, /fragrances\.items\[0\]\.line/],
  ];
  const bad = ["Smells like Baccarat Rouge", "Long-lasting layering", "Long-lasting, 12 hours on skin", "Lasts all day", "8-hour wear", "12h on skin",
    "All-day wear", "Reminiscent of a famous one", "Similar to the big houses", "An alternative to the classics", "A compliment magnet",
    "Leaves a trail all evening", "Outlasts the night", "Inspired by a bestseller", "A dupe", "Only 3 left", "Selling fast"];
  for (const [name, put, path] of where) for (const t of bad) assert.match(errorsFor((s) => put(s, t)), path, `${t} in ${name}`);
  for (const t of ["Ready in 48 hours.", "Open all week.", "Warm sand at the end of the day.", "The salt fades in the first hour; then iris."])
    assert.equal(errorsFor((s) => { s.questions[0].a = t; }), "", t);
});

test("a demo takes no payments and collects no names; a client's links are the house's own", () => {
  assert.match(errorsFor((s) => { s.fragrances.items[0].sizes[0].payLink = "https://buy.stripe.com/abc"; }), /a demo takes no payments/);
  assert.match(errorsFor((s) => { s.launch.waitlist = { formUrl: "https://forms.gle/x" }; }), /a demo collects no names/);
  assert.match(errorsFor((s) => { s.fragrances.items[0].sizes[0].payLink = "https://example.com/pay"; }, client), /Stripe Payment Link/);
  assert.match(errorsFor((s) => { s.launch.waitlist.formUrl = "https://example.com/form"; }, client), /Google Form/);
});

test("the organ only offers notes the house uses; the desk needs its picture; marks run top to bottom", () => {
  assert.match(errorsFor((s) => { s.organ.ingredients[0].note = "saffron"; }), /no fragrance lists "saffron"/);
  assert.match(errorsFor((s) => { delete s.engraving.photo; delete s.engraving.area; }), /the engraving desk needs one front-on picture/);
  assert.match(errorsFor((s) => { s.hero.marks.neck = 0.7; }), /top to bottom/);
  assert.match(errorsFor((s) => { s.turntable.src = "img/turn/d.webp"; }), /ending in \{n\}/);
  assert.match(errorsFor((s) => { s.turntable.repeat = 7; }), /whole part of frames/);
  assert.match(errorsFor((s) => { s.engraving.ml = 75; }), /one of that fragrance's sizes/);
  assert.match(errorsFor((s) => { s.launch.scents = ["nope"]; }), /no fragrance "nope"/);
});
