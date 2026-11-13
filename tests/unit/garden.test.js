import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { monthsWords, isFresh, startBy, readyMonths, startByText, priceWords, rota, planText, samplesText, spotText, paletteFor, monthOf } from "../../src/kits/garden/lib/garden.js";
import { FACINGS, shadowDir, hull, inside, shadows, sunHours, parts, lightOf, hoursWords, dayWords, momentWords, sunAt, sunnyShare, projector, clock, compass } from "../../src/kits/garden/lib/sun-study.js";
import { drawGarden, unproject, tone } from "../../src/kits/garden/lib/sun-draw.js";
import { nearest } from "../../src/kits/garden/features/through-the-year/through-the-year.js";
import { HOME_PARTS, homeOrderProblem, onPagesProblem } from "../../src/kits/garden/home.js";
import { colourInMarkup } from "../../scripts/rules-check.js";
import { validateSite } from "../../src/core/lib/config.js";
import { loadCatalog } from "../../scripts/lib/catalog.js";

const demo = JSON.parse(readFileSync("sites/demos/garden/site.json", "utf8"));
const client = JSON.parse(readFileSync("tests/fixtures/sites/test-garden-client/site.json", "utf8"));
const look = JSON.parse(readFileSync("src/looks/almanac/look.json", "utf8"));
const catalog = loadCatalog(process.cwd());
const errorsFor = (/** @type {(s: any) => void} */ change, base = demo) => { const s = structuredClone(base); change(s); return validateSite(s, { catalog }).join("\n"); };
const LONDON = { lat: 51.46, lng: -0.3, tz: "Europe/London" };
const G = { width: 8, length: 16, house: 8, fence: 1.8 };

