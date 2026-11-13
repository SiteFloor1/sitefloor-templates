import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DIETS, BAKERY_DIETS, hasDiet } from "../../src/core/lib/allergens.js";
import { bakesFromCsv, stateOf, leftWords } from "../../src/kits/bakery/lib/bakes.js";
import { GRIDS, boxQuote, boxText, giftEncode, giftDecode, giftShareText, flightOrder, flightText } from "../../src/kits/bakery/lib/box.js";
import { favourQuote, favourEarliest, sealOf, favourText } from "../../src/kits/bakery/lib/favours.js";
import { adventState, canOpen, doorOrder, behindDoors } from "../../src/kits/bakery/lib/advent.js";
import { nextPost } from "../../src/kits/bakery/lib/post.js";
import { tubQuote, tubText } from "../../src/kits/bakery/lib/tubs.js";
import { votesFromCsv, voteShares, voteLink, voteWindow } from "../../src/kits/bakery/lib/vote.js";
import { quote, earliestDate, dayProblem, requestText, reminderIcs } from "../../src/kits/bakery/lib/cake.js";
import { passes, collectionSlots, collectionDays, slotLabel, basket, collectText, partyPlans } from "../../src/kits/bakery/lib/orders.js";
import { lateWords } from "../../src/kits/bakery/features/late-night/late-night.js";
import { HOME_PARTS, homeOrderProblem } from "../../src/kits/bakery/home.js";
import { validateSite } from "../../src/core/lib/config.js";
import { headersFile } from "../../src/core/lib/seo.js";
import { loadCatalog } from "../../scripts/lib/catalog.js";

const demo = JSON.parse(readFileSync("sites/demos/dessert/site.json", "utf8"));
const client = JSON.parse(readFileSync("tests/fixtures/sites/test-bakery-client/site.json", "utf8"));
const catalog = loadCatalog(process.cwd());
const errorsFor = (/** @type {(s: any) => void} */ change, base = demo) => { const s = structuredClone(base); change(s); return validateSite(s, { catalog }).join("\n"); };
const TZ = "Europe/London";
// Thursday 29 October 2026, 9:30pm (GMT).
const NIGHT = Date.parse("2026-10-29T21:30:00Z");
const CSV = (/** @type {string[]} */ ...rows) => ["kind,item,status,note,updated_at", ...rows].join("\n");

test("the demo and the client fixture are valid; the restaurant keeps exactly its three marks", () => {
  assert.deepEqual(validateSite(demo, { catalog }), []);
  assert.deepEqual(validateSite(client, { catalog }), []);
  assert.deepEqual(DIETS.map((d) => d.id), ["halal", "vegetarian", "vegan"]);
  assert.deepEqual(BAKERY_DIETS.map((d) => d.id), ["eggless", "halal", "vegetarian", "vegan"]);
});

test("vegan counts as eggless and vegetarian; eggless counts as nothing else", () => {
  assert.ok(hasDiet({ diets: ["vegan"] }, "eggless"));
  assert.ok(hasDiet({ diets: ["vegan"] }, "vegetarian"));
  assert.ok(!hasDiet({ diets: ["eggless"] }, "vegan"));
  assert.ok(!hasDiet({ diets: ["eggless"] }, "vegetarian"));
});

