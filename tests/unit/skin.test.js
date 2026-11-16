import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { claimProblem } from "../../src/kits/skin/lib/rules.js";
import { fill, finderCard, minutesWords, pounds, ritualSum, ritualWords, giftMessage, rhythmEvents, patchDay, shortDay, dayEventsIcs, allItems } from "../../src/kits/skin/lib/skin.js";
import { HOME_PARTS, homeOrderProblem } from "../../src/kits/skin/home.js";
import { validateSite } from "../../src/core/lib/config.js";
import { loadCatalog } from "../../scripts/lib/catalog.js";

const demo = JSON.parse(readFileSync("sites/demos/skin-clinic/site.json", "utf8"));
const client = JSON.parse(readFileSync("tests/fixtures/sites/test-skin-client/site.json", "utf8"));
const look = JSON.parse(readFileSync("src/looks/palm/look.json", "utf8"));
const catalog = loadCatalog(process.cwd());
const errorsFor = (/** @type {(s: any) => void} */ change, base = demo) => { const s = structuredClone(base); change(s); return validateSite(s, { catalog }).join("\n"); };
const item = (/** @type {string} */ id) => allItems(demo.menu).find((x) => x.id === id);

test("the demo and the client fixture are valid", () => {
  assert.deepEqual(validateSite(demo, { catalog }), []);
  assert.deepEqual(validateSite(client, { catalog }), []);
});

test("the look's home order lists every section once", () => {
  assert.equal(homeOrderProblem(look.homeOrder), null);
  assert.match(homeOrderProblem(look.homeOrder.slice(1)) ?? "", /leaves out/);
  assert.equal(Object.keys(HOME_PARTS).length, look.homeOrder.length);
});

test("copy can't name a condition, promise a result or offer injectables; ordinary words pass", () => {
  const caught = ["Clears acne", "Calms rosacea", "Heals the skin", "Guaranteed glow", "A permanent result", "Clinically proven", "Clinically-proven", "Boosts collagen", "Anti-ageing facial", "Lifts your face", "Botox and fillers", "Completely painless", "No side effects",
    "Anti-wrinkle injections", "Lip enhancement with hyaluronic acid", "Polynucleotides", "PRP vampire facial", "Visibly younger", "Results that last for years", "Erases fine lines", "Removes scars", "Treats hyperpigmentation", "An injectable skin booster"];
  for (const t of caught) assert.ok(claimProblem(t), t);
  const allowed = ["Lash lift and tint", "Brow lift", "A lifting massage", "For skin that is breaking out", "Light flaking for two to four days.", "Skip retinol and acids tonight.", "Fragrance-free products throughout.",
    "Semi-permanent lashes, refilled every three weeks.", "Skin is still healing for 48 hours, so no gym.", "Tell us if you have eczema or psoriasis before your patch test.", "Peels are not suitable if you have rosacea.",
    "Collagen-friendly vitamin C serum", "Gel cured under the lamp", "A hyaluronic acid serum to finish"];
  for (const t of allowed) assert.equal(claimProblem(t), null, t);
  assert.ok(claimProblem("Safe for all skin. Clears eczema."), "a contraindication in one sentence doesn't excuse a claim in the next");
  assert.match(errorsFor((s) => { s.menu.categories[0].items[0].line = "Clears acne for good"; }), /menu\.categories\[0\]\.items\[0\]\.line/);
  assert.match(errorsFor((s) => { s.finder.note = "Results guaranteed"; }), /finder\.note/);
});

test("every finder card line is the clinic's own: a word must point at a treatment with afterwards and patch lines", () => {
  assert.match(errorsFor((s) => { delete s.menu.categories[0].items[0].afterwards; }), /no "afterwards" line/);
  assert.match(errorsFor((s) => { s.finder.words[0].item = "nope"; }), /finder\.words\[0\]\.item/);
  assert.match(errorsFor((s) => { s.finder.words[0].word = "Tight"; }), /lowercase/);
  assert.match(errorsFor((s) => { s.finder.words = s.finder.words.slice(0, 1); }), /two to six/);
  // without "evening" the card simply has no "This evening" row; the site is still valid
  assert.equal(errorsFor((s) => { delete s.menu.categories[0].items[0].evening; }), "");
});