test("the demo and the client fixture are valid; the look's home order lists every section", () => {
  assert.deepEqual(validateSite(demo, { catalog }), []);
  assert.deepEqual(validateSite(client, { catalog }), []);
  assert.equal(homeOrderProblem(look.homeOrder), null);
  assert.equal(homeOrderProblem(Object.keys(HOME_PARTS).slice(1)), "homeOrder leaves out: the-year");
  assert.equal(onPagesProblem(look.onPages), null);
  assert.match(onPagesProblem({ team: ["gardens"] }) ?? "", /onPages\.team: only reviews/);
  assert.match(onPagesProblem({ journal: ["reviews"] }) ?? "", /can't hold home sections/);
});

test("validation: the year is twelve months, the next start must say how long it stays true on a client site", () => {
  assert.match(errorsFor((s) => s.year.months.pop()), /year\.months: exactly 12 entries/);
  assert.match(errorsFor((s) => { delete s.calendar.nextStart.staleAfterDays; }, client), /staleAfterDays: how many days/);
  assert.match(errorsFor((s) => { s.calendar.nextStart.updated = "soon"; }), /nextStart\.updated/);
  assert.match(errorsFor((s) => { s.palette.items[0].months = [0, 13]; }), /palette\.items\[0\]\.months/);
  assert.match(errorsFor((s) => { s.palette.items[0].light = ["moonlight"]; }), /palette\.items\[0\]\.light/);
  assert.match(errorsFor((s) => { s.gardens.items[0].style = "jungle"; }), /gardens\.items\[0\]\.style/);
  assert.match(errorsFor((s) => { s.materials.items[0].garden = "nowhere"; }), /materials\.items\[0\]\.garden/);
  assert.match(errorsFor((s) => { s.throughYear.photos = s.throughYear.photos.slice(0, 3); }, client), /4 to 12 photos/);
  assert.match(errorsFor((s) => { s.maintenance.plans[0].price = 0; }), /the studio's own price/);
});

test("validation: planning facts come only from government pages, for England, with the day they were checked", () => {
  assert.match(errorsFor((s) => { s.planning.sources[0].url = "https://www.example-blog.co.uk/fences"; }), /a government page/);
  assert.match(errorsFor((s) => { s.planning.nation = "wales"; }), /planning\.nation/);
  assert.match(errorsFor((s) => { delete s.planning.checked; }), /planning\.checked/);
  assert.equal(errorsFor((s) => { s.planning.sources[0].url = "https://www.planningportal.co.uk/permission/common-projects/decking"; }), "");
});

test("validation: the sun study's place is in the UK and its example garden is sensible", () => {
  assert.match(errorsFor((s) => { s.sun.lat = 40.4; }), /sun\.lat/);
  assert.match(errorsFor((s) => { s.sun.garden.fence = 9; }), /sun\.garden\.fence/);
  assert.match(errorsFor((s) => { s.sun.garden.facing = "up"; }), /sun\.garden\.facing/);
});

test("months as words wrap round the year", () => {
  assert.equal(monthsWords([5, 6, 7]), "May to July");
  assert.equal(monthsWords([11, 12, 1, 2]), "November to February");
  assert.equal(monthsWords([4, 9]), "April and September");
  assert.equal(monthsWords([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]), "All year");
  assert.equal(monthsWords([3]), "March");
  assert.equal(monthOf("2026-11-09"), 11);
});

test("the next start is shown only while it is fresh; old or missing is hidden", () => {
  assert.equal(isFresh("2026-11-01", "2026-11-09", 30), true);
  assert.equal(isFresh("2026-09-01", "2026-11-09", 30), false);
  assert.equal(isFresh(undefined, "2026-11-09", 30), false);
  assert.equal(isFresh("2026-12-01", "2026-11-09", 30), false); // a date in the future is a typo, not fresh
});

test("ready by: works back through the studio's own weeks, and says plainly when it's too soon", () => {
  const r = startBy({ year: 2027, month: 6 }, { design: 6, lead: 8, build: 6 }, "2026-11-09");
  assert.deepEqual(r, { talkBy: "2027-01-12", late: false, weeks: 20 });
  assert.equal(startBy({ year: 2027, month: 1 }, { design: 6, lead: 8, build: 6 }, "2026-11-09").late, true);
  const months = readyMonths("2026-11-09");
  assert.equal(months.length, 18);
  assert.equal(months[0].label, "December 2026");
  assert.equal(months[2].label, "February 2027");
  const text = startByText("Hello Tollgarth.", { ready: "June 2027", talkBy: "2027-01-12", late: false });
  assert.equal(text, "Hello Tollgarth.\n\nI'd like the garden ready by June 2027.\nYour planner says to get in touch by Tuesday 12 January 2027.");
  assert.doesNotMatch(text, /booked|confirmed/i);
});

test("prices are the studio's own or none; messages carry what the visitor chose", () => {
  assert.equal(priceWords(195, "visit"), "£195 a visit");
  assert.equal(priceWords(null, "visit"), "");
  const year = rota({ visits: [3, 10] }, Array.from({ length: 12 }, (_, i) => [`Task ${i + 1}`]));
  assert.deepEqual(year.filter((m) => m.visit).map((m) => m.name), ["March", "October"]);
  assert.deepEqual(year[2].tasks, ["Task 3"]);
  assert.equal(planText("Hello.", { plan: "Seasonal", size: "10 × 20 m", postcode: " tw9 2qq" }), "Hello.\n\nI'm interested in the Seasonal plan.\nGarden: 10 × 20 m\nPostcode: TW9 2QQ");
  assert.equal(samplesText("Hello.", ["Reclaimed brick", "Oak"]), "Hello.\n\nCould I see samples of: Reclaimed brick, Oak?");
  assert.equal(samplesText("Hello.", []), "Hello.");
  assert.equal(spotText("Hello.", { facing: "south-west", size: "8 × 18 m", spot: "" }), "Hello.\n\nMy garden faces south-west and is about 8 × 18 m.");
});

test("the planting palette narrows by month and light", () => {
  const items = demo.palette.items;
  assert.deepEqual(paletteFor(items, { month: 1, light: "shade" }).map((p) => p.id), ["snowdrop", "hellebore"]);
  assert.equal(paletteFor(items, {}).length, items.length);
  assert.ok(paletteFor(items, { month: 7, light: "sun" }).some((p) => p.id === "lavender"));
});

test("the sun: shadows fall away from it, across the garden", () => {
  // a south-facing garden with the sun due south: shadows point back to the house (negative y)
  const [dx, dy] = shadowDir(180, FACINGS.S);
  assert.ok(Math.abs(dx) < 1e-9 && dy < -0.99);
  // the sun due east in a south-facing garden: x runs west, so shadows run along +x
  assert.ok(shadowDir(90, FACINGS.S)[0] > 0.99);
  const h = hull([[0, 0], [2, 0], [2, 2], [0, 2], [1, 1]]);
  assert.equal(h.length, 4);
  assert.equal(inside([1, 1], h), true);
  assert.equal(inside([3, 1], h), false);
  assert.deepEqual(shadows({ elevation: 2, azimuth: 180 }, 0, G), [], "a sun this low counts as shade everywhere");
});

test("where the sun falls: a south-facing garden in London, midsummer and midwinter", () => {
  const june = parts(sunHours(G, FACINGS.S, LONDON, 2026, 6));
  const dec = parts(sunHours(G, FACINGS.S, LONDON, 2026, 12));
  assert.ok(june.far >= 7 && june.near >= 7, `June: ${JSON.stringify(june)}`);
  assert.ok(dec.far < 1, "in December the back fence shades the far end of a south-facing garden");
  assert.ok(dec.near > dec.far, "and the part by the house gets the low sun");
  // a north-facing garden gets less sun by the house than a south-facing one
  const north = parts(sunHours(G, FACINGS.N, LONDON, 2026, 6));
  assert.ok(north.near < june.near);
  assert.equal(lightOf(7), "sun");
  assert.equal(lightOf(4), "part");
  assert.equal(lightOf(1), "shade");
  assert.equal(hoursWords(0.1), "no direct sun");
  assert.equal(hoursWords(0.5), "about half an hour");
  assert.equal(hoursWords(6.4), "about 6.5 hours");
  assert.equal(dayWords({ near: 3, middle: 2, far: 0.5, left: 1, right: 3 }, "November"), "On 21 November the part by the house gets about 3 hours of sun, the far end about half an hour. The right-hand border gets about 2 hours more.");
});

test("at one moment: where the sun is, and how much of the garden is in it", () => {
  const noon = sunAt(LONDON, 2026, 6, 13 * 60); // 1 pm BST is about solar noon in London
  assert.ok(noon.elevation > 60 && noon.elevation < 63, `${noon.elevation}`);
  assert.equal(compass(noon.azimuth), "south");
  assert.ok(sunnyShare(G, noon, FACINGS.S) > 0.9);
  assert.match(momentWords(noon, 0.94), /^The sun is 6\d° up in the south\. About 90% of the garden is in sun\.$/);
  assert.equal(momentWords({ elevation: -4, azimuth: 300 }, 0), "The sun has set.");
  assert.equal(clock(13 * 60 + 30), "1:30 pm");
  assert.equal(clock(6 * 60), "6 am");
});

test("the drawing: from above and in 3D, colours only from classes, and taps map back to the garden", () => {
  const hours = sunHours(G, FACINGS.SW, LONDON, 2026, 6);
  for (const view of /** @type {const} */ (["plan", "3d"])) {
    const d = drawGarden({ g: G, facing: FACINGS.SW, view, hours, sun: sunAt(LONDON, 2026, 6, 15 * 60), spot: [2, 3] });
    assert.match(d.viewBox, /^-?[\d.]+ -?[\d.]+ [\d.]+ [\d.]+$/);
    assert.match(d.svg, /class="gd-ss-h[0-6]"/);
    assert.match(d.svg, /class="gd-ss-shade"/);
    assert.deepEqual(colourInMarkup(`const s = \`${d.svg}\`;`), []);
    const P = projector(view, G);
    const back = unproject(view, G, P(3, 5));
    assert.ok(Math.abs(back[0] - 3) < 1e-9 && Math.abs(back[1] - 5) < 1e-9);
  }
  assert.deepEqual([0.5, 1.5, 2.5, 4, 5, 7, 9].map(tone), [0, 1, 2, 3, 4, 5, 6]);
});

test("a garden through the year opens on the nearest photographed month, going back first", () => {
  assert.equal(nearest([3, 6, 9, 12], 11), 9);
  assert.equal(nearest([3, 6, 9, 12], 12), 12);
  assert.equal(nearest([3, 6, 9, 12], 2), 12);
});