test("tonight's sheet: today only; a stale 'a few left' goes quiet, 'sold out' stands; seats go stale; cake days hold", () => {
  const b = bakesFromCsv(CSV(
    "dessert,pistachio-kunafa,low,Fresh at 7,2026-10-29 21:10",
    "dessert,strawberry-tart,low,,2026-10-29 19:00",
    "dessert,basque-cheesecake,sold out,Back tomorrow,2026-10-29 17:00",
    "dessert,millefeuille,sold out,,2026-10-28 21:00",
    "dessert,tiramisu,sold out,,2026-10-29 23:59",
    "seats,,filling,Upstairs is free,2026-10-29 21:20",
    "cakes,2026-11-07,full,,2026-10-01 09:00",
    "cakes,2026-10-20,full,,2026-10-01 09:00",
    "dessert,raspberry-dome,maybe,,2026-10-29 21:00",
  ), NIGHT, TZ, 45);
  assert.ok(b.ok);
  if (!b.ok) return;
  assert.equal(b.items["pistachio-kunafa"].status, "low");
  assert.equal(b.items["strawberry-tart"], undefined, "a 'low' from 2.5 hours ago is not shown");
  assert.equal(b.items["basque-cheesecake"].status, "sold out", "sold out stands all evening");
  assert.equal(b.items.millefeuille, undefined, "yesterday's sold out never shows");
  assert.equal(b.items.tiramisu, undefined, "a time in the future is ignored");
  assert.equal(b.items["raspberry-dome"], undefined, "an unknown status is ignored");
  assert.equal(b.seats?.state, "filling");
  assert.deepEqual(b.fullDays, ["2026-11-07"], "past full days drop off");
  assert.equal(stateOf(b, { id: "x", name: "Pistachio-Kunafa" })?.status, "low", "the shop can type the name");
  const later = bakesFromCsv(CSV("seats,,filling,,2026-10-29 21:20"), NIGHT + 50 * 60_000, TZ, 45);
  assert.ok(later.ok && later.seats === null, "seats older than the limit go quiet");
  assert.deepEqual(bakesFromCsv("a,b\n1,2", NIGHT, TZ, 45), { ok: false });
});

test("a cake's price, servings, allergens and marks come from the shop's table", () => {
  const q = quote(demo.cakes, demo.cakes.start);
  // two tiers 68 + 48, mirror glaze 12 × 2, raspberries 6, macarons 9, gold leaf 10, plaque 4
  assert.equal(q.price, 68 + 48 + 24 + 6 + 9 + 10 + 4);
  assert.equal(q.servings, 32);
  assert.deepEqual(q.allergens, ["gluten", "eggs", "milk", "nuts"]);
  assert.deepEqual(q.diets, []);
  const vegan = quote(demo.cakes, { stack: "one-6", sponge: "vegan-chocolate", filling: "berry-compote", finish: "sugarpaste", colour: "blush", toppings: ["raspberries", "gold-leaf"], message: "" });
  assert.deepEqual(vegan.diets, ["eggless", "vegan", "halal"]);
  assert.equal(vegan.price, 48 + 6 + 6 + 10);
  const tooMany = quote(demo.cakes, { ...demo.cakes.start, toppings: ["raspberries", "macarons", "gold-leaf", "pearls"] });
  assert.equal(tooMany.toppings.length, demo.cakes.maxToppings, "never more toppings than the shop allows");
  const long = quote(demo.cakes, { ...demo.cakes.start, message: "x".repeat(80) });
  assert.equal(long.message.length, demo.cakes.message.max);
});

test("the earliest cake day: notice, the cut-off, closed days and full days", () => {
  const hours = { timezone: TZ, weekly: { mon: [], tue: [["10:00", "18:00"]], wed: [["10:00", "18:00"]], thu: [["10:00", "18:00"]], fri: [["10:00", "18:00"]], sat: [["10:00", "18:00"]], sun: [] }, exceptions: [{ date: "2026-11-06", ranges: [] }] };
  const c = { leadDays: 3, cutoff: "15:00", maxDaysAhead: 30 };
  // Thursday 29 Oct before 3pm: Sunday 1 Nov is the third day, closed; Monday closed; Tuesday 3 Nov.
  assert.equal(earliestDate(c, { date: "2026-10-29", minutes: 10 * 60 }, /** @type {any} */ (hours), []), "2026-11-03");
  assert.equal(earliestDate(c, { date: "2026-10-27", minutes: 10 * 60 }, /** @type {any} */ (hours), ["2026-10-30"]), "2026-10-31");
  assert.equal(earliestDate(c, { date: "2026-10-27", minutes: 16 * 60 }, /** @type {any} */ (hours), []), "2026-10-31", "after the cut-off it counts from tomorrow");
  assert.equal(earliestDate(c, { date: "2026-11-03", minutes: 9 * 60 }, /** @type {any} */ (hours), []), "2026-11-07", "an exception closes Friday 6th");
  assert.equal(earliestDate({ ...c, maxDaysAhead: 4 }, { date: "2026-10-29", minutes: 600 }, /** @type {any} */ (hours), []), null);
  assert.equal(dayProblem("2026-11-02", "2026-11-03", /** @type {any} */ (hours), []), "That's sooner than we can make it");
  assert.equal(dayProblem("2026-11-08", "2026-11-03", /** @type {any} */ (hours), []), "We're closed that day");
  assert.equal(dayProblem("2026-11-04", "2026-11-03", /** @type {any} */ (hours), ["2026-11-04"]), "We're fully booked for cakes that day");
  assert.equal(dayProblem("2026-11-04", "2026-11-03", /** @type {any} */ (hours), []), null);
});

