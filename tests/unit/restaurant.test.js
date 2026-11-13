import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { ALLERGENS, ALLERGEN_IDS, hasDiet, allergenNames } from "../../src/core/lib/allergens.js";
import { DAYPART_SCRIPT, daypartMeta } from "../../src/core/lib/daypart.js";
import { headersFile } from "../../src/core/lib/seo.js";
import { createHash } from "node:crypto";
import { sittingState, kitchenLine, moodNow, sittingToShow } from "../../src/kits/restaurant/lib/sittings.js";
import { canEat, tableView, reasons, groupSummary } from "../../src/kits/restaurant/lib/group.js";
import { money, priceOrder, orderMessage } from "../../src/kits/restaurant/lib/order.js";
import { tonightFromCsv, isSoldOut } from "../../src/kits/restaurant/lib/tonight.js";
import { tableRequestText, slotTimes } from "../../src/kits/restaurant/lib/request.js";
import { upcoming, eventIcs } from "../../src/kits/restaurant/lib/events.js";
import { dishVisible } from "../../src/kits/restaurant/lib/filter.js";
import { chairs, sittingDays } from "../../src/kits/restaurant/eleventy.js";
import { summary } from "../../src/kits/restaurant/features/private-dining/private-dining.js";
import { HOME_PARTS, homeOrderProblem } from "../../src/kits/restaurant/home.js";
import { validateSite } from "../../src/core/lib/config.js";
import { loadCatalog } from "../../scripts/lib/catalog.js";

const demo = JSON.parse(readFileSync("sites/demos/restaurant/site.json", "utf8"));
const S = demo.menu.sittings;
const catalog = loadCatalog(process.cwd());
const errorsFor = (/** @type {(s: any) => void} */ change, base = demo) => { const s = structuredClone(base); change(s); return validateSite(s, { catalog }).join("\n"); };
const at = (/** @type {number} */ weekday, /** @type {string} */ hm) => ({ weekday, minutes: Number(hm.slice(0, 2)) * 60 + Number(hm.slice(3)) });
const dish = (/** @type {string} */ id) => demo.menu.sections.flatMap((/** @type {any} */ s) => s.dishes).find((/** @type {any} */ d) => d.id === id);

test("the 14 allergens are the FSA's list, in its order", () => {
  assert.equal(ALLERGENS.length, 14);
  assert.deepEqual(ALLERGEN_IDS, ["celery", "gluten", "crustaceans", "eggs", "fish", "lupin", "milk", "molluscs", "mustard", "peanuts", "sesame", "soya", "sulphites", "nuts"]);
  assert.deepEqual(allergenNames({ allergens: ["nuts", "gluten"] }), ["Gluten", "Tree nuts"]);
});

test("diet marks: vegan counts as vegetarian, nothing else is inferred", () => {
  assert.ok(hasDiet({ diets: ["vegan"] }, "vegetarian"));
  assert.ok(!hasDiet({ diets: ["vegetarian"] }, "vegan"));
  assert.ok(!hasDiet({ diets: ["vegan"] }, "halal"), "a vegan dish is only halal if the restaurant marks it");
  assert.ok(dishVisible({ diets: ["vegan"], allergens: ["sesame"] }, "vegetarian", []));
  assert.ok(!dishVisible({ diets: ["vegan"], allergens: ["sesame"] }, "", ["sesame"]));
});

test("sittings: what's on now, the next one, and the one to show", () => {
  assert.equal(sittingState(S, at(4, "12:40")).current?.id, "lunch");
  assert.equal(sittingState(S, at(4, "16:00")).current, null);
  assert.deepEqual(sittingState(S, at(4, "16:00")).next, { sitting: S[2], inDays: 0 });
  assert.equal(sittingState(S, at(1, "12:00")).next?.inDays, 1, "closed Monday: next is Tuesday lunch");
  assert.equal(sittingState(S, at(6, "10:30")).current?.id, "brunch");
  assert.equal(sittingToShow(S, at(4, "16:00")).id, "dinner");
  assert.equal(sittingToShow(S, at(4, "09:00")).id, "lunch");
});

