// @ts-check
/** Restaurant kit additions to the shared Eleventy setup: allergens and diets, sittings, dishes, events and the room plan. */
import { ALLERGENS, DIETS, ALLERGEN_GUIDANCE, allergenNames, hasDiet } from "../../core/lib/allergens.js";
import { slotTimes } from "./lib/request.js";
import { upcoming } from "./lib/events.js";
import { toMinutes, formatTime12 } from "../../core/lib/hours.js";
import { HOME_PARTS, homeOrderFor } from "./home.js";
import { LEVELS } from "./lib/busy.js";
import { SEAT_NEEDS, seatsFor } from "./lib/seats.js";
import { OCCASIONS, INSCRIPTION_MAX, teaKinds } from "./lib/tearoom.js";

const DAY_SHORT = { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun" };
const SPICE = ["", "Mild", "Medium", "Hot"];

/** @param {any} eleventyConfig */
export default function restaurantKit(eleventyConfig) {
  eleventyConfig.addGlobalData("homeParts", { order: Object.keys(HOME_PARTS), paths: HOME_PARTS });
  // Which page a home section moves to when that page is on (the look's "onPages"): { part: page feature }.
  eleventyConfig.addFilter("hostedBy", (/** @type {Record<string, string[]>|null} */ onPages) => Object.fromEntries(Object.entries(onPages ?? {}).flatMap(([page, parts]) => parts.map((part) => [part, page]))));
  eleventyConfig.addFilter("homeOrder", homeOrderFor);
  // The tea room: occasions Your table can mark, the longest inscription, and the kinds of tea a library has.
  eleventyConfig.addGlobalData("occasions", OCCASIONS);
  eleventyConfig.addGlobalData("inscriptionMax", INSCRIPTION_MAX);
  eleventyConfig.addFilter("teaKinds", teaKinds);
  // Small whole numbers as words, the way a card would write them: 2 → "two".
  eleventyConfig.addFilter("words", (/** @type {number} */ n) => ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"][n] ?? String(n));
  // The café's usual week, Monday first: [{ key, name, bars: [{ start, level, word }] }], and the hours it covers.
  eleventyConfig.addFilter("busyWeek", (/** @type {any} */ b) => [1, 2, 3, 4, 5, 6, 0].map((wd) => ({
    key: ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][wd], weekday: wd, name: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][wd],
    bars: (b.week[["sun", "mon", "tue", "wed", "thu", "fri", "sat"][wd]] ?? []).map((/** @type {number|null} */ level, /** @type {number} */ i) => (level === null ? null : { start: toMinutes(b.from) + i * 60, level, word: LEVELS[level] })),
  })).map((d) => ({ ...d, short: d.name.slice(0, 3), rest: d.name.slice(3) })));
  // The seat finder's needs that at least one seat has, and a seat's own as words.
  eleventyConfig.addFilter("seatNeeds", (/** @type {any[]} */ places) => SEAT_NEEDS.filter((n) => seatsFor(places, [n.id]).length));
  eleventyConfig.addFilter("seatHas", (/** @type {any} */ p) => SEAT_NEEDS.filter((n) => p.has.includes(n.id)).map((n) => n.name.toLowerCase()));
  eleventyConfig.addFilter("t12short", (/** @type {number} */ m) => formatTime12(m));
  eleventyConfig.addFilter("busyHours", (/** @type {any} */ b) => {
    const n = Math.max(...Object.values(/** @type {Record<string, number[]>} */ (b.week)).map((d) => d.length));
    return Array.from({ length: n }, (_, i) => toMinutes(b.from) + i * 60);
  });
  eleventyConfig.addGlobalData("food", { allergens: ALLERGENS, diets: DIETS, guidance: ALLERGEN_GUIDANCE, spice: SPICE });

  /** Every dish (not drinks) in the order the menu lists them. @param {any} menu */
  const dishesOf = (menu) => menu.sections.filter((/** @type {any} */ s) => !s.drinks).flatMap((/** @type {any} */ s) => s.dishes.map((/** @type {any} */ d) => ({ ...d, section: s.id })));
  /** Every drink. @param {any} menu */
  const drinksOf = (menu) => menu.sections.filter((/** @type {any} */ s) => s.drinks).flatMap((/** @type {any} */ s) => s.dishes);

  eleventyConfig.addFilter("dishes", dishesOf);
  eleventyConfig.addFilter("drinks", drinksOf);
  eleventyConfig.addFilter("dish", (/** @type {any} */ menu, /** @type {string} */ id) => [...dishesOf(menu), ...drinksOf(menu)].find((d) => d.id === id));
  eleventyConfig.addFilter("menuSection", (/** @type {any} */ menu, /** @type {string} */ id) => menu.sections.find((/** @type {any} */ s) => s.id === id) ?? null);
  eleventyConfig.addFilter("sectionsFor", (/** @type {any} */ menu, /** @type {string} */ sitting) => menu.sections.filter((/** @type {any} */ s) => s.sittings.includes(sitting)));
  eleventyConfig.addFilter("takeawaySections", (/** @type {any} */ menu) => menu.sections.map((/** @type {any} */ s) => ({ ...s, dishes: s.dishes.filter((/** @type {any} */ d) => d.takeaway) })).filter((/** @type {any} */ s) => s.dishes.length));
  eleventyConfig.addFilter("allergenNames", allergenNames);
  eleventyConfig.addFilter("dietMarks", (/** @type {any} */ dish) => DIETS.filter((d) => (dish.diets ?? []).includes(d.id)));
  eleventyConfig.addFilter("hasDiet", hasDiet);
  eleventyConfig.addFilter("gbp", (/** @type {number} */ n) => (Number.isInteger(n) ? `£${n}` : `£${n.toFixed(2)}`));
  // Prices on a printed menu read without the pound sign: "14", "6.5" → "6.50".
  eleventyConfig.addFilter("menuPrice", (/** @type {number} */ n) => (Number.isInteger(n) ? String(n) : n.toFixed(2)));
  eleventyConfig.addFilter("t12", (/** @type {string} */ hm) => formatTime12(toMinutes(hm)));
  eleventyConfig.addFilter("sittingDays", sittingDays);
  eleventyConfig.addFilter("slotTimes", slotTimes);
  eleventyConfig.addFilter("upcomingEvents", upcoming);
  eleventyConfig.addFilter("eventDate", (/** @type {string} */ d) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }));
  eleventyConfig.addFilter("dayMonth", (/** @type {string} */ d) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "UTC" }));
  eleventyConfig.addFilter("eventDay", (/** @type {string} */ d) => ({ day: Number(d.slice(8, 10)), month: new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" }), weekday: new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", timeZone: "UTC" }) }));
  eleventyConfig.addFilter("roomTables", (/** @type {any} */ room, /** @type {string} */ area) => room.tables.filter((/** @type {any} */ t) => t.area === area));
  eleventyConfig.addFilter("chairs", chairs);
  eleventyConfig.addFilter("longDate", (/** @type {string} */ d) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }));
  eleventyConfig.addFilter("pct", (/** @type {number} */ v) => `${Math.round(v * 1000) / 10}%`);
}

