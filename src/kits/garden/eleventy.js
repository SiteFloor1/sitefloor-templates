// @ts-check
/** Garden kit additions to the shared Eleventy setup: home sections, month words, lookups and dates in UK order. */
import { HOME_PARTS, homeOrderProblem, onPagesProblem } from "./home.js";
import { MONTHS, MONTH_SHORT, LIGHT, CARE, monthsWords, priceWords, rota, isFresh, monthOf, readyMonths } from "./lib/garden.js";
import { compass, FACINGS, sunHours, parts, dayWords } from "./lib/sun-study.js";
import { drawGarden } from "./lib/sun-draw.js";
import { ukDate } from "../../core/lib/diary.js";

/** @param {any} eleventyConfig */
export default function gardenKit(eleventyConfig) {
  eleventyConfig.addGlobalData("homeParts", { order: Object.keys(HOME_PARTS), paths: HOME_PARTS });
  // sections a look moved off home: { part: page feature } for the home page, [parts] for a page
  eleventyConfig.addFilter("hostedBy", (/** @type {Record<string, string[]>|null} */ onPages) => {
    const problem = onPagesProblem(onPages ?? undefined);
    if (problem) throw new Error(problem);
    return Object.fromEntries(Object.entries(onPages ?? {}).flatMap(([page, parts]) => parts.map((part) => [part, page])));
  });
  eleventyConfig.addFilter("hosted", (/** @type {Record<string, string[]>|null} */ onPages, /** @type {string} */ page) => (onPages ?? {})[page] ?? []);
  eleventyConfig.addFilter("homeOrderOk", (/** @type {unknown} */ order) => { const p = homeOrderProblem(order); if (p) throw new Error(p); return order; });
  eleventyConfig.addGlobalData("gardenWords", { months: MONTHS, short: MONTH_SHORT, light: LIGHT, care: CARE });
  eleventyConfig.addFilter("monthOf", monthOf);
  eleventyConfig.addFilter("readyMonths", readyMonths);
  eleventyConfig.addFilter("monthsWords", monthsWords);
  eleventyConfig.addFilter("priceWords", priceWords);
  eleventyConfig.addFilter("rota", rota);
  eleventyConfig.addFilter("isFresh", isFresh);
  eleventyConfig.addFilter("facingWords", (/** @type {keyof typeof FACINGS} */ f) => (f ? `${compass(FACINGS[f])}-facing` : ""));
  eleventyConfig.addFilter("ukDay", (/** @type {string} */ d) => ukDate(d, false));
  eleventyConfig.addFilter("newestFirst", (/** @type {any[]} */ items) => [...items].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)));
  // Nunjucks has no "equalto" lookups, so finding by id is a filter.
  eleventyConfig.addFilter("byId", (/** @type {any[]} */ list, /** @type {string} */ id) => (list ?? []).find((x) => x.id === id) ?? null);
  eleventyConfig.addFilter("byIds", (/** @type {any[]} */ list, /** @type {string[]} */ wanted) => (wanted ?? []).map((id) => (list ?? []).find((x) => x.id === id)).filter(Boolean));
  eleventyConfig.addFilter("where", (/** @type {any[]} */ list, /** @type {string} */ key, /** @type {unknown} */ value) => (list ?? []).filter((x) => x[key] === value));
  eleventyConfig.addFilter("pageFor", (/** @type {any[]} */ list, /** @type {string} */ key, /** @type {string} */ value) => (list ?? []).find((x) => x[key] === value) ?? null);
  eleventyConfig.addFilter("usedStyles", (/** @type {any} */ g) => g.styles.filter((/** @type {any} */ s) => g.items.some((/** @type {any} */ x) => x.style === s.id)));
  eleventyConfig.addFilter("bestIn", (/** @type {any[]} */ plants, /** @type {number} */ m) => (plants ?? []).filter((p) => p.months.includes(m)));
  eleventyConfig.addFilter("pluck", (/** @type {any[]} */ list, /** @type {string} */ key) => (list ?? []).map((x) => x[key]));
  // The sun study's picture without JavaScript: the studio's example garden, hours of sun on 21 June.
  eleventyConfig.addFilter("sunPicture", (/** @type {any} */ sun, /** @type {string} */ tz, /** @type {string} */ today) => {
    const g = sun.garden, facing = FACINGS[/** @type {keyof typeof FACINGS} */ (g.facing)];
    const hours = sunHours(g, facing, { lat: sun.lat, lng: sun.lng, tz }, Number(today.slice(0, 4)), 6);
    return { ...drawGarden({ g, facing, view: "plan", hours, sun: null, id: "ss0" }), words: dayWords(parts(hours), "June") };
  });
  eleventyConfig.addFilter("paras", (/** @type {string} */ s) => String(s ?? "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean));
}