test("the kitchen line: open until last orders, the last 45 minutes, closed with the next sitting", () => {
  assert.deepEqual(kitchenLine(S, at(4, "19:00")), { text: "Dinner · kitchen open until 9:45pm", state: "open" });
  assert.deepEqual(kitchenLine(S, at(4, "21:20")), { text: "Dinner · last orders in 25 min", state: "last" });
  assert.equal(kitchenLine(S, at(4, "22:00")).text, "Dinner · last orders have gone");
  assert.equal(kitchenLine(S, at(4, "16:00")).text, "Kitchen closed · dinner from 5pm");
  assert.equal(kitchenLine(S, at(1, "12:00")).text, "Kitchen closed · lunch tomorrow from 12pm");
  assert.equal(kitchenLine(S, at(0, "23:00")).text, "Kitchen closed · lunch Tuesday from 12pm");
});

test("day or evening: the sitting served, the evening after dinner, the night until 6am", () => {
  assert.equal(moodNow(S, at(4, "12:40")), "day");
  assert.equal(moodNow(S, at(4, "19:20")), "evening");
  assert.equal(moodNow(S, at(4, "23:30")), "evening", "after dinner the room stays in its evening light");
  assert.equal(moodNow(S, at(5, "01:30")), "evening", "after midnight, still last night's dinner");
  assert.equal(moodNow(S, at(4, "15:30")), "day");
  assert.equal(moodNow(S, at(1, "19:00")), "day", "closed all day Monday");
});

test("the inline daypart script picks the same mood and menu as the kit's rules, at every half hour of the week", () => {
  const meta = daypartMeta(demo.hours, S);
  // Run the real script with a fake document and a clock; Intl reads the timezone as the browser would.
  const run = (/** @type {Date} */ when) => {
    /** @type {Record<string, string>} */ const attrs = {};
    const RealDate = Date;
    class FakeDate extends RealDate { constructor(...a) { super(...(a.length ? a : [when.getTime()])); } }
    runInNewContext(DAYPART_SCRIPT, {
      document: { documentElement: { setAttribute: (/** @type {string} */ k, /** @type {string} */ v) => { attrs[k] = v; }, style: { setProperty() {} } }, querySelector: () => ({ content: meta }) },
      Intl, JSON, Number, Date: FakeDate,
    });
    return [attrs["data-mood"], attrs["data-sitting"]];
  };
  // Monday 26 Oct 2026 00:00 GMT (the clocks went back the day before), every 30 minutes for a week.
  for (let t = Date.UTC(2026, 9, 26, 0, 0); t < Date.UTC(2026, 10, 2); t += 30 * 60_000) {
    const d = new Date(t);
    const p = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", hour: "2-digit", minute: "2-digit", hourCycle: "h23", weekday: "short" }).formatToParts(d);
    const g = (/** @type {string} */ k) => p.find((x) => x.type === k)?.value ?? "";
    const now = { weekday: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(g("weekday")), minutes: Number(g("hour")) * 60 + Number(g("minute")) };
    assert.deepEqual(run(d), [moodNow(S, now), sittingToShow(S, now).id], d.toISOString());
  }
});

test("the inline script sets the season (and its name for the Menu Book's cover) from the first paint, as the seasonal feature would", () => {
  const seasons = [{ from: "2026-11-23", to: "2026-12-24", tint: "festive", name: "Christmas" }, { from: "2026-12-01", to: "2026-12-03", name: "Pop-up" }];
  const meta = daypartMeta(demo.hours, S, seasons);
  const run = (/** @type {Date} */ when) => {
    /** @type {Record<string, string>} */ const attrs = {}, props = {};
    const RealDate = Date;
    class FakeDate extends RealDate { constructor(...a) { super(...(a.length ? a : [when.getTime()])); } }
    runInNewContext(DAYPART_SCRIPT, {
      document: { documentElement: { setAttribute: (/** @type {string} */ k, /** @type {string} */ v) => { attrs[k] = v; }, style: { setProperty: (/** @type {string} */ k, /** @type {string} */ v) => { props[k] = v; } } }, querySelector: () => ({ content: meta }) },
      Intl, JSON, Number, Date: FakeDate,
    });
    return [attrs["data-season"], props["--season-name"]];
  };
  assert.deepEqual(run(new Date("2026-11-22T23:30:00Z")), [undefined, undefined]);
  assert.deepEqual(run(new Date("2026-11-23T00:30:00Z")), ["festive", '"Christmas"']);
  assert.deepEqual(run(new Date("2026-12-02T12:00:00Z")), [undefined, '"Pop-up"']); // the later start wins; it has no tint
  assert.deepEqual(run(new Date("2026-12-25T12:00:00Z")), [undefined, undefined]);
});

