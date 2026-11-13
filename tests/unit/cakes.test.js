import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { planCake, sizesWords, datesFromCsv, dateStatus, outward, areaFor, inSeason, seasonWords, briefText, longDate, addDays } from "../../src/kits/cakes/lib/cakes.js";
import { HOME_PARTS, homeOrderProblem, onPagesProblem } from "../../src/kits/cakes/home.js";
import { validateSite } from "../../src/core/lib/config.js";
import { loadCatalog } from "../../scripts/lib/catalog.js";

const demo = JSON.parse(readFileSync("sites/demos/cakes/site.json", "utf8"));
const client = JSON.parse(readFileSync("tests/fixtures/sites/test-cakes-client/site.json", "utf8"));
const look = JSON.parse(readFileSync("src/looks/atelier/look.json", "utf8"));
const catalog = loadCatalog(process.cwd());
const errorsFor = (/** @type {(s: any) => void} */ change, base = demo) => { const s = structuredClone(base); change(s); return validateSite(s, { catalog }).join("\n"); };
const chart = demo.servings;

test("the demo and the client fixture are valid", () => {
  assert.deepEqual(validateSite(demo, { catalog }), []);
  assert.deepEqual(validateSite(client, { catalog }), []);
});

test("the cake is the smallest from the studio's chart that feeds everyone; on a tie, more tiers", () => {
  // 120 with coffee: 6/8/10 (136) ties the single 14 in (136); three tiers win the tie.
  assert.deepEqual(planCake(120, "finger", chart), { sizes: [6, 8, 10], portions: 136, from: 780 });
  // exactly enough is enough
  assert.deepEqual(planCake(44, "finger", chart)?.sizes, [8]);
  // as the dessert, portions halve, so the cake grows
  assert.deepEqual(planCake(120, "dessert", chart), { sizes: [10, 12, 14], portions: 152, from: 780 });
  // tiers are always consecutive sizes from the chart
  for (let g = 10; g <= 400; g += 5) for (const p of /** @type {const} */ (["finger", "dessert"])) {
    const plan = planCake(g, p, chart);
    if (!plan) continue;
    assert.ok(plan.portions >= g, `${g} ${p}`);
    plan.sizes.forEach((s, i) => { if (i) assert.equal(s - plan.sizes[i - 1], 2); });
  }
});

test("more guests than the biggest cake, or no guests, is 'ask us'", () => {
  assert.equal(planCake(10_000, "finger", chart), null);
  assert.equal(planCake(0, "finger", chart), null);
  // a tier count with no "from" price gives no price, never a guess
  const noFour = { ...chart, prices: chart.prices.filter((/** @type {any} */ p) => p.tiers !== 4) };
  const big = planCake(340, "finger", noFour);
  assert.equal(big?.sizes.length, 4);
  assert.equal(big?.from, null);
});

test("tier sizes read naturally", () => {
  assert.equal(sizesWords([8]), "8 in");
  assert.equal(sizesWords([6, 8, 10]), "6, 8 and 10 in");
});

test("the diary sheet: taken, one left, free; fails closed when stale or broken", () => {
  const csv = "date,left,updated_at\n2027-06-12,0,2026-11-08 09:00\n2027-06-19,1,2026-11-08 09:00\n";
  const d = datesFromCsv(csv, "2026-11-09", 7);
  assert.equal(d.ok, true);
  assert.equal(dateStatus(d, "2027-06-12", "2026-11-09", 21), "booked");
  assert.equal(dateStatus(d, "2027-06-19", "2026-11-09", 21), "one");
  assert.equal(dateStatus(d, "2027-06-26", "2026-11-09", 21), "free");
  assert.equal(dateStatus(d, "2026-11-20", "2026-11-09", 21), "soon");
  assert.equal(dateStatus(d, "2026-11-01", "2026-11-09", 21), "past");
  assert.equal(datesFromCsv(csv, "2026-11-30", 7).ok, false, "a diary not updated for over a week is unknown");
  assert.equal(datesFromCsv("date,left\n2027-06-12,0", "2026-11-09", 7).ok, false, "no updated_at column");
  assert.equal(datesFromCsv("date,left,updated_at\n12/06/2027,0,2026-11-08", "2026-11-09", 7).ok, false, "a bad date fails the whole sheet");
  assert.equal(dateStatus({ ok: false }, "2027-06-26", "2026-11-09", 21), "unknown", "no diary never says free");
  // CK-01: a diary dated after today (tomorrow, or 2027 typed for 2026) is unreadable, not fresh
  const future = (/** @type {string} */ u) => `date,left,updated_at\n2027-06-12,0,${u}\n`;
  assert.equal(datesFromCsv(future("2026-11-10 09:00"), "2026-11-09", 7).ok, false, "updated tomorrow");
  assert.equal(datesFromCsv(future("2027-11-08 09:00"), "2026-11-09", 7).ok, false, "a year typo");
  assert.equal(datesFromCsv(future("2026-11-09 07:00"), "2026-11-09", 7).ok, true, "updated today is fresh");
});

test("postcodes: a listed district wins over its area; anywhere else is unknown, never guessed", () => {
  assert.equal(outward("sw3 4hx"), "SW3");
  assert.equal(outward("RG9"), "RG9");
  assert.equal(outward("SW1A 1AA"), "SW1A");
  assert.equal(outward("hello"), null);
  const areas = [{ name: "London", districts: ["SW"], from: 45, arrive: "early" }, { name: "Henley", districts: ["RG9"], from: 80, arrive: "earlier" }];
  assert.equal(areaFor("SW3 4HX", areas)?.area?.name, "London");
  assert.equal(areaFor("RG9 1AA", areas)?.area?.name, "Henley");
  assert.equal(areaFor("RG1 1AA", areas)?.area, null);
  assert.equal(areaFor("not a postcode", areas), null);
});

