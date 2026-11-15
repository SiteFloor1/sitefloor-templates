// @ts-check
/** Cleaning kit additions to the shared Eleventy setup: the home sections and the visit's figures, worked out once. */
import { HOME_PARTS } from "./home.js";
import { visit, hm, gbp, ruler, visitWords, homeWords, oftenWords } from "./lib/visit.js";
import { ukDate } from "../../core/lib/diary.js";

/** @param {any} eleventyConfig */
export default function cleaningKit(eleventyConfig) {
  eleventyConfig.addGlobalData("homeParts", { order: Object.keys(HOME_PARTS), paths: HOME_PARTS });
  // the visit shown before any script runs: the company's default home, from the same function the browser uses
  eleventyConfig.addFilter("visitOf", (/** @type {any} */ v, /** @type {any} */ choice) => visit(v, choice ?? v.defaults));
  eleventyConfig.addFilter("visitWords", (/** @type {any} */ v, /** @type {any} */ c, /** @type {string} */ name) => visitWords(c, v, name));
  eleventyConfig.addFilter("homeWords", (/** @type {any} */ c) => homeWords(c));
  eleventyConfig.addFilter("oftenWords", (/** @type {any} */ f) => oftenWords(f));
  eleventyConfig.addFilter("hm", (/** @type {number} */ m) => hm(m));
  eleventyConfig.addFilter("gbp", (/** @type {number} */ n) => gbp(n));
  eleventyConfig.addFilter("ruler", (/** @type {number} */ work) => ruler(work));
  eleventyConfig.addFilter("ukDate", (/** @type {string} */ d) => ukDate(d, false));
  eleventyConfig.addFilter("newestFirst", (/** @type {any[]} */ items) => [...items].sort((a, b) => (a.date < b.date ? 1 : -1)));
  eleventyConfig.addFilter("service", (/** @type {any} */ s, /** @type {string} */ id) => s.items.find((/** @type {any} */ x) => x.id === id));
  eleventyConfig.addFilter("rateWords", (/** @type {any} */ s) => (s.rate !== undefined ? `${gbp(s.rate)} an hour` : `from ${gbp(s.from)}${s.unit ? ` ${s.unit}` : ""}`));
}