test("the CSP allows exactly the daypart script, and the restaurant's sheet when it has one", () => {
  const hash = `'sha256-${createHash("sha256").update(DAYPART_SCRIPT).digest("base64")}'`;
  const demoHeaders = headersFile(demo, "preview");
  assert.ok(demoHeaders.includes(hash));
  assert.ok(!demoHeaders.includes("docs.google.com"), "a simulated sheet needs no Google access");
  const client = { ...structuredClone(demo), tonight: { source: "sheet", csvUrl: "https://docs.google.com/spreadsheets/d/e/x/pub?output=csv" } };
  assert.match(headersFile(client, "production"), /connect-src [^;]*https:\/\/docs\.google\.com/);
  assert.ok(!headersFile({ kit: "car", features: [] }, "production").includes("sha256-"), "other trades get no inline script");
});

test("The Table: who can eat each dish, and why not", () => {
  const vegan = { diets: ["vegan"], avoid: [] }, nuts = { diets: ["halal"], avoid: ["nuts"] }, anyone = { diets: [], avoid: [] };
  assert.ok(canEat(vegan, dish("hummus")));
  assert.ok(!canEat(vegan, dish("halloumi")));
  assert.ok(!canEat(nuts, dish("cake")));
  assert.deepEqual(reasons(vegan, dish("cake")), ["not vegan"]);
  assert.deepEqual(reasons(nuts, dish("cake")), ["has tree nuts"]);
  assert.deepEqual(tableView([vegan, nuts, anyone], [dish("hummus"), dish("cake")]), [{ id: "hummus", count: 3, cant: [] }, { id: "cake", count: 1, cant: [0, 1] }]);
  assert.equal(groupSummary([vegan, nuts, anyone]), "3 guests. 1 vegan, 1 halal. Avoiding: tree nuts (1).");
  assert.equal(groupSummary([anyone]), "1 guest.");
});

test("takeaway: totals in pence, the allergens in the order, the message", () => {
  assert.equal(money(450), "£4.50");
  assert.equal(money(1900), "£19");
  const ds = [dish("hummus"), dish("mixed-grill"), dish("fries")];
  const o = priceOrder({ hummus: 2, "mixed-grill": 1, fries: 0 }, ds);
  assert.equal(o.totalPence, 3300);
  assert.equal(o.count, 3);
  assert.deepEqual(o.allergens, ["Gluten", "Milk", "Mustard", "Sesame"]);
  const msg = orderMessage(o, { opening: "Hi, I'd like to order for collection.", time: "7:15pm", name: "Sam", notes: "" });
  assert.match(msg, /2 × Hummus, £14\n1 × Mixed grill for one, £19\nTotal: £33\nCollection: 7:15pm\nName: Sam/);
  assert.match(msg, /Allergens in this order: Gluten, Milk, Mustard, Sesame/);
  assert.match(msg, /Please confirm the order, the time and the allergens/);
  assert.match(orderMessage(priceOrder({ fries: 1 }, ds), { opening: "Hi", time: "7pm" }), /No allergens listed in this order/);
  assert.equal(priceOrder({ baklava: 3 }, [dish("baklava")]).totalPence, 1950, "£6.50 × 3 is exactly £19.50");
});

