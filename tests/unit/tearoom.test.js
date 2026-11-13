import { test } from "node:test";
import assert from "node:assert/strict";
import { standFor, standNote, needsLine, teasFor, teaKinds, musicNow, teaTotal, teaRequestText, TEA_KINDS as LIB_KINDS, CAFFEINE as LIB_CAFFEINE, teaFor, standSummary, giftMessage, INSCRIPTION_MAX, seasonFor } from "../../src/kits/restaurant/lib/tearoom.js";
import { boxContents, boxStep, boxMessage, collectDays } from "../../src/kits/restaurant/lib/window.js";
import { readFileSync } from "node:fs";
import { validateSite } from "../../src/core/lib/config.js";
import { loadCatalog } from "../../scripts/lib/catalog.js";
import { TEA_KINDS, CAFFEINE } from "../../src/kits/restaurant/config.js";
import { collectionDays, depositFor } from "../../src/kits/restaurant/lib/order.js";
import { homeOrderProblem } from "../../src/kits/restaurant/home.js";

const tiers = [
  { id: "sandwiches", name: "Sandwiches", dishes: [
    { id: "cucumber", name: "Cucumber", diets: ["vegan"], allergens: ["gluten"] },
    { id: "egg", name: "Egg and cress", diets: ["vegetarian"], allergens: ["gluten", "eggs", "milk"] },
    { id: "salmon", name: "Smoked salmon", allergens: ["gluten", "fish", "milk"] },
  ] },
  { id: "scones", name: "Scones", dishes: [{ id: "scone", name: "Plain scone", diets: ["vegetarian"], allergens: ["gluten", "eggs", "milk"] }] },
];
const guest = (diets = [], avoid = []) => ({ diets, avoid });
const services = [{ id: "classic", name: "Afternoon tea", price: 75 }, { id: "champagne", name: "With champagne", price: 92.5 }];
const teas = [
  { id: "chamomile", name: "Chamomile", kind: "herbal", caffeine: "none" },
  { id: "darjeeling", name: "Darjeeling first flush", kind: "black", caffeine: "medium" },
  { id: "sencha", name: "Sencha", kind: "green", caffeine: "low" },
];

test("the stand: each tier as served for a guest, and why a piece isn't for them", () => {
  const s = standFor(guest(["vegetarian"], ["eggs"]), tiers);
  assert.deepEqual(s[0].fits.map((d) => d.id), ["cucumber"]);
  assert.deepEqual(s[0].not.map((n) => [n.dish.id, n.why]), [["egg", ["has eggs"]], ["salmon", ["not vegetarian"]]]);
  assert.equal(s[1].fits.length, 0);
  assert.equal(needsLine(guest(["vegan"], ["sesame"])), "vegan, no sesame");
  assert.equal(needsLine(guest()), "");
});

test("the stand's note: all as served, swaps by the kitchen, or ask us when it doesn't swap", () => {
  assert.equal(standNote(guest(), tiers, true), "Everything on the stand, as served.");
  assert.equal(standNote(guest(["vegan"]), tiers, true), "3 pieces made differently for you; we'll confirm when we reply.");
  assert.equal(standNote(guest([], ["fish"]), tiers, false), "1 piece isn't suitable; ask us what we can do.");
});

test("the tea library: by kind, caffeine-free only, and only the kinds it has", () => {
  assert.deepEqual(teasFor(teas, {}).map((t) => t.id), ["darjeeling", "sencha", "chamomile"]);
  assert.deepEqual(teasFor(teas, { kind: "green" }).map((t) => t.id), ["sencha"]);
  assert.deepEqual(teasFor(teas, { caffeineFree: true }).map((t) => t.id), ["chamomile"]);
  assert.deepEqual(teaKinds(teas), ["black", "green", "herbal"]);
});