test("flavours in season, and their months in words", () => {
  const items = demo.flavours.items;
  assert.ok(inSeason(items, 2).some((/** @type {any} */ f) => f.id === "blood-orange"));
  assert.ok(!inSeason(items, 7).some((/** @type {any} */ f) => f.id === "blood-orange"));
  assert.equal(inSeason(items, 7).length, items.length - 1);
  assert.equal(seasonWords(undefined), "All year");
  assert.equal(seasonWords([1, 2, 3]), "Jan to Mar");
  assert.equal(seasonWords([12]), "December");
});

test("the brief reads in the order a designer quotes from, and leaves out blanks", () => {
  const text = briefText({ intro: "Hello Pastillage, we'd like a cake.", date: "2027-06-12", guests: 120, portion: "finger", sizes: [6, 8, 10], flavours: ["Honey", "", "Vanilla"], finish: "", venue: "Aynhoe Park", notes: "  " });
  assert.equal(text, "Hello Pastillage, we'd like a cake.\nDate: Saturday 12 June 2027\nGuests: 120 (with coffee)\nCake: 3 tiers, 6, 8 and 10 in\nFlavours, top to bottom: Honey; Vanilla\nVenue: Aynhoe Park");
  assert.equal(longDate("2027-06-12"), "Saturday 12 June 2027");
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
});

test("the home sections, and the look's order and pages", () => {
  assert.equal(homeOrderProblem(look.homeOrder), null);
  assert.equal(onPagesProblem(look.onPages), null);
  assert.match(String(homeOrderProblem(Object.keys(HOME_PARTS).slice(1))), /leaves out/);
  assert.match(String(onPagesProblem({ "flavours-page": ["visit"] })), /only/);
});

test("validation refuses what could mislead a customer", () => {
  assert.match(errorsFor((s) => { s.dates.source = "simulated"; }, client), /never simulated/);
  assert.match(errorsFor((s) => { s.tasting.payLink = "https://buy.stripe.com/live123"; }), /test-mode/);
  assert.match(errorsFor((s) => { s.tasting.payLink = "https://buy.stripe.com/test_x"; }, client), /live link/);
  assert.match(errorsFor((s) => { s.flavours.items[0].allergens = ["gluten", "wheat"]; }), /allergen chart/);
  assert.match(errorsFor((s) => { s.servings.tiers[1].dessert = 99; }), /fewer of them/);
  assert.match(errorsFor((s) => { s.delivery.areas[1].districts.push("SW"); }), /two areas/);
  assert.match(errorsFor((s) => { s.pieces.items[0].from = "from £400"; }), /whole pounds/);
  assert.match(errorsFor((s) => { s.hero.piece = "nope"; }), /hero.piece/);
  assert.match(errorsFor((s) => { delete s.ranges.corporate; }), /corporate-page is on/);
  assert.match(errorsFor((s) => { s.flavours.items[0].layer = { top: 95, height: 10 }; }), /percentages/);
  assert.match(errorsFor((s) => { s.dates.colour = "gold"; }), /unknown setting/);
});

test("no free-from or safety claims in the studio's own words (CK-03, CK-04, CK-05)", () => {
  assert.match(errorsFor((s) => { s.flavours.items[3].diets = ["gluten-free"]; }), /20 ppm/);
  for (const [where, said] of /** @type {const} */ ([["allergens.severe", "Our cakes are allergen-free."], ["flavours.items[0].what", "Nut-free sponge, honey caramel."], ["questions[0].a", "Every cake is free from nuts."], ["pieces.items[0].made", "Safe for coeliacs."], ["ranges.weddings.intro", "Dairy free on request."]])) {
    const errs = errorsFor((s) => {
      const path = where.replace(/\[(\d+)\]/g, ".$1").split(".");
      const last = /** @type {string} */ (path.pop());
      path.reduce((o, k) => o[k], s)[last] = said;
    });
    assert.match(errs, /free-from or safety claim/, where);
  }
  // CK-05: every allergen's word, "free of", coeliac and "-friendly" claims, in every place the studio writes
  const set = (/** @type {string} */ where, /** @type {string} */ said) => errorsFor((s) => {
    const path = where.replace(/\[(\d+)\]/g, ".$1").split(".");
    const last = /** @type {string} */ (path.pop());
    path.reduce((o, k) => o[k], s)[last] = said;
  });
  for (const [where, said] of /** @type {const} */ ([
    ["flavours.items[0].what", "Wheat-free sponge."], ["flavours.items[1].what", "Lactose free buttercream."],
    ["flavours.items[2].what", "Sulphite-free curd."], ["questions[1].a", "Celery-free and mustard-free."],
    ["questions[2].a", "Every cake is free of nuts."], ["allergens.ingredients", "Suitable for coeliacs."],
    ["ranges.celebrations.intro", "Coeliac-friendly cakes."], ["hero.intro", "Allergy-friendly cakes."],
    ["visitInfo.intro", "A nut-free studio by appointment."], ["pageLinks[0].title", "Gluten free cakes"],
    ["seasons[0].banner", "Fish-free Christmas cakes."], ["business.description", "Shellfish-free and lupin-free cakes."],
  ])) assert.match(set(where, said), /free-from or safety claim/, `${where}: ${said}`);
  // honest warnings, an ingredient, and "free of charge" pass
  for (const said of ["Our kitchen is not safe for nut allergies.", "We cannot make a cake free from nuts.", "We can't promise anything is nut-free.",
    "Made with gluten-free flour on request.", "Delivery free of charge in EC1."]) assert.equal(set("allergens.severe", said), "", said);

});