test("tonight's sheet: today's rows only, walk-in tables only while fresh, fails closed", () => {
  const tz = "Europe/London";
  const now = Date.parse("2026-10-29T19:00:00Z"); // 7pm GMT
  const csv = [
    "kind,name,price,note,updated_at",
    "tables,few,,Bar seats free,2026-10-29 18:40",
    "special,Lamb neck shawarma,19,Until it's gone,2026-10-29 11:05",
    "special,Old special,12,,2026-10-28 11:05",
    "soldout,Whole sea bream,,,2026-10-29 18:12",
    "special,Typo price,£9.5x,,2026-10-29 12:00",
  ].join("\n");
  const r = tonightFromCsv(csv, now, tz, 45);
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.deepEqual(r.specials.map((s) => [s.name, s.price]), [["Lamb neck shawarma", 19], ["Typo price", null]]);
  assert.deepEqual(r.soldOut, ["whole sea bream"]);
  assert.equal(r.tables?.state, "few");
  assert.ok(isSoldOut(r.soldOut, { id: "whole-bream", name: "Whole sea bream" }));
  const late = tonightFromCsv(csv, now + 60 * 60_000, tz, 45);
  assert.ok(late.ok && late.tables === null, "an hour later the walk-in line is too old to show");
  assert.deepEqual(tonightFromCsv("name,price\nx,1", now, tz, 45), { ok: false });
  const future = tonightFromCsv("kind,name,updated_at\ntables,free,2026-10-29 20:30", now, tz, 45);
  assert.ok(future.ok && future.tables === null, "a time in the future is never trusted");
  const unknown = tonightFromCsv("kind,name,updated_at\ntables,maybe,2026-10-29 18:55", now, tz, 45);
  assert.ok(unknown.ok && unknown.tables === null);
});

test("table requests: times inside the sitting, the message says it's a request", () => {
  assert.deepEqual(slotTimes({ from: "17:00", to: "18:30", lastOrders: "18:00" }), ["17:00", "17:15", "17:30"]);
  const t = tableRequestText({ opening: "Hi, can I book a table?", guests: 6, day: "Friday 30 October", time: "7:30pm", seat: "booth 1 (booths)", group: "6 guests. 1 vegan.", notes: "A birthday" });
  assert.equal(t, "Hi, can I book a table?\n\nTable for 6\nFriday 30 October, 7:30pm\nWhere we'd like to sit, if you can: booth 1 (booths)\nOur group: 6 guests. 1 vegan.\nNotes: A birthday");
  assert.ok(!tableRequestText({ opening: "Hi", guests: 2, day: "Today", time: "8pm" }).includes("Notes"));
});

test("events: upcoming only, in order; calendar times in UTC across the clock change", () => {
  const items = [{ id: "b", title: "B", date: "2026-11-05", start: "18:00", text: "x" }, { id: "a", title: "A", date: "2026-10-20", start: "18:00", text: "x" }, { id: "c", title: "C", date: "2026-10-30", start: "19:00", end: "22:30", text: "x" }];
  assert.deepEqual(upcoming(items, "2026-10-27").map((e) => e.id), ["c", "b"]);
  const ics = eventIcs({ event: items[2], place: "41 Tib Street", business: "Saffron & Ash", timeZone: "Europe/London", stamp: new Date("2026-10-27T10:00:00Z") });
  assert.match(ics, /DTSTART:20261030T190000Z/, "30 Oct is GMT: 7pm is 19:00 UTC");
  assert.match(ics, /DTEND:20261030T223000Z/);
  assert.match(ics, /SUMMARY:C at Saffron & Ash/);
  const summer = eventIcs({ event: { id: "s", title: "S", date: "2027-06-10", start: "19:00", text: "x" }, place: "p", business: "b", timeZone: "Europe/London", stamp: new Date() });
  assert.match(summer, /DTSTART:20270610T180000Z/, "June is BST: 7pm is 18:00 UTC");
  assert.match(summer, /DTEND:20270610T200000Z/, "no end time: two hours");
});

test("private dining: set menu total against the room's minimum spend", () => {
  assert.equal(summary({ n: 14, lo: 10, hi: 24, min: 50000, roomName: "The Mezzanine", menuName: "The feast", price: 38 }), "The feast: £532 for 14, which covers the £500 minimum spend.");
  assert.equal(summary({ n: 10, lo: 10, hi: 24, min: 50000, roomName: "The Mezzanine", menuName: "The feast", price: 38 }), "The feast: £380 for 10; the room's minimum spend is £500.");
  assert.equal(summary({ n: 4, lo: 6, hi: 12, min: 0, roomName: "The Snug", menuName: "", price: null }), "The Snug takes 6–12 guests.");
});

