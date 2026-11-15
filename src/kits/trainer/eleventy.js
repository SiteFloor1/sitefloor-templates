// @ts-check
/** Trainer kit additions to the shared Eleventy setup: the home sections and the diary's hours. */
import { HOME_PARTS } from "./home.js";
import { hoursOf } from "./lib/trainer.js";

/** @param {any} eleventyConfig */
export default function trainerKit(eleventyConfig) {
  eleventyConfig.addGlobalData("homeParts", { order: Object.keys(HOME_PARTS), paths: HOME_PARTS });
  eleventyConfig.addFilter("diaryHours", (/** @type {any} */ d) => hoursOf(d.from, d.to));
  // "£120"
  eleventyConfig.addFilter("pounds", (/** @type {number} */ n) => `£${n.toLocaleString("en-GB")}`);
  // A time set in the look's own figures, each digit in an equal box (the face has no tabular figures).
  eleventyConfig.addFilter("tabTime", (/** @type {string} */ t) => `<span class="tn">${[...t].map((c) => (c === ":" ? '<i class="tc">:</i>' : `<i>${c}</i>`)).join("")}</span>`);
}
