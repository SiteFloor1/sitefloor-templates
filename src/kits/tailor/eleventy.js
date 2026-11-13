// @ts-check
/** Tailor kit additions to the shared Eleventy setup: home sections, the cloth book's words, dates in UK order. */
import { HOME_PARTS, onPagesProblem } from "./home.js";
import { SEASONS, seasonWords, fromPrice, showDates, upcoming, swatchText, travelText, clockWords, bringLine } from "./lib/tailor.js";
import { usedKinds } from "./lib/lexicon.js";
import { ukDate } from "../../core/lib/diary.js";

/** @param {any} eleventyConfig */
export default function tailorKit(eleventyConfig) {
  eleventyConfig.addGlobalData("homeParts", { order: Object.keys(HOME_PARTS), paths: HOME_PARTS });
  eleventyConfig.addFilter("hostedBy", (/** @type {Record<string, string[]>|null} */ onPages) => {
    const problem = onPagesProblem(onPages ?? undefined);
    if (problem) throw new Error(problem);
    return Object.fromEntries(Object.entries(onPages ?? {}).flatMap(([page, parts]) => parts.map((part) => [part, page])));
  });
  eleventyConfig.addFilter("hosted", (/** @type {Record<string, string[]>|null} */ onPages, /** @type {string} */ page) => (onPages ?? {})[page] ?? []);
  eleventyConfig.addFilter("seasonWords", seasonWords);
  // Only the seasons the house's cloths are for, so the filter never offers a choice that shows nothing.
  eleventyConfig.addFilter("usedSeasons", (/** @type {any[]} */ items) => Object.entries(SEASONS)
    .filter(([id]) => id !== "all-year" && items.some((c) => c.seasons.includes(id) || c.seasons.includes("all-year"))).map(([id, label]) => ({ id, label })));
  eleventyConfig.addFilter("fromPrice", fromPrice);
  eleventyConfig.addFilter("swatchText", swatchText);
  eleventyConfig.addFilter("travelText", travelText);
  eleventyConfig.addFilter("clockWords", clockWords);
  eleventyConfig.addFilter("bringLine", bringLine);
  eleventyConfig.addFilter("showDates", showDates);
  eleventyConfig.addFilter("upcomingTravels", upcoming);
  eleventyConfig.addFilter("usedKinds", usedKinds);
  eleventyConfig.addFilter("stepOf", (/** @type {any} */ process, /** @type {string} */ id) => process.steps.find((/** @type {any} */ s) => s.id === id));
  eleventyConfig.addFilter("clothOf", (/** @type {any} */ cloths, /** @type {string} */ id) => cloths.items.find((/** @type {any} */ c) => c.id === id));
  // Nunjucks' selectattr has no "equalto" test, so a lookup by id is a filter of its own.
  eleventyConfig.addFilter("garmentOf", (/** @type {any} */ garments, /** @type {string} */ id) => garments.items.find((/** @type {any} */ g) => g.id === id) ?? null);
  eleventyConfig.addFilter("orderStep", (/** @type {any} */ w) => w.steps.find((/** @type {any} */ s) => s.id === w.orderStep));
  eleventyConfig.addFilter("byWeeks", (/** @type {any[]} */ steps) => [...steps].sort((a, b) => b.weeksBefore - a.weeksBefore));
  eleventyConfig.addFilter("newestFirst", (/** @type {any[]} */ items) => [...items].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)));
  eleventyConfig.addFilter("ukDay", (/** @type {string} */ d) => ukDate(d, true));
  eleventyConfig.addFilter("yearsFrom", (/** @type {string} */ today, /** @type {number} */ n) => { const y = Number(today.slice(0, 4)); return Array.from({ length: n }, (_, i) => y + i); });
}
