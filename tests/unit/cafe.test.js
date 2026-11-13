import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { tonightFromCsv } from "../../src/kits/restaurant/lib/tonight.js";
import { counterNow, bakeTag } from "../../src/kits/restaurant/lib/counter.js";
import { priceDrink, readyTimes, usualMessage } from "../../src/kits/restaurant/lib/usual.js";
import { usualAt, dayBars, quieterFrom, laptopWindows, windowLabel } from "../../src/kits/restaurant/lib/busy.js";
import { seatsFor, seatLabel, SEAT_NEED_IDS } from "../../src/kits/restaurant/lib/seats.js";
import { brunchOrder, brunchSummary } from "../../src/kits/restaurant/lib/brunch.js";
import { tableRequestText } from "../../src/kits/restaurant/lib/request.js";
import { HOME_PARTS, CAFE_PARTS, homeOrderFor, homeOrderProblem } from "../../src/kits/restaurant/home.js";
import { SEAT_HAS, WORK_TOPICS } from "../../src/kits/restaurant/config.js";
import { validateSite } from "../../src/core/lib/config.js";
import { loadCatalog } from "../../scripts/lib/catalog.js";
import { wallTimeToUtc } from "../../src/core/lib/hours.js";

const demo = JSON.parse(readFileSync("sites/demos/cafe/site.json", "utf8"));
const catalog = loadCatalog(process.cwd());
const errorsFor = (/** @type {(s: any) => void} */ change, base = demo) => { const s = structuredClone(base); change(s); return validateSite(s, { catalog }).join("\n"); };
const TZ = "Europe/London";
/** 28 Oct 2026 (GMT) at a London wall time. @param {string} hm */
const at = (hm, day = 28) => wallTimeToUtc({ year: 2026, month: 10, day, hour: Number(hm.slice(0, 2)), minute: Number(hm.slice(3)) }, TZ);
const csv = (/** @type {string[]} */ ...rows) => ["kind,name,price,note,updated_at", ...rows].join("\n");
/** @param {number} weekday @param {string} hm */
const zoned = (weekday, hm, date = "2026-10-28") => ({ date, weekday, minutes: Number(hm.slice(0, 2)) * 60 + Number(hm.slice(3)) });

test("the Morrow demo is valid, and the Counter look lists every home section once", () => {
  assert.deepEqual(validateSite(demo, { catalog }), []);
  assert.equal(homeOrderProblem(catalog.looks.counter.homeOrder), null);
});

test("looks made before the café sections still pass, and show them before the page links", () => {
  const old = Object.keys(HOME_PARTS).filter((id) => !CAFE_PARTS.includes(id));
  assert.equal(homeOrderProblem(old), null);
  assert.match(homeOrderProblem(old.filter((id) => id !== "menu")) ?? "", /leaves out: menu/);
  const order = homeOrderFor(old);
  assert.deepEqual(order.slice(order.indexOf("page-links") - CAFE_PARTS.length, order.indexOf("page-links")), CAFE_PARTS);
  assert.deepEqual(homeOrderFor(null), Object.keys(HOME_PARTS));
});

test("the sheet: fresh trays, a bake back after selling out, busy while fresh, board cards for a week", () => {
  const r = tonightFromCsv(csv(
    "fresh,cardamom-knot,,,2026-10-28 08:10",
    "fresh,Butter croissant,,,2026-10-28 07:20",
    "fresh,Butter croissant,,,2026-10-28 10:50",
    "soldout,almond-croissant,,,2026-10-28 09:40",
    "soldout,scone,,,2026-10-28 09:00",
    "fresh,scone,,,2026-10-28 10:30",
    "fresh,banana-bread,,,2026-10-27 07:30",
    "busy,steady,,About four minutes,2026-10-28 10:50",
    "busy,rammed,,,2026-10-28 10:55",
    "board,Guest roaster,,Larkhill: a washed Ethiopian,2026-10-22 07:30",
    "board,Dog of the week,,Biscuit,2026-10-20 07:30",
    "board,Guest roaster,,Old card,2026-10-21 07:30",
  ), at("11:00"), TZ, 30);
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.deepEqual(r.soldOut, ["almond-croissant"]);
  assert.deepEqual(r.fresh.map((f) => f.name).sort(), ["butter croissant", "cardamom-knot", "scone"]);
  assert.equal(r.fresh.find((f) => f.name === "butter croissant")?.at, at("10:50"));
  assert.equal(r.busy?.state, "steady");
  assert.equal(r.busy?.note, "About four minutes");
  assert.deepEqual(r.board.map((c) => c.text), ["Larkhill: a washed Ethiopian"]);
  const later = tonightFromCsv(csv("busy,steady,,,2026-10-28 10:00"), at("11:00"), TZ, 30);
  assert.ok(later.ok && later.busy === null, "an old busy row is never shown as now");
});

