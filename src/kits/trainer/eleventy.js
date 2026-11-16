// @ts-check
/** Trainer kit additions to the shared Eleventy setup: the home sections and the diary's hours. */
import { HOME_PARTS, HOSTS } from "./home.js";
import { hoursOf, blockRow, sampleWeek } from "./lib/trainer.js";

/** @param {any} eleventyConfig */
export default function trainerKit(eleventyConfig) {
  eleventyConfig.addGlobalData("homeParts", { order: Object.keys(HOME_PARTS), paths: HOME_PARTS, hosts: HOSTS });
  // The home sections a page holds, in home order: `{% for id in "trainer-prices" | hostedHere %}`.
  eleventyConfig.addFilter("hostedHere", (/** @type {string} */ page) => Object.keys(HOME_PARTS).filter((id) => /** @type {Record<string, string>} */ (HOSTS)[id] === page));
  eleventyConfig.addFilter("whereIs", (/** @type {any[]} */ list, /** @type {string} */ key, /** @type {unknown} */ v) => (list ?? []).filter((x) => x?.[key] === v));
  eleventyConfig.addFilter("blockRow", (/** @type {any} */ b) => blockRow(b));
  eleventyConfig.addFilter("sampleWeek", (/** @type {string[]} */ focuses, /** @type {number} */ n) => sampleWeek(n, focuses));
  eleventyConfig.addFilter("programmeOf", (/** @type {any} */ site, /** @type {string} */ id) => (site.programmes?.items ?? []).find((/** @type {any} */ p) => p.id === id));
  eleventyConfig.addFilter("diaryHours", (/** @type {any} */ d) => hoursOf(d.from, d.to));
  // "£120"
  eleventyConfig.addFilter("pounds", (/** @type {number} */ n) => `£${n.toLocaleString("en-GB")}`);
  // A time set in the look's own figures, each digit in an equal box (the face has no tabular figures).
  eleventyConfig.addFilter("tabTime", (/** @type {string} */ t) => `<span class="tn">${[...t].map((c) => (c === ":" ? '<i class="tc">:</i>' : `<i>${c}</i>`)).join("")}</span>`);
}
