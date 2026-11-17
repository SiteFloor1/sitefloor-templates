// @ts-check
/** Stalls kit additions to the shared Eleventy setup: home sections, the week as first painted, prices and allergens. */
import { HOME_PARTS, homeOrderProblem } from "./home.js";
import { weekFromPattern, upcoming, nextStop, dayWord, longDay, shortDay, untilWords, minutesUntil, mapsHref, pounds, allergenWords, partyText, setupText, ALLERGENS } from "./lib/stalls.js";
import { buildNow } from "../../core/lib/build-day.js";
import { zonedNow } from "../../core/lib/hours.js";

/** @param {any} eleventyConfig */
export default function stallsKit(eleventyConfig) {
  eleventyConfig.addGlobalData("homeParts", { order: Object.keys(HOME_PARTS), paths: HOME_PARTS });
  eleventyConfig.addGlobalData("stallsAllergens", ALLERGENS);
  eleventyConfig.addFilter("checkHomeOrder", (/** @type {unknown} */ order) => { const p = homeOrderProblem(order ?? undefined); if (p) throw new Error(p); return order; });
  // The week as the page first paints it, from the usual pattern on the build day. The browser replaces it with the
  // sheet (or the demo's simulation) for the real day; with no JavaScript, it says "usually".
  /** @param {any} S @param {string} tz */
  const now = (S, tz) => zonedNow(new Date(buildNow()), tz ?? "Europe/London");
  eleventyConfig.addFilter("usualWeek", (/** @type {any} */ S, /** @type {string} */ tz, /** @type {number} */ limit) => upcoming(weekFromPattern(S.usual, now(S, tz).date), now(S, tz), limit ?? 6));
  eleventyConfig.addFilter("usualNext", (/** @type {any} */ S, /** @type {string} */ tz) => nextStop(weekFromPattern(S.usual, now(S, tz).date), now(S, tz)));
  eleventyConfig.addFilter("untilFirst", (/** @type {any} */ s, /** @type {any} */ S, /** @type {string} */ tz) => (s ? untilWords(minutesUntil(s, now(S, tz))) : ""));
  eleventyConfig.addFilter("stallPlace", (/** @type {any} */ S, /** @type {string} */ id) => (S.places ?? []).find((/** @type {any} */ p) => p.id === id) ?? { name: id, postcode: "" });
  eleventyConfig.addFilter("dayWord", (/** @type {string} */ ymd, /** @type {any} */ S, /** @type {string} */ tz) => dayWord(ymd, now(S, tz).date));
  eleventyConfig.addFilter("longDay", longDay);
  eleventyConfig.addFilter("shortDay", shortDay);
  eleventyConfig.addFilter("mapsHref", mapsHref);
  eleventyConfig.addFilter("gbp", pounds);
  eleventyConfig.addFilter("allergenWords", allergenWords);
  eleventyConfig.addFilter("partyText", (/** @type {string} */ opening) => partyText(opening, {}));
  eleventyConfig.addFilter("setupText", (/** @type {any[]} */ rows, /** @type {string} */ name) => setupText(name, rows));
  // The allergen codes a menu uses, for its key: "G gluten · E egg · M milk".
  eleventyConfig.addFilter("allergenKey", (/** @type {any[]} */ items) => {
    const used = new Set(items.flatMap((i) => (i.allergens ?? "").split(/\s+/).filter(Boolean)));
    return Object.entries(ALLERGENS).filter(([c]) => used.has(c)).map(([c, w]) => `${c} ${w.toLowerCase()}`).join(" · ");
  });
}