test("live music: playing now, else the next set, from the café's own times", () => {
  const sets = [
    { days: ["wed", "thu"], from: "15:00", to: "18:00", who: "Harp", what: "Debussy to Beatles" },
    { days: ["fri"], from: "19:00", to: "22:00", who: "Piano", what: "Standards" },
  ];
  assert.equal(musicNow(sets, { weekday: 3, minutes: 16 * 60 }).playing?.who, "Harp");
  const later = musicNow(sets, { weekday: 3, minutes: 18 * 60 });
  assert.equal(later.playing, null);
  assert.equal(later.next?.set.who, "Harp");
  assert.equal(later.next?.inDays, 1);
  assert.deepEqual(musicNow([], { weekday: 3, minutes: 0 }), { playing: null, next: null });
});

test("the sitting request: each guest's service, tea and needs, the total at menu prices, never a booking", () => {
  const guests = [{ service: "classic", tea: "darjeeling", ...guest() }, { service: "champagne", tea: "chamomile", ...guest(["vegan"], ["sesame"]) }];
  assert.equal(teaTotal(guests, services), 16750);
  const text = teaRequestText({ opening: "Hello, we'd like afternoon tea:", sitting: "Afternoon tea", day: "Sat 31 Oct", time: "3:30pm", guests, services, teas, swaps: true });
  assert.equal(text, [
    "Hello, we'd like afternoon tea:", "",
    "Table for 2", "Sat 31 Oct, Afternoon tea, 3:30pm",
    "We'd like to pre-order:",
    "Guest 1: Afternoon tea · Darjeeling first flush",
    "Guest 2: With champagne · Chamomile · vegan, no sesame",
    "£167.50 at menu prices",
    "Please make the stand to suit each guest's needs above.",
  ].join("\n"));
  assert.doesNotMatch(teaRequestText({ opening: "Hi", sitting: "Tea", day: "d", time: "t", guests: [guests[0]], services, teas, swaps: false }), /needs/);
});

const base = JSON.parse(readFileSync("sites/demos/cafe/site.json", "utf8"));
const catalog = loadCatalog(process.cwd());
const withTea = (/** @type {(s: any) => void} */ change) => {
  const s = structuredClone(base);
  s.tea = { sitting: "lunch", tiers: ["lunch", "bakes"], services: services.map((x) => ({ ...x })), swaps: true, library: teas.map((x) => ({ ...x, steep: { minutes: 3, celsius: 85 } })) };
  s.music = { sets: [{ days: ["sat"], from: "15:00", to: "18:00", who: "Harp", what: "Light classics" }] };
  s.dressCode = { summary: "Smart casual. No sportswear.", rules: ["Jackets welcome, not required"], checked: "2026-10-28" };
  change(s);
  return validateSite(s, { catalog }).join("\n");
};

test("tea, music and dress-code settings: valid as written, and wrong values refused", () => {
  assert.deepEqual(LIB_KINDS, TEA_KINDS);
  assert.deepEqual(LIB_CAFFEINE, CAFFEINE);
  assert.equal(withTea(() => {}), "");
  assert.match(withTea((s) => { s.tea.sitting = "supper"; }), /tea\.sitting/);
  assert.match(withTea((s) => { s.tea.tiers = ["lunch"]; }), /tea\.tiers/);
  assert.match(withTea((s) => { s.tea.swaps = "yes"; }), /tea\.swaps/);
  assert.match(withTea((s) => { s.tea.library[0].caffeine = "decaf"; }), /tea\.library\[0\]\.caffeine/);
  assert.match(withTea((s) => { s.tea.library[0].steep = { minutes: 3 }; }), /tea\.library\[0\]\.steep/);
  assert.match(withTea((s) => { s.tea.services[0].price = 0; }), /tea\.services\[0\]\.price/);
  assert.match(withTea((s) => { s.music.sets[0].to = "14:00"; }), /music\.sets\[0\]/);
  assert.match(withTea((s) => { s.music.sets[0].days = ["someday"]; }), /music\.sets\[0\]\.days/);
  assert.match(withTea((s) => { delete s.dressCode.checked; }), /dressCode\.checked/);
  assert.match(withTea((s) => { s.dressCode.etiquette = []; }), /dressCode\.etiquette/);
  assert.match(withTea((s) => { s.dressCode.colour = "black"; }), /dressCode\.colour/);
});

