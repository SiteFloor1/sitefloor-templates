// @ts-check
/** Skin kit additions to the shared Eleventy setup: the home sections, the UK rules, the menu, minutes, prices, dates. */
import { HOME_PARTS } from "./home.js";
import { CHECKED, SOURCES } from "./lib/rules.js";
import { allItems, itemById, minutesWords, pounds, fill } from "./lib/skin.js";
import { ukDate } from "../../core/lib/diary.js";

/** @param {any} eleventyConfig */
export default function skinKit(eleventyConfig) {
  eleventyConfig.addGlobalData("homeParts", { order: Object.keys(HOME_PARTS), paths: HOME_PARTS });
  eleventyConfig.addGlobalData("skinRules", { checked: ukDate(CHECKED, false), sources: SOURCES });
  eleventyConfig.addFilter("menuItem", (/** @type {any} */ menu, /** @type {string} */ id) => itemById(menu, id));
  eleventyConfig.addFilter("menuItems", (/** @type {any} */ menu) => allItems(menu));
  eleventyConfig.addFilter("byMinutes", (/** @type {any[]} */ items) => [...items].sort((a, b) => a.minutes - b.minutes || a.price - b.price));
  // By concern: each word the clinic uses, with its treatments, in the order the words first appear.
  eleventyConfig.addFilter("byConcern", (/** @type {any} */ menu) => {
    /** @type {Map<string, any[]>} */ const m = new Map();
    for (const x of allItems(menu)) for (const w of x.concerns ?? []) m.set(w, [...(m.get(w) ?? []), x]);
    return [...m].map(([word, items]) => ({ word, items }));
  });
  // By time: under an hour, an hour, longer.
  eleventyConfig.addFilter("byTime", (/** @type {any} */ menu) => {
    const items = allItems(menu).sort((a, b) => a.minutes - b.minutes || a.price - b.price);
    return [["Under an hour", (/** @type {number} */ m) => m < 60], ["An hour", (/** @type {number} */ m) => m >= 60 && m < 75], ["Longer", (/** @type {number} */ m) => m >= 75]]
      .map(([label, fit]) => ({ label, items: items.filter((x) => /** @type {(m: number) => boolean} */ (fit)(x.minutes)) })).filter((g) => g.items.length);
  });
  eleventyConfig.addFilter("withPages", (/** @type {any[]} */ cats) => cats.filter((c) => c.page));
  eleventyConfig.addFilter("mins", (/** @type {number} */ m) => minutesWords(m));
  eleventyConfig.addFilter("gbp", (/** @type {number} */ p) => pounds(p));
  eleventyConfig.addFilter("cost", (/** @type {any} */ x) => `${x.from ? "from " : ""}${pounds(x.price)}`);
  eleventyConfig.addFilter("ukDate", (/** @type {string} */ d) => ukDate(d, false));
  eleventyConfig.addFilter("newestFirst", (/** @type {any[]} */ items) => [...items].sort((a, b) => (a.date < b.date ? 1 : -1)));
  eleventyConfig.addFilter("byWeeks", (/** @type {any[]} */ steps) => [...steps].sort((a, b) => b.weeksBefore - a.weeksBefore));
  eleventyConfig.addFilter("weeksWords", (/** @type {number} */ n) => (n === 0 ? "The week of the day" : `${n} ${n === 1 ? "week" : "weeks"} before`));
  // The finder's message: the clinic's words with the treatment, minutes, price and word filled in.
  eleventyConfig.addFilter("finderText", (/** @type {string} */ t, /** @type {string} */ word, /** @type {any} */ x, /** @type {string} */ name) => fill(t, { name, treatment: x.name, minutes: x.minutes, price: x.price, word }));
  eleventyConfig.addFilter("courseItem", (/** @type {any} */ c, /** @type {any} */ menu) => itemById(menu, c.item));
}
