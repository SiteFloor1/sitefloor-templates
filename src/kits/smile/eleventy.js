// @ts-check
/** Smile kit additions to the shared Eleventy setup: the home sections, the UK rules, clinicians by id, prices, dates. */
import { HOME_PARTS } from "./home.js";
import { CHECKED, SOURCES, REGISTER, GDC, DCS, WHITENING_RULE, UNDER_18, ROLES, STATUS } from "./lib/gdc.js";
import { spanWords, duration, clock, minutesOf, arrivalTimes } from "./lib/smile.js";
import { ukDate } from "../../core/lib/diary.js";

/** @param {any} eleventyConfig */
export default function smileKit(eleventyConfig) {
  eleventyConfig.addGlobalData("homeParts", { order: Object.keys(HOME_PARTS), paths: HOME_PARTS });
  eleventyConfig.addGlobalData("gdc", { checked: ukDate(CHECKED, false), sources: SOURCES, register: REGISTER, gdc: GDC, dcs: DCS, rule: WHITENING_RULE, under18: UNDER_18, status: STATUS });
  eleventyConfig.addFilter("clinician", (/** @type {any} */ c, /** @type {string} */ id) => c.items.find((/** @type {any} */ p) => p.id === id));
  eleventyConfig.addFilter("cliniciansOf", (/** @type {any} */ c, /** @type {string[]} */ ids) => ids.map((id) => c.items.find((/** @type {any} */ p) => p.id === id)).filter(Boolean));
  eleventyConfig.addFilter("roleLabel", (/** @type {string} */ r) => ROLES[r]?.label ?? r);
  eleventyConfig.addFilter("treatment", (/** @type {any} */ t, /** @type {string} */ id) => t.items.find((/** @type {any} */ x) => x.id === id));
  // "from £395", "£95", "from £280 a tooth"
  eleventyConfig.addFilter("price", (/** @type {any} */ p) => `${p.from !== undefined ? "from " : ""}£${(p.from ?? p.fixed).toLocaleString("en-GB")}${p.unit ? ` ${p.unit}` : ""}`);
  eleventyConfig.addFilter("spanWords", (/** @type {any[]} */ v) => spanWords(v));
  eleventyConfig.addFilter("duration", (/** @type {number} */ m) => duration(m));
  eleventyConfig.addFilter("byWeeks", (/** @type {any[]} */ steps) => [...steps].sort((a, b) => b.weeksBefore - a.weeksBefore));
  eleventyConfig.addFilter("weeksWords", (/** @type {number} */ n) => (n === 0 ? "The week of the day" : `${n} ${n === 1 ? "week" : "weeks"} before`));
  eleventyConfig.addFilter("ukDate", (/** @type {string} */ d) => ukDate(d, false));
  eleventyConfig.addFilter("newestFirst", (/** @type {any[]} */ items) => [...items].sort((a, b) => (a.date < b.date ? 1 : -1)));
  eleventyConfig.addFilter("clock", (/** @type {string} */ t) => clock(minutesOf(t)));
  eleventyConfig.addFilter("arrive", (/** @type {any} */ a) => arrivalTimes(a.start, a.steps));
  eleventyConfig.addFilter("whitening", (/** @type {any} */ t) => t.items.filter((/** @type {any} */ x) => x.whitening));
}