const grenat = JSON.parse(readFileSync("sites/demos/grand-cafe/site.json", "utf8"));
const grenatErrors = (/** @type {(s: any) => void} */ change) => { const s = structuredClone(grenat); change(s); return validateSite(s, { catalog }).join("\n"); };

test("the Grenat demo is valid, and the Salon look lists every home section once", () => {
  assert.equal(grenatErrors(() => {}), "");
  assert.equal(homeOrderProblem(catalog.looks.salon.homeOrder), null);
});

test("the tea sommelier: strength, milk and the hour decide; no caffeine in the evening; ties keep the library's order", () => {
  const lib = grenat.tea.library;
  assert.equal(teaFor(lib, { when: "afternoon", milk: true, strength: "medium" }).pick?.id, "grenat-blend");
  assert.equal(teaFor(lib, { when: "morning", milk: true, strength: "full" }).pick?.id, "assam");
  assert.equal(teaFor(lib, { when: "evening", milk: false, strength: "light" }).pick?.id, "chamomile");
  assert.equal(teaFor(lib, { when: "evening", milk: true, strength: "medium" }).pick?.caffeine, "none");
  const r = teaFor(lib, { when: "afternoon", milk: false, strength: "light" });
  assert.ok(r.pick && r.also && r.pick.id !== r.also.id);
  assert.deepEqual(teaFor([], { when: "morning", milk: true, strength: "full" }), { pick: null, also: null });
});

test("Your table: one line for the request with each guest's tea and needs, the occasion and the plate's words", () => {
  const svc = grenat.tea.services;
  const g = [{ service: "classic", diets: [], avoid: [] }, { service: "champagne", diets: ["vegan"], avoid: ["sesame"] }, { service: "classic", diets: [], avoid: [] }];
  assert.deepEqual(standSummary(g, svc, { occasion: "birthday", inscription: "Happy birthday, Clara" }), {
    count: 3,
    summary: "3 guests: Afternoon tea (2), With a glass of champagne (1). Guest 2: vegan, no sesame. A birthday; on the plate: “Happy birthday, Clara”.",
  });
  assert.equal(standSummary([g[0]], svc).summary, "1 guest: Afternoon tea (1).");
  const named = [{ ...g[0], name: "Sam" }, { ...g[1], name: "Clara" }];
  assert.equal(standSummary(named, svc, { champagne: { name: "Rosé champagne, the bottle", price: 110 } }).summary,
    "2 guests: Afternoon tea (1), With a glass of champagne (1). Guest 2 (Clara): vegan, no sesame. Place cards: Sam, Clara. For the table: Rosé champagne, the bottle, £110.");
  assert.equal(standSummary([g[0]], svc, { occasion: "anniversary" }).summary, "1 guest: Afternoon tea (1). An anniversary.");
  assert.equal(standSummary([g[0]], svc, { occasion: "birthday", inscription: "x".repeat(40) }).summary.match(/x+/)?.[0].length, INSCRIPTION_MAX);
});

test("Give a sitting: the message carries the gift, the names and the card's words, and says it's paid", () => {
  const gift = grenat.giveSitting.gifts[0];
  assert.equal(giftMessage({ opening: "Hello", gift, to: "Clara", from: "Sam", note: "Happy birthday", paid: true }),
    "Hello\n\nAfternoon tea for two, £136\nFor: Clara\nFrom: Sam\nOn the card: “Happy birthday”\nI've paid by card online.");
  assert.match(giftMessage({ opening: "Hello", gift: { name: "Tea", price: 12.5 }, to: "", from: "", note: "", paid: false }), /Tea, £12\.50\nHow can I pay\?$/);
});