test("restaurants' sheets read exactly as before", () => {
  const r = tonightFromCsv(csv("tables,few,,Bar seats free,2026-10-28 18:40", "special,Lamb neck shawarma,19,Until it's gone,2026-10-28 11:05", "soldout,whole-bream,,,2026-10-28 19:12"), at("19:20"), TZ, 45);
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.deepEqual(r.soldOut, ["whole-bream"]);
  assert.equal(r.tables?.state, "few");
  assert.deepEqual(r.specials, [{ name: "Lamb neck shawarma", price: 19, note: "Until it's gone" }]);
  assert.deepEqual([r.fresh, r.board, r.busy], [[], [], null]);
  assert.deepEqual(tonightFromCsv("nonsense", at("19:20"), TZ, 45), { ok: false });
});

test("the counter: fresh for its window, then baked; sold out; nothing said when the sheet can't be read", () => {
  const bakes = [{ id: "butter-croissant", name: "Butter croissant" }, { id: "almond-croissant", name: "Almond croissant" }, { id: "scone", name: "Scone" }];
  const r = tonightFromCsv(csv("fresh,butter-croissant,,,2026-10-28 10:50", "soldout,Almond croissant,,,2026-10-28 09:40"), at("11:00"), TZ, 30);
  const now = counterNow(bakes, r, at("11:00"), 45);
  assert.deepEqual(now.map((b) => b.state), ["fresh", "out", ""]);
  assert.equal(bakeTag(now[0], TZ), "Fresh out 10:50am");
  assert.equal(bakeTag(now[1], TZ), "Sold out");
  assert.equal(bakeTag(now[2], TZ), "");
  assert.equal(counterNow(bakes, r, at("11:40"), 45)[0].state, "baked");
  assert.equal(bakeTag(counterNow(bakes, r, at("11:40"), 45)[0], TZ), "Baked 10:50am");
  assert.deepEqual(counterNow(bakes, { ok: false }, at("11:00"), 45).map((b) => b.state), ["unknown", "unknown", "unknown"]);
});

test("your usual: the café's own prices, each milk's allergens, and fallbacks for an old saved usual", () => {
  const u = demo.usual;
  const fw = priceDrink(u, { drink: "flat-white", size: "regular", milk: "oat", shots: 1, cup: "takeaway" });
  assert.equal(fw.pence, 350 + 40 + 60);
  assert.deepEqual(fw.allergens, ["gluten"]);
  assert.equal(fw.label, "Flat white (regular, oat milk, 1 extra shot, to take away)");
  assert.equal(fw.short, "Oat flat white");
  const mocha = priceDrink(u, { drink: "mocha", size: "large", milk: "almond", syrup: "vanilla", decaf: true, hot: true, cup: "own" });
  assert.equal(mocha.pence, 430 + 40 + 50 + 0 - 25);
  assert.deepEqual(mocha.allergens.sort(), ["nuts", "soya"]);
  assert.match(mocha.label, /decaf, extra hot, in my own cup/);
  const black = priceDrink(u, { drink: "long-black", size: "small", milk: "oat", shots: 9 });
  assert.deepEqual([black.choice.size, black.choice.milk, black.choice.shots], ["regular", "", 3]);
  assert.equal(black.pence, 300 + 3 * 60);
  assert.deepEqual(black.allergens, []);
  const gone = priceDrink(u, { drink: "pumpkin-spice", size: "venti", milk: "goat" });
  assert.equal(gone.choice.drink, u.drinks[0].id);
  assert.equal(gone.choice.milk, "whole");
});

test("ready times: now plus the café's prep time, inside opening hours", () => {
  const h = demo.hours, prep = demo.usual.prepMinutes;
  assert.deepEqual(readyTimes(h, zoned(3, "09:02"), prep).times.slice(0, 3), [9 * 60 + 10, 9 * 60 + 20, 9 * 60 + 30]);
  assert.deepEqual(readyTimes(h, zoned(3, "15:40"), prep).times, [15 * 60 + 50]);
  assert.deepEqual(readyTimes(h, zoned(3, "15:52"), prep).times, []);
  const early = readyTimes(h, zoned(3, "06:50"), prep);
  assert.equal(early.opensAt, 7 * 60 + 30);
  assert.equal(early.times[0], 7 * 60 + 40);
  const evening = readyTimes(h, zoned(3, "19:00"), prep);
  assert.deepEqual(evening.times, []);
  assert.deepEqual(evening.nextOpen, { date: "2026-10-29", minutes: 7 * 60 + 30 });
});

test("the order-ahead message lists each drink and bake, the total, the time and the allergens", () => {
  const fw = priceDrink(demo.usual, { drink: "flat-white", size: "regular", milk: "whole", cup: "here" });
  const msg = usualMessage([fw], [{ name: "Cardamom knot", price: 3.6, allergens: ["gluten", "milk", "eggs"] }], { opening: "Hi Morrow", time: 9 * 60 + 15, name: "Sam", seat: "the window bench (by the window)" });
  assert.match(msg, /^Hi Morrow\n\n1 × Flat white \(regular, whole milk, to drink here\), £3\.50\n1 × Cardamom knot, £3\.60\nTotal: £7\.10\nCollection: about 9:15am\nName: Sam\nAllergens in this order: Gluten, Eggs, Milk/);
  assert.match(msg, /Notes: Where I'd like to sit, if it's free: the window bench \(by the window\)/);
  assert.match(msg, /Please confirm the order, the time and the allergens/);
});

