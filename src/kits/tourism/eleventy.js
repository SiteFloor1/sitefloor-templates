// @ts-check
/** Tourism kit additions to the shared Eleventy setup: the home sections, journeys, months, maps and prices. */
import { HOME_PARTS } from "./home.js";
import { MONTHS, WHO, monthWords, monthMarks, byFit, pounds } from "./lib/tourism.js";
import { journeyMap, journeyFor } from "./kit.js";
import { buildNow } from "../../core/lib/build-day.js";

/** @param {any} eleventyConfig */
export default function tourismKit(eleventyConfig) {
  eleventyConfig.addGlobalData("homeParts", { order: Object.keys(HOME_PARTS), paths: HOME_PARTS });
  eleventyConfig.addGlobalData("tourMonths", MONTHS);
  eleventyConfig.addGlobalData("tourWho", Object.entries(WHO).map(([id, label]) => ({ id, label })));
  // The build day's month in London: the page has its final shape on first paint; the browser checks the real month.
  const month = () => Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", month: "numeric" }).format(new Date(buildNow())));
  eleventyConfig.addFilter("tourMonth", () => month());
  eleventyConfig.addFilter("tourOpening", (/** @type {any} */ site) => journeyFor(site, month()));
  eleventyConfig.addFilter("journey", (/** @type {any} */ J, /** @type {string} */ id) => (J?.items ?? []).find((/** @type {any} */ j) => j.id === id));
  eleventyConfig.addFilter("monthWords", (/** @type {number[]} */ go) => monthWords(go));
  eleventyConfig.addFilter("monthMarks", (/** @type {number[]} */ go) => monthMarks(go));
  eleventyConfig.addFilter("monthName", (/** @type {number} */ m) => MONTHS[m - 1]);
  eleventyConfig.addFilter("journeyMap", (/** @type {any} */ j) => journeyMap(j));
  eleventyConfig.addFilter("byFit", (/** @type {any[]} */ js, /** @type {any} */ q) => byFit(js, q));
  eleventyConfig.addFilter("tourPounds", (/** @type {number} */ n) => pounds(n));
  eleventyConfig.addFilter("stopPhotos", (/** @type {any} */ j) => [j.photo, ...j.stops.map((/** @type {any} */ s) => s.photo).filter(Boolean)]);
  // For each stop, which of the journey's photographs is on show: its own, else the last one before it.
  eleventyConfig.addFilter("stopPhotoIndex", (/** @type {any} */ j) => {
    let cur = 0, n = 0;
    return j.stops.map((/** @type {any} */ s) => { if (s.photo) { n += 1; cur = n; } return cur; });
  });
  eleventyConfig.addFilter("enquiry", (/** @type {any} */ j, /** @type {string} */ name) => `Hello ${name}, I'd like to know more about ${j.name} (${j.nights} nights).`);
  eleventyConfig.addFilter("climateAt", (/** @type {any} */ c, /** @type {string} */ key) => c?.places?.[key] ?? null);
}
