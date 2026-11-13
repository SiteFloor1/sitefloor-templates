// @ts-check
/** Bridal kit additions to the shared Eleventy setup: the home sections, gowns and their words, dates in UK order. */
import { HOME_PARTS, onPagesProblem } from "./home.js";
import { SILHOUETTES, NECKLINES, SLEEVES, tryGownText } from "./lib/gowns.js";
import { ukDate } from "../../core/lib/diary.js";

/** @param {any} eleventyConfig */
export default function bridalKit(eleventyConfig) {
  eleventyConfig.addGlobalData("homeParts", { order: Object.keys(HOME_PARTS), paths: HOME_PARTS });
  // Which page a home section moves to when that page is on: { part: page feature }.
  eleventyConfig.addFilter("hostedBy", (/** @type {Record<string, string[]>|null} */ onPages) => {
    const problem = onPagesProblem(onPages ?? undefined);
    if (problem) throw new Error(problem);
    return Object.fromEntries(Object.entries(onPages ?? {}).flatMap(([page, parts]) => parts.map((part) => [part, page])));
  });
  eleventyConfig.addFilter("hosted", (/** @type {Record<string, string[]>|null} */ onPages, /** @type {string} */ page) => (onPages ?? {})[page] ?? []);
  eleventyConfig.addGlobalData("gownWords", { silhouettes: SILHOUETTES, necklines: NECKLINES, sleeves: SLEEVES });
  eleventyConfig.addFilter("house", (/** @type {any} */ designers, /** @type {string} */ id) => designers.items.find((/** @type {any} */ h) => h.id === id));
  eleventyConfig.addFilter("tryText", (/** @type {string} */ opening, /** @type {any} */ g, /** @type {any} */ designers) => tryGownText(opening, { name: g.name, houseName: designers.items.find((/** @type {any} */ h) => h.id === g.house)?.name ?? "" }));
  // Only the words the salon's gowns use, so the finder never offers a choice that shows nothing.
  eleventyConfig.addFilter("usedWords", (/** @type {any} */ g, /** @type {string} */ key, /** @type {Record<string, string>} */ words) => Object.entries(words).filter(([id]) => g.items.some((/** @type {any} */ x) => x[key] === id)).map(([id, label]) => ({ id, label })));
  eleventyConfig.addFilter("gownPrice", (/** @type {number|null} */ n) => (n ? `£${n.toLocaleString("en-GB")}` : "Price on request"));
  eleventyConfig.addFilter("homeGowns", (/** @type {any} */ g) => g.items.filter((/** @type {any} */ x) => x.editorial).slice(0, 3));
  eleventyConfig.addFilter("gownsOf", (/** @type {any} */ g, /** @type {string} */ house) => g.items.filter((/** @type {any} */ x) => x.house === house));
  // Shows that haven't finished by the build date, soonest first; the page's script drops any that finish later.
  eleventyConfig.addFilter("upcomingShows", (/** @type {any[]} */ items, /** @type {string} */ today) => items.filter((e) => e.to >= today).sort((a, b) => (a.from < b.from ? -1 : 1)));
  eleventyConfig.addFilter("orderStep", (/** @type {any} */ d) => d.steps.find((/** @type {any} */ s) => s.id === d.orderStep));
  eleventyConfig.addFilter("byWeeks", (/** @type {any[]} */ steps) => [...steps].sort((a, b) => b.weeksBefore - a.weeksBefore));
  eleventyConfig.addFilter("ukDate", (/** @type {string} */ d) => ukDate(d, false));
  eleventyConfig.addFilter("ukDay", (/** @type {string} */ d) => ukDate(d, true));
  eleventyConfig.addFilter("showDates", (/** @type {any} */ e) => {
    if (e.from === e.to) return ukDate(e.from, true);
    const a = ukDate(e.from, false).split(" "), b = ukDate(e.to, false).split(" ");
    return a[1] === b[1] && a[2] === b[2] ? `${a[0]}–${b[0]} ${b[1]} ${b[2]}` : `${ukDate(e.from, false)} – ${ukDate(e.to, false)}`;
  });
  eleventyConfig.addFilter("yearsFrom", (/** @type {string} */ today, /** @type {number} */ n) => { const y = Number(today.slice(0, 4)); return Array.from({ length: n }, (_, i) => y + i); });
}