test("cakes to order: the first day is after the longest notice in the order, closed days skipped; a deposit only over the threshold", () => {
  const shut = new Set(["2026-11-02"]); // a Monday the shop is shut
  const open = (/** @type {string} */ d) => !shut.has(d);
  const r = collectionDays([{ dish: { leadDays: 2 } }, { dish: { leadDays: 7 } }], "2026-10-28", open, 10);
  assert.equal(r.lead, 7);
  assert.equal(r.days[0], "2026-11-04");
  assert.deepEqual(collectionDays([], "2026-10-30", open, 3).days, ["2026-10-30", "2026-10-31", "2026-11-01"]);
  assert.equal(collectionDays([{ dish: { leadDays: 7 } }], "2026-10-28", open, 3).days.length, 1);
  const dep = { from: 60, amount: 20, link: "https://buy.stripe.com/test_x" };
  assert.equal(depositFor(5999, dep), null);
  assert.deepEqual(depositFor(9500, dep), { pence: 2000, link: dep.link });
  assert.equal(depositFor(9500, undefined), null);
});

test("Grenat's settings: Stripe links by mode, lead days, the stand's photos, the hero's rooms", () => {
  assert.match(grenatErrors((s) => { s.giveSitting.gifts[0].link = "https://buy.stripe.com/live_abc"; }), /giveSitting\.gifts\[0\]\.link.*test-mode/);
  assert.match(grenatErrors((s) => { s.giveSitting.gifts[0].link = "https://example.com/pay"; }), /giveSitting\.gifts\[0\]\.link/);
  assert.match(grenatErrors((s) => { s.order.deposit.link = "https://buy.stripe.com/abc"; }), /order\.deposit\.link/);
  assert.match(grenatErrors((s) => { s.order.daysAhead = 0; }), /order\.daysAhead/);
  assert.match(grenatErrors((s) => { s.menu.sections.find((x) => x.id === "cakes").dishes[0].leadDays = 40; }), /leadDays/);
  assert.match(grenatErrors((s) => { delete s.stand.photos["tea-scones"]; }), /stand\.photos\.tea-scones/);
  assert.match(grenatErrors((s) => { s.stand.photos.extra = s.stand.photos["tea-scones"]; }), /stand\.photos\.extra/);
  assert.match(grenatErrors((s) => { delete s.stand; }), /stand.*your-table/);
  assert.match(grenatErrors((s) => { s.tea.library[0].strength = "bold"; }), /tea\.library\[0\]\.strength/);
  assert.match(grenatErrors((s) => { delete s.hero.room.evening.srcSmall; }), /hero\.room\.evening\.srcSmall/);
  assert.match(grenatErrors((s) => { s.music.photo = { src: "x.jpg" }; }), /music\.photo/);
  assert.match(grenatErrors((s) => { s.stand.champagne.bottles = ["croissant"]; }), /stand\.champagne\.bottles/);
  const client = structuredClone(grenat);
  client.mode = "client";
  assert.match(validateSite(client, { catalog }).join("\n"), /test-mode link; client sites need/);
});

test("the window's box: fills to its size, never a sold-out piece, and the message lists each piece and when to collect", () => {
  const pieces = [{ id: "eclair", name: "Éclair fraise", price: 7.5 }, { id: "dome", name: "Dôme chocolat", price: 9.5 }];
  const box = { id: "six", name: "The box of six", count: 6, price: 42, link: "https://buy.stripe.com/test_x" };
  let c = {};
  for (let i = 0; i < 4; i++) c = boxStep(c, "dome", 1, box);
  c = boxStep(c, "eclair", 1, box, ["eclair"]);
  assert.deepEqual(c, { dome: 4 }, "a sold-out piece can't go in");
  c = boxStep(boxStep(boxStep(c, "eclair", 1, box), "eclair", 1, box), "eclair", 1, box);
  assert.deepEqual(c, { dome: 4, eclair: 2 }, "never past the box's size");
  const full = boxContents(c, pieces, box);
  assert.equal(full.full, true);
  assert.equal(full.left, 0);
  assert.deepEqual(boxStep(c, "eclair", -1, box), { dome: 4, eclair: 1 });
  assert.deepEqual(boxStep({ dome: 1 }, "dome", -1, box), {});
  assert.equal(boxContents({ dome: 1 }, pieces, box).left, 5);
  assert.equal(boxMessage({ opening: "Good morning.", box, lines: full.lines, when: "Tomorrow", name: "Clara" }),
    "Good morning.\n\nThe box of six, £42\n2 × Éclair fraise\n4 × Dôme chocolat\nTo collect: Tomorrow\nName: Clara\nI've paid by card online.");
});

