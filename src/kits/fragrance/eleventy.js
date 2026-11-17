// @ts-check
/** Fragrance kit additions to the shared Eleventy setup: the home sections, notes, sizes, prices and launch dates. */
import { HOME_PARTS } from "./home.js";
import { notesClauses, notesSentence, alsoInLine, per10ml, sizeScale, pounds, joinAnd, dayMonth, launchState, fill, allNotes, engraved } from "./lib/fragrance.js";
import { buildNow } from "../../core/lib/build-day.js";

const ukToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(buildNow()));

/** @param {any} eleventyConfig */
export default function fragranceKit(eleventyConfig) {
  eleventyConfig.addGlobalData("homeParts", { order: Object.keys(HOME_PARTS), paths: HOME_PARTS });
  eleventyConfig.addFilter("fragranceById", (/** @type {any} */ f, /** @type {string} */ id) => f.items.find((/** @type {any} */ x) => x.id === id));
  eleventyConfig.addFilter("notesClauses", (/** @type {any} */ notes) => notesClauses(notes ?? {}));
  eleventyConfig.addFilter("notesSentence", (/** @type {any} */ notes) => notesSentence(notes ?? {}));
  eleventyConfig.addFilter("alsoInLine", (/** @type {any[]} */ items, /** @type {string} */ note, /** @type {string} */ except) => alsoInLine(items, note, except));
  eleventyConfig.addFilter("allNotes", allNotes);
  eleventyConfig.addFilter("per10ml", (/** @type {any} */ s) => per10ml(s.price, s.ml));
  eleventyConfig.addFilter("sizeScale", (/** @type {any} */ s, /** @type {any[]} */ sizes) => sizeScale(s.ml, Math.max(...sizes.map((x) => x.ml))));
  eleventyConfig.addFilter("gbp", (/** @type {number} */ n) => pounds(n));
  eleventyConfig.addFilter("joinAnd", joinAnd);
  eleventyConfig.addFilter("dayMonth", dayMonth);
  eleventyConfig.addFilter("engraved", engraved);
  // Launch mode at build time; the page checks again in the browser, so a site built before the day still opens on it.
  eleventyConfig.addFilter("launchState", (/** @type {any} */ l) => launchState(l, ukToday()));
  eleventyConfig.addFilter("sizeFor", (/** @type {any} */ x, /** @type {number} */ ml) => x.sizes.find((/** @type {any} */ s) => s.ml === ml) ?? x.sizes[0]);
  eleventyConfig.addFilter("defaultSize", (/** @type {any} */ x) => x.sizes[Math.min(1, x.sizes.length - 1)]);
  eleventyConfig.addFilter("orderText", (/** @type {string} */ t, /** @type {any} */ x, /** @type {any} */ s, /** @type {string} */ name) => fill(t, { name, fragrance: x.name, ml: s.ml, price: pounds(s.price) }));
  eleventyConfig.addFilter("frame", (/** @type {string} */ pattern, /** @type {number} */ n) => pattern.replace("{n}", String(n).padStart(2, "0")));
}