test("busyness from the café's own numbers: closed hours have no number, quieter later, laptop stretches", () => {
  const b = demo.busy;
  assert.equal(usualAt(b, 3, 8 * 60 + 30), 3);
  assert.equal(usualAt(b, 6, 7 * 60 + 30), null);
  assert.equal(usualAt(b, 3, 20 * 60), null);
  assert.equal(dayBars(b, 0)[0].start, 9 * 60);
  assert.equal(quieterFrom(b, 3, 8 * 60 + 30, 3), 9 * 60);
  assert.deepEqual(laptopWindows(b, 2).map(windowLabel), ["10am–12pm", "2pm–4pm"]);
  assert.deepEqual(laptopWindows(b, 6).map(windowLabel), ["2pm–4pm"]);
});

test("seats: what each has, as the finder and validation both know it", () => {
  assert.deepEqual(SEAT_NEED_IDS, SEAT_HAS);
  const places = demo.seats.places;
  assert.deepEqual(seatsFor(places, ["socket", "window"]), ["window-bench"]);
  assert.deepEqual(seatsFor(places, ["sofa", "buggy"]), ["sofa-1"]);
  assert.deepEqual(seatsFor(places, ["group"]).sort(), ["corner-table", "long-table"]);
  assert.equal(seatLabel(places.find((/** @type {any} */ p) => p.id === "window-bench")), "the window bench (by the window, a socket)");
  assert.equal(WORK_TOPICS.length, 11);
});

test("brunch: each plate with its sides, a total in pence and the allergens; a pre-order for the table request", () => {
  const dishes = new Map(demo.menu.sections.flatMap((/** @type {any} */ s) => s.dishes).map((/** @type {any} */ d) => [d.id, d]));
  const o = brunchOrder([{ plate: "eggs-royale", sides: ["bacon"] }, { plate: "eggs-avocado", sides: ["halloumi", "extra-egg"] }], dishes);
  assert.equal(o.totalPence, 1350 + 350 + 1150 + 350 + 200);
  assert.deepEqual(o.allergens, ["Gluten", "Eggs", "Fish", "Milk"]);
  assert.equal(o.lines[1].label, "Poached eggs, smashed avocado with grilled halloumi, extra egg");
  assert.equal(brunchSummary(o).split("\n").length, 4);
  assert.match(tableRequestText({ opening: "Hi", guests: 2, day: "Saturday", time: "10am", preorder: brunchSummary(o) }), /We'd like to pre-order:\nPlate 1: Eggs royale with streaky bacon, £17/);
});

test("café settings are checked: unknown keys, demo-only rows, bakes and photos, numbers, seats", () => {
  assert.match(errorsFor((s) => { s.usual.cups = 3; }), /usual\.cups: unknown setting/);
  assert.match(errorsFor((s) => { s.usual.drinks[0].pour = "frappe"; }), /usual\.drinks\[0\]\.pour/);
  assert.match(errorsFor((s) => { s.usual.drinks[0].prices.venti = 4; }), /prices\.venti: not a size/);
  assert.match(errorsFor((s) => { s.usual.defaultMilk = "goat"; }), /usual\.defaultMilk/);
  assert.match(errorsFor((s) => { s.mode = "client"; }), /tonight\.(source|demo)/);
  assert.match(errorsFor((s) => { s.tonight.demo[0].ago = 3; }), /"at" .* or "ago"/);
  assert.match(errorsFor((s) => { s.counter.spots[0].dish = "eggs-royale"; }), /isn't a bake in the counter sections/);
  assert.match(errorsFor((s) => { delete s.menu.sections[2].dishes[0].photo; }), /in the glass case \(the-case\) but has no "photo"/);
  assert.match(errorsFor((s) => { s.counter.board = "bakes"; }), /counter\.board/);
  assert.match(errorsFor((s) => { s.busy.week.mon[2] = 5; }), /busy\.week\.mon/);
  assert.match(errorsFor((s) => { s.workHere.answers[1].note = undefined; }), /required when the answer is "some"/);
  assert.match(errorsFor((s) => { s.seats.places[3].x = 50; }), /overlaps|outside the room/);
  assert.match(errorsFor((s) => { s.seats.places[0].has = ["wifi"]; }), /seats\.places\[0\]\.has/);
  assert.match(errorsFor((s) => { s.brunch.plates.push("bacon"); }), /"bacon" has no "photo"/);
  assert.match(errorsFor((s) => { s.tableRequest.sittings = ["supper"]; }), /tableRequest\.sittings/);
});