test("seasonal stands: the one being served leads, else the next; the list in date order", () => {
  const seasons = [
    { id: "valentine", name: "Valentine's", from: "2027-02-12", to: "2027-02-14", price: 88, text: "" },
    { id: "christmas", name: "Christmas", from: "2026-11-27", to: "2026-12-31", price: 82, text: "" },
  ];
  assert.deepEqual(seasonFor(seasons, "2026-10-28").all.map((x) => x.id), ["christmas", "valentine"]);
  assert.equal(seasonFor(seasons, "2026-10-28").now, null);
  assert.equal(seasonFor(seasons, "2026-10-28").next?.id, "christmas");
  assert.equal(seasonFor(seasons, "2026-12-31").now?.id, "christmas");
  assert.equal(seasonFor(seasons, "2026-12-31").next?.id, "valentine");
  assert.equal(seasonFor(seasons, "2027-03-01").next, null);
});

test("Grenat's window, salon plan, seasons and pages: settings checked", () => {
  assert.match(grenatErrors((s) => { s.window.sections = ["nope"]; }), /window\.sections\[0\]/);
  assert.match(grenatErrors((s) => { delete s.menu.sections.find((x) => x.id === "window").dishes[0].photo; }), /every piece in "window" needs a "photo"/);
  assert.match(grenatErrors((s) => { s.window.boxes[0].count = 1; }), /window\.boxes\[0\]\.count/);
  assert.match(grenatErrors((s) => { s.window.boxes[0].link = "https://buy.stripe.com/live_x"; }), /window\.boxes\[0\]\.link/);
  assert.match(grenatErrors((s) => { s.salonPlan.spots[0].x = 120; }), /salonPlan\.spots\[0\]/);
  assert.match(grenatErrors((s) => { s.tea.seasons[0].to = "2026-11-01"; }), /tea\.seasons\[0\]/);
  assert.match(grenatErrors((s) => { delete s.teaPage.title; }), /teaPage\.title/);
  assert.match(grenatErrors((s) => { delete s.giftsPage; }), /giftsPage/);
  assert.match(grenatErrors((s) => { s.plan = "plus"; }), /the-window/);
});

test("the box's collection days: today only while there's time before closing; the message sends the date, not 'today'", () => {
  const hours = { timezone: "Europe/London", weekly: { mon: [["08:00", "23:00"]], tue: [["08:00", "23:00"]], wed: [["08:00", "23:00"]], thu: [["08:00", "23:00"]], fri: [["08:00", "23:00"]], sat: [["08:00", "23:00"]], sun: [] } };
  const afternoon = collectDays(hours, { date: "2026-10-28", minutes: 15 * 60 + 30 });
  assert.deepEqual(afternoon[0], { date: "2026-10-28", text: "Wednesday 28 October", label: "Today, Wednesday 28 October" });
  assert.equal(afternoon[1].label, "Tomorrow, Thursday 29 October");
  assert.equal(afternoon.length, 7);
  assert.ok(!afternoon.some((d) => d.date === "2026-11-01"), "closed Sundays are skipped");
  const late = collectDays(hours, { date: "2026-10-28", minutes: 23 * 60 + 40 });
  assert.equal(late[0].label, "Tomorrow, Thursday 29 October");
  assert.equal(collectDays(hours, { date: "2026-10-28", minutes: 22 * 60 + 45 })[0].date, "2026-10-29", "not within half an hour of closing");
  assert.equal(collectDays(hours, { date: "2026-10-28", minutes: 22 * 60 + 30 })[0].date, "2026-10-28");
});

test("seasonal stands need at least one season", () => {
  assert.match(grenatErrors((s) => { delete s.tea.seasons; }), /tea\.seasons.*seasonal-tea/);
});