/**
 * "Tue–Sat", "Mon, Wed, Fri", "Every day".
 * @param {string[]} days
 */
export function sittingDays(days) {
  const order = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  const idx = order.filter((d) => days.includes(d)).map((d) => order.indexOf(d));
  if (idx.length === 7) return "Every day";
  const runs = [];
  for (const i of idx) {
    const last = runs[runs.length - 1];
    if (last && last[1] === i - 1) last[1] = i; else runs.push([i, i]);
  }
  const name = (/** @type {number} */ i) => DAY_SHORT[/** @type {keyof typeof DAY_SHORT} */ (order[i])];
  return runs.map(([a, b]) => (a === b ? name(a) : b === a + 1 ? `${name(a)}, ${name(b)}` : `${name(a)}–${name(b)}`)).join(", ");
}

/**
 * Chair positions around a table in the room plan, in the plan's units: round tables get chairs on a
 * circle, long ones along both sides, booths on the bench side only.
 * @param {{ x: number, y: number, w: number, h: number, shape: string, seats: number }} t
 * @returns {{ cx: number, cy: number }[]}
 */
export function chairs(t) {
  const gap = 1.6;
  if (t.shape === "round") {
    const r = Math.max(t.w, t.h) / 2 + gap;
    return Array.from({ length: t.seats }, (_, i) => {
      const a = (i / t.seats) * Math.PI * 2 - Math.PI / 2;
      return { cx: round(t.x + t.w / 2 + r * Math.cos(a)), cy: round(t.y + t.h / 2 + r * Math.sin(a)) };
    });
  }
  if (t.shape === "booth") return [];
  const wide = t.w >= t.h;
  const per = Math.ceil(t.seats / 2);
  return Array.from({ length: t.seats }, (_, i) => {
    const side = i < per ? 0 : 1;
    const k = side === 0 ? i : i - per;
    const n = side === 0 ? per : t.seats - per;
    const f = (k + 0.5) / n;
    return wide
      ? { cx: round(t.x + f * t.w), cy: round(side === 0 ? t.y - gap : t.y + t.h + gap) }
      : { cx: round(side === 0 ? t.x - gap : t.x + t.w + gap), cy: round(t.y + f * t.h) };
  });
}

/** @param {number} n */
const round = (n) => Math.round(n * 10) / 10;