test("the room plan: chairs around each table, days read as ranges", () => {
  assert.equal(chairs({ x: 0, y: 0, w: 8, h: 8, shape: "round", seats: 3 }).length, 3);
  assert.equal(chairs({ x: 0, y: 0, w: 13, h: 10, shape: "booth", seats: 4 }).length, 0);
  const long = chairs({ x: 10, y: 10, w: 30, h: 8, shape: "rect", seats: 10 });
  assert.equal(long.filter((c) => c.cy < 10).length, 5);
  assert.equal(long.filter((c) => c.cy > 18).length, 5);
  assert.equal(sittingDays(["tue", "wed", "thu", "fri", "sat", "sun"]), "Tue–Sun");
  assert.equal(sittingDays(["sat", "sun"]), "Sat, Sun");
  assert.equal(sittingDays(["mon", "wed", "fri"]), "Mon, Wed, Fri");
});

test("every restaurant look lists every home section once", () => {
  for (const [id, look] of Object.entries(catalog.looks)) if (look.kits.includes("restaurant")) assert.equal(homeOrderProblem(look.homeOrder), null, id);
  assert.match(homeOrderProblem(Object.keys(HOME_PARTS).filter((id) => id !== "the-pass")) ?? "", /leaves out: the-pass/);
});

test("the restaurant demo is valid, and its settings are checked", () => {
  assert.equal(validateSite(demo, { catalog }).join("\n"), "");
  assert.match(errorsFor((s) => { s.menu.sections[1].dishes[0].allergens.push("milk"); }), /marked vegan but lists an animal allergen/);
  assert.match(errorsFor((s) => { s.menu.sections[1].dishes[0].allergens = ["nut"]; }), /allergens: from the restaurant's allergen chart/);
  assert.match(errorsFor((s) => { delete s.menu.sections[1].dishes[0].allergens; }), /allergens/);
  assert.match(errorsFor((s) => { s.menu.sections[1].dishes[0].calories = 400; }), /dishes\[0\]\.calories: unknown setting/);
  assert.match(errorsFor((s) => { s.menu.sittings[2].lastOrders = "23:30"; }), /lastOrders/);
  assert.match(errorsFor((s) => { s.menu.sittings[0].mood = "night"; }), /mood/);
  assert.match(errorsFor((s) => { s.heroFilm = { photos: [] }; }), /heroFilm\.photos/);
  assert.match(errorsFor((s) => { s.heroFilm = { photos: [{ src: "img/a.webp", srcMobile: "a.webp", width: 1, height: 1, alt: "a" }], seconds: 2 }; }), /heroFilm\.seconds[\s\S]*srcMobile|srcMobile[\s\S]*heroFilm\.seconds/);
  assert.match(errorsFor((s) => { s.heroFilm.video.src = "img/hero.webm"; }), /heroFilm\.video\.src/);
  assert.match(errorsFor((s) => { s.heroFilm.photos = [{ src: "img/a.webp", width: 1, height: 1, alt: "a" }]; }), /not both/);
  assert.match(errorsFor((s) => { s.menu.sections[1].dishes[0].photo = { src: "a.webp" }; }), /photo/);
  assert.match(errorsFor((s) => { s.room.tables[1].x = 10; }), /overlaps room\.tables\[0\]/);
  assert.match(errorsFor((s) => { s.room.tables[0].x = 95; }), /reaches outside the room/);
  assert.match(errorsFor((s) => { s.room.tables[0].area = "garden"; }), /room\.tables\[0\]\.area/);
  assert.match(errorsFor((s) => { s.pass.dishes.push("olives"); }), /"olives" has no "pass" photo/);
  assert.match(errorsFor((s) => { s.menu.sections[2].dishes[0].pairs = ["cola"]; }), /"cola" isn't a drink/);
  assert.match(errorsFor((s) => { s.mode = "client"; }), /tonight\.source: simulated data is only allowed on demo sites/);
  assert.match(errorsFor((s) => { s.order.readyMinutes = 5; }), /order\.readyMinutes/);
  assert.match(errorsFor((s) => { s.delivery.apps[0].name = "Deliveroo UK"; }), /delivery\.apps\[0\]\.name/);
  assert.match(errorsFor((s) => { s.table.start = [{ diets: ["keto"] }]; }), /table\.start\[0\]\.diets/);
  assert.match(errorsFor((s) => { s.features = s.features.filter((/** @type {string} */ f) => f !== "table-request"); }), /"the-table" needs "table-request"/);
  assert.match(errorsFor((s) => { s.plan = "plus"; }), /"the-table" needs the signature plan/);
});