test("the cake request says everything the shop needs, and the reminder is a year on, early enough", () => {
  const q = quote(demo.cakes, demo.cakes.start);
  const t = requestText(q, { business: "Velvet Spoon", day: "2026-11-07", name: "Sana", note: "", allergenNames: ["Gluten", "Eggs", "Milk", "Tree nuts"] });
  for (const s of ["Two tiers, 8 and 6 inch (serves about 32)", "Sponge: Vanilla", "Finish: Mirror glaze, Framboise", 'Message: "Happy 30th, Amira"', "£169", "Collection: Saturday 7 November", "Name: Sana", "It contains: Gluten, Eggs, Milk, Tree nuts.", "Please confirm"]) assert.ok(t.includes(s), s);
  const ics = reminderIcs({ day: "2026-11-07", occasion: "Amira's 31st", business: "Velvet Spoon", leadDays: 3, url: "https://x.co.uk", stamp: new Date("2026-10-29T12:00:00Z") });
  assert.match(ics, /DTSTART;VALUE=DATE:20271028\r\n/, "ten days before 7 November 2027");
  assert.match(ics, /SUMMARY:Order the cake for Amira's 31st from Velvet Spoon/);
  assert.ok(ics.endsWith("END:VCALENDAR\r\n"));
});

test("filters: every chosen mark, none of the avoided allergens", () => {
  const kunafa = { allergens: ["gluten", "milk", "nuts"], diets: ["eggless", "halal"] };
  const sorbet = { allergens: [], diets: ["vegan", "halal"] };
  assert.ok(passes(kunafa, { diets: ["eggless"], avoid: [] }));
  assert.ok(!passes(kunafa, { diets: ["eggless"], avoid: ["nuts"] }));
  assert.ok(passes(sorbet, { diets: ["eggless", "vegetarian", "halal"], avoid: ["nuts", "milk"] }));
  assert.ok(!passes(kunafa, { diets: ["vegan"], avoid: [] }));
});

test("collection times: from now plus preparation, within the hours, past midnight when open late", () => {
  const h = /** @type {any} */ (demo.hours);
  const fri = collectionSlots(h, "2026-10-30", { date: "2026-10-30", minutes: 23 * 60 + 20 }, { prepMinutes: 20, step: 15 });
  assert.deepEqual(fri, ["23:45", "24:00", "24:15", "24:30", "24:45"]);
  assert.equal(slotLabel("24:30"), "12:30am");
  const mon = collectionSlots(h, "2026-11-02", { date: "2026-10-30", minutes: 0 }, { prepMinutes: 20, step: 15 });
  assert.equal(mon[0], "14:00");
  assert.equal(mon.at(-1), "23:15");
  // Thursday 11:25pm: nothing left today, so the days start tomorrow.
  assert.equal(collectionDays(h, { date: "2026-10-29", minutes: 23 * 60 + 25 }, { prepMinutes: 20, step: 15, daysAhead: 2 })[0], "2026-10-30");
  const b = basket([{ id: "a", name: "Kunafa", price: 8.5, allergens: ["nuts"] }, { id: "b", name: "Sorbet", price: 5.5, allergens: [] }], { a: 2, b: 1 });
  assert.equal(b.total, 22.5);
  assert.equal(b.count, 3);
  const t = collectText({ business: "Velvet Spoon", when: "Today, 9:30pm", items: [{ name: "Kunafa", qty: 2 }], total: 17, name: "", note: "", allergenNames: ["Tree nuts"] });
  assert.ok(t.includes("2 × Kunafa") && t.includes("£17") && t.includes("Today, 9:30pm") && t.includes("It contains: Tree nuts."));
});

test("the party calculator serves everyone, cheapest first", () => {
  const plans = partyPlans(30, demo.parties.servings);
  assert.ok(plans.length > 0 && plans.length <= 3);
  for (const p of plans) assert.ok(p.servings >= 30, "every plan serves everyone");
  assert.ok(plans.every((p, i) => i === 0 || p.price >= plans[i - 1].price), "cheapest first");
  assert.deepEqual(plans[0].items, [{ id: "tray", name: "Brownie and blondie tray", qty: 2 }]);
  assert.deepEqual(partyPlans(0, demo.parties.servings), []);
});

test("open late: closing time, last orders counting down in the final hour", () => {
  const open = /** @type {any} */ ({ open: true, closesAt: 25 * 60, nextOpen: null, note: null });
  assert.deepEqual(lateWords(open, 22 * 60, 30), { close: "Open until 1am tonight.", last: "Last orders 12:30am" });
  assert.equal(lateWords(open, 23 * 60 + 50, 30).last, "Last orders in 40 minutes, at 12:30am");
  assert.equal(lateWords(open, 24 * 60 + 40, 30).last, "Last orders have been taken. Takeaway from the counter until we close.");
  assert.equal(lateWords(/** @type {any} */ ({ open: false, closesAt: null }), 600, 30).close, "Closed right now.");
});

test("settings that would mislead are refused", () => {
  assert.match(errorsFor((s) => { s.desserts.sections[0].items[0].diets.push("vegan"); }), /marked vegan but its allergens include milk/);
  assert.match(errorsFor((s) => { s.desserts.sections.flatMap((/** @type {any} */ x) => x.items).find((/** @type {any} */ i) => i.allergens.includes("eggs")).diets.push("eggless"); }), /marked eggless but its allergens include eggs/);
  assert.match(errorsFor((s) => { delete s.desserts.sections[0].items[0].allergens; }), /allergens: from the shop's allergen chart; \[\] if none/);
  assert.match(errorsFor((s) => { s.desserts.sections[0].items[0].colour = "red"; }), /items\[0\]\.colour: unknown setting/);
  assert.match(errorsFor((s) => { s.bakes.source = "simulated"; }, client), /simulated data is only allowed on demo sites/);
  assert.match(errorsFor((s) => { s.payLinks.items[0].url = "https://buy.stripe.com/demo-x"; }, client), /is a demo link/);
  assert.match(errorsFor((s) => { s.payLinks.items[0].url = "https://buy.stripe.com/live_real"; }), /demo sites use fake links/);
  assert.match(errorsFor((s) => { s.payLinks.items[0].url = "https://example.com/pay"; }), /a Stripe Payment Link/);
  assert.match(errorsFor((s) => { s.cakes.depositLink = "nope"; }), /cakes\.depositLink: "nope" isn't one of payLinks\.items/);
  assert.match(errorsFor((s) => { s.cakes.stacks[2].sizes = ["s6", "s8"]; }), /each tier must be smaller/);
  assert.match(errorsFor((s) => { s.cakes.finishes[0].kind = "sprinkles"; }), /how it's drawn/);
  assert.match(errorsFor((s) => { s.box.start = ["macarons"]; }), /box\.start/);
});

test("a client's sheet is allowed by the security policy; a demo's simulation needs nothing", () => {
  assert.match(headersFile(client, "production"), /connect-src 'self' https:\/\/docs\.google\.com https:\/\/\*\.googleusercontent\.com/);
  assert.doesNotMatch(headersFile(demo, "preview"), /docs\.google\.com/);
});

test("the Cacao look lists every home section once", () => {
  const look = JSON.parse(readFileSync("src/looks/cacao/look.json", "utf8"));
  assert.equal(homeOrderProblem(look.homeOrder), null);
  assert.equal(Object.keys(HOME_PARTS).length, look.homeOrder.length);
  assert.match(String(homeOrderProblem(["bakes"])), /leaves out/);
});

test("tonight's counter: an optional count of what's left, said plainly, and never on a sold-out piece", () => {
  const now = Date.parse("2026-10-29T21:30:00Z");
  const csv = "kind,item,status,note,updated_at,left\ndessert,fig,low,,2026-10-29 21:20,2\ndessert,lemon,available,,2026-10-29 21:20,9\ndessert,apple,sold out,,2026-10-29 21:00,4\ndessert,peach,available,,2026-10-29 21:20,lots";
  const b = bakesFromCsv(csv, now, "Europe/London", 90);
  assert.ok(b.ok);
  const at = (/** @type {string} */ id) => /** @type {import("../../src/kits/bakery/lib/bakes.js").ItemState} */ (stateOf(b, { id, name: id }));
  assert.equal(leftWords(at("fig")), "Only 2 left today");
  assert.equal(leftWords(at("lemon")), "9 left today");
  assert.equal(at("apple").left, 0);
  assert.equal(leftWords(at("apple")), "Sold out today");
  assert.equal(at("peach").left, null, "an unreadable count is ignored");
  assert.equal(leftWords(at("peach")), "On the counter");
});

const P = (/** @type {string} */ id, /** @type {string[]} */ allergens = [], /** @type {number} */ tasteOrder = 50) => ({ id, name: id[0].toUpperCase() + id.slice(1), allergens, tasteOrder });

test("the box: a flat price for its size, full only when every place is filled, allergens add up", () => {
  const places = [P("gianduja", ["milk", "nuts"]), P("raspberry", ["milk"]), null, P("gianduja", ["milk", "nuts"]), null, null];
  const q = boxQuote({ n: 6, price: 12 }, places);
  assert.equal(q.filled, 3);
  assert.equal(q.full, false);
  assert.equal(q.price, 12);
  assert.deepEqual(q.allergens, ["milk", "nuts"]);
  assert.equal(boxQuote({ n: 4, price: 9 }, [P("a"), P("b"), P("c"), P("d"), P("e")]).full, true, "a smaller box keeps only its places");
  assert.deepEqual(GRIDS[16], [4, 4]);
  const text = boxText(boxQuote({ n: 4, price: 9 }, [P("gianduja"), P("gianduja"), P("raspberry"), P("dark")]), { business: "Velvet Spoon", when: "Today, 6:30pm", card: " Happy birthday ", gift: { to: "Sam", from: "" }, allergenNames: [] });
  assert.match(text, /a box of 4 as a gift/);
  assert.match(text, /^2 × Gianduja$/m);
  assert.match(text, /Price on your site: £9/);
  assert.match(text, /Card: "Happy birthday"/);
  assert.match(text, /For Sam, from me\. They'll collect it\./);
  assert.match(text, /None of it lists an allergen\./);
});

test("a gift link reads back exactly, and anything the shop doesn't sell is refused", () => {
  const g = { n: 4, p: ["a", "b", "a", "c"], c: "Für dich ♥", t: "Sam", f: "Jo", w: "Saturday, 2pm" };
  const code = giftEncode(g);
  assert.match(code, /^[A-Za-z0-9_-]+$/, "safe in a URL");
  const ids = new Set(["a", "b", "c"]);
  assert.deepEqual(giftDecode(code, [4, 6], ids), g);
  assert.equal(giftDecode(code, [6, 12], ids), null, "a size the shop doesn't sell");
  assert.equal(giftDecode(code, [4], new Set(["a", "b"])), null, "a piece the shop doesn't make");
  assert.equal(giftDecode(giftEncode({ ...g, p: ["a", "b"] }), [4], ids), null, "a box that isn't full");
  assert.equal(giftDecode("not-a-box", [4], ids), null);
  assert.equal(giftDecode(giftEncode({ ...g, c: "x".repeat(900) }), [4], ids)?.c.length, 300);
  assert.equal(giftShareText({ business: "Velvet Spoon", to: "", from: "Jo", when: "Saturday, 2pm", link: "https://x/gift#g=1" }), "there's a box waiting for you at Velvet Spoon, Saturday, 2pm. From Jo.\nhttps://x/gift#g=1");
});

test("the tasting flight goes lightest first, in the shop's order", () => {
  const chosen = [P("dark", [], 90), P("vanilla", [], 10), P("caramel", [], 70), P("berry", [], 10)];
  assert.deepEqual(flightOrder(chosen).map((p) => p.id), ["berry", "vanilla", "caramel", "dark"]);
  assert.equal(chosen[0].id, "dark", "the choice itself is left alone");
  const text = flightText({ business: "Velvet Spoon", pieces: chosen, price: 9, when: "Today, 8pm" });
  assert.match(text, /a tasting flight of 4/);
  assert.match(text, /^1\. Berry$/m);
  assert.match(text, /^4\. Dark$/m);
  assert.match(text, /Price on your site: £9/);
});

test("the flavour vote counts this week's answers only, for flavours on the list; shares add to 100", () => {
  const cands = [{ id: "fig", name: "Fig and honey" }, { id: "yuzu", name: "Yuzu" }, { id: "malt", name: "Malted milk" }];
  const w = voteWindow("2026-11-01", "Europe/London");
  assert.equal(w.to - w.from, 7 * 86_400_000 - 1000);
  const csv = "Timestamp,Which flavour next?\n01/11/2026 12:00:00,Yuzu\n2026-10-30 09:00,fig and honey \n2026-10-29 10:00,Yuzu\n2026-10-20 10:00,Yuzu\n2026-10-30 10:00,Mango\n2026-11-02 10:00,Fig and honey";
  const v = votesFromCsv(csv, cands, w, "Europe/London");
  assert.ok(v.ok);
  if (v.ok) {
    assert.equal(v.total, 3, "last week, the week after and unknown flavours don't count");
    assert.deepEqual(v.counts, { fig: 1, yuzu: 2, malt: 0 });
  }
  assert.deepEqual(votesFromCsv("nothing", cands, w, "Europe/London"), { ok: false });
  const s = voteShares({ a: 1, b: 1, c: 1 });
  assert.equal(Object.values(s.shares).reduce((x, y) => x + y, 0), 100);
  assert.equal(s.leader, null, "a tie has no leader");
  assert.equal(voteShares({ a: 3, b: 1 }).leader, "a");
  assert.equal(voteShares({ a: 0, b: 0 }).leader, null);
  assert.equal(voteLink("https://docs.google.com/forms/d/e/X/viewform", "entry.123", "Fig and honey"), "https://docs.google.com/forms/d/e/X/viewform?usp=pp_url&entry.123=Fig+and+honey");
});

test("favours: the price per box drops at the shop's quantities; the seal keeps one letter each and a short line", () => {
  const f = { options: [{ id: "two", name: "Two chocolates", price: 4.5 }, { id: "four", name: "Four chocolates", price: 8 }], minQty: 20, maxQty: 500, leadDays: 14, breaks: [{ from: 100, less: 0.5 }, { from: 250, less: 1 }] };
  const q = favourQuote(f, { option: "two", qty: 120 });
  assert.equal(q.per, 4);
  assert.equal(q.total, 480);
  assert.equal(q.saving, 60);
  assert.deepEqual(q.nextBreak, { from: 250, less: 1 });
  assert.equal(favourQuote(f, { option: "four", qty: 3 }).qty, 20, "never under the shop's minimum");
  assert.equal(favourQuote(f, { option: "four", qty: 9999 }).qty, 500);
  assert.equal(favourQuote(f, { option: "four", qty: 300 }).per, 7);
  assert.equal(favourEarliest("2026-10-29", 14), "2026-11-12");
  assert.deepEqual(sealOf({ a: " amira", b: "élan", line: "  amira   &   sam · 14 june 2027 and much more text " }), { a: "A", b: "É", line: "AMIRA & SAM · 14 JUNE 2027 AND" });
  assert.equal(sealOf({ a: "7", b: "", line: "" }).a, "", "letters only");
  const text = favourText(q, { business: "Velvet Spoon", day: "Saturday 14 November", occasion: "Our wedding", seal: sealOf({ a: "a", b: "s", line: "14 June" }) });
  assert.match(text, /120 favour boxes: Two chocolates/);
  assert.match(text, /£4 a box, £480 in all/);
  assert.match(text, /Our seal: A & S, "14 JUNE" around it/);
});

test("the advent box: a preview before December, one more window each day, all open after the 24th", () => {
  assert.deepEqual(adventState("2026-10-29", 2026), { mode: "preview", today: 0 });
  assert.deepEqual(adventState("2026-12-09", 2026), { mode: "live", today: 9 });
  assert.equal(adventState("2026-12-25", 2026).mode, "after");
  assert.equal(adventState("2027-01-03", 2026).mode, "after");
  const live = adventState("2026-12-09", 2026);
  assert.ok(canOpen(live, 9) && !canOpen(live, 10));
  assert.ok(canOpen(adventState("2026-11-30", 2026), 24));
  const d = doorOrder(7);
  assert.deepEqual([...d].sort((a, b) => a - b), Array.from({ length: 24 }, (_, i) => i + 1));
  assert.deepEqual(doorOrder(7), d, "the same layout every time");
  assert.notDeepEqual(d, Array.from({ length: 24 }, (_, i) => i + 1));
  const b = behindDoors([{ id: "a" }, { id: "b" }, { id: "c" }], ["c"]);
  assert.equal(b.length, 24);
  assert.deepEqual(b.slice(0, 4).map((x) => x.id), ["c", "b", "c", "a"]);
});

test("posting a box: the next send day before the cut-off, usually there the next day, never on a Sunday, a bank holiday or Christmas", () => {
  const p = { price: 4.95, days: ["tue", "thu", "sat"], cutoff: "12:00" };
  // Thursday 29 October, 9:30am: today's post, there on Friday.
  assert.deepEqual(nextPost(p, { date: "2026-10-29", weekday: 4, minutes: 570 }), { orderBy: { date: "2026-10-29", time: "12:00" }, sends: "2026-10-29", arrives: "2026-10-30" });
  // Thursday after noon: Saturday's post, there on Monday.
  assert.deepEqual(nextPost(p, { date: "2026-10-29", weekday: 4, minutes: 13 * 60 }), { orderBy: { date: "2026-10-31", time: "12:00" }, sends: "2026-10-31", arrives: "2026-11-02" });
  // Christmas: sent Thursday 24 December, it can't arrive on the 25th, the 26th, Sunday or Monday 28th (Boxing Day's
  // bank holiday): it's due Tuesday 29 December.
  assert.equal(nextPost(p, { date: "2026-12-23", weekday: 3, minutes: 600 })?.arrives, "2026-12-29");
  // A posting day the shop is closed (or a bank holiday) isn't a send day.
  const hours = { timezone: "Europe/London", weekly: { tue: [["10:00", "18:00"]], thu: [["10:00", "18:00"]], sat: [["10:00", "18:00"]] }, exceptions: [{ date: "2026-10-29", ranges: [] }] };
  assert.equal(nextPost(p, { date: "2026-10-29", weekday: 4, minutes: 570 }, { hours })?.sends, "2026-10-31");
  assert.equal(nextPost(p, { date: "2026-12-25", weekday: 5, minutes: 600 })?.sends, "2026-12-29", "nothing goes out on the 26th, or Monday 28th (Boxing Day's bank holiday)");
  assert.equal(nextPost(p, { date: "2027-03-27", weekday: 6, minutes: 600 })?.arrives, "2027-03-30", "Easter 2027: a Saturday post skips Sunday and Easter Monday");
});

test("take-home gelato: no more flavours than the tub holds", () => {
  const tub = { id: "litre", name: "litre tub", price: 16, flavours: 3 };
  const fl = ["Pistachio", "Gianduja", "Caramel", "Lime"].map((name) => ({ id: name.toLowerCase(), name }));
  const q = tubQuote(tub, fl);
  assert.equal(q.flavours.length, 3);
  assert.ok(q.full);
  assert.equal(tubQuote(tub, fl.slice(0, 1)).left, 2);
  assert.match(tubText(q, { business: "Velvet Spoon", when: "Today, 6pm" }), /a litre tub to take home:\n\nPistachio\nGianduja\nCaramel\nPrice on your site: £16/);
});

test("the kitchen line: today's newest note, quiet after six hours", () => {
  const now = Date.parse("2026-10-29T15:00:00Z");
  const csv = "kind,item,status,note,updated_at\nkitchen,,,\"Tempering raspberry, out at 4\",2026-10-29 13:40\nkitchen,,,Old news,2026-10-29 08:00\n";
  const b = bakesFromCsv(csv, now, "Europe/London", 90);
  assert.ok(b.ok && b.kitchen?.note === "Tempering raspberry, out at 4");
  const late = bakesFromCsv(csv, Date.parse("2026-10-29T20:00:00Z"), "Europe/London", 90);
  assert.ok(late.ok && late.kitchen === null);
});