test("misspelt settings are refused, and a demo takes no payments", () => {
  assert.match(errorsFor((s) => { s.rituals.addons = []; }), /rituals\.addons: unknown setting/);
  assert.match(errorsFor((s) => { s.spaDays.days[0].payLink = "https://buy.stripe.com/test_x"; }), /demo takes no payments/);
  assert.match(errorsFor((s) => { s.spaDays.days[0].payLink = "https://example.com/pay"; s.mode = "client"; }), /Stripe Payment Link/);
  assert.match(errorsFor((s) => { delete s.menu.categories[1].page; }), /every part of the menu needs its page/);
});

test("the finder's card and message come from site.json", () => {
  const c = finderCard(demo.menu, demo.finder, "uneven", "Clémence");
  assert.equal(c?.item.name, "Light peel");
  assert.equal(c?.message, "Hello Clémence, I'd like to book the Light peel (45 minutes, £80). My skin feels uneven today.");
  assert.equal(finderCard(demo.menu, demo.finder, "oily", "Clémence"), null);
  assert.equal(fill("Hi {name}, {to} from {from}.", { name: "Clémence" }), "Hi Clémence, from.");
});

test("minutes and prices read as the clinic says them", () => {
  assert.equal(minutesWords(45), "45 minutes");
  assert.equal(minutesWords(60), "1 hour");
  assert.equal(minutesWords(135), "2 hours 15 minutes");
  assert.equal(pounds(1250), "£1,250");
});

test("the ritual builder adds up in the clinic's order", () => {
  const s = ritualSum(item("hydrating"), demo.rituals.addOns, ["brows", "scalp"]);
  assert.equal(s.minutes, 60 + 15 + 15);
  assert.equal(s.price, 95 + 25 + 18);
  assert.deepEqual(s.picked.map((a) => a.id), ["scalp", "brows"]);
  assert.equal(ritualWords(item("hydrating"), s.picked), "the Hydrating facial with a scalp ritual and a brow shape");
  assert.equal(ritualWords(item("long"), []), "the Long facial");
});

test("a gift message carries the day, the names and the card's line", () => {
  const m = giftMessage(demo.spaDays.days[0], { to: " Ana ", from: "Sam", note: "Happy birthday" }, demo.spaDays.message, "Clémence");
  assert.equal(m, "Hello Clémence, I'd like to give the A morning (£220). It's for Ana, from Sam.\n\nFor the card: \"Happy birthday\"");
});

test("treatment rhythm: the clinic's reminders, then the next visits at its spacing", () => {
  const ev = rhythmEvents(item("peel"), "2027-03-01");
  assert.deepEqual(ev.map((e) => e.date), ["2027-03-01", "2027-03-02", "2027-03-04", "2027-03-29", "2027-04-26", "2027-05-24"]);
  assert.equal(rhythmEvents(item("brow-shape"), "2027-03-01").length, 0);
  const ics = dayEventsIcs({ events: ev, clinic: "Clémence", place: "2 Walton Yard", stamp: "20270301T090000Z" });
  assert.match(ics, /BEGIN:VCALENDAR/);
  assert.equal((ics.match(/BEGIN:VEVENT/g) ?? []).length, 6);
  assert.match(ics, /DTSTART;VALUE=DATE:20270329/);
});

test("the patch-test day is the clinic's hours before, as a day", () => {
  assert.equal(patchDay("2027-03-04", 48), "2027-03-02");
  assert.equal(patchDay("2027-03-04", 72), "2027-03-01");
  assert.equal(shortDay("2026-11-21"), "Sat 21 Nov");
});
