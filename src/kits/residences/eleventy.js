// @ts-check
/** Residences kit additions to the shared Eleventy setup: the home sections, the dated rules, money and the map. */
import { HOME_PARTS } from "./home.js";
import { RULES, ukDay } from "./lib/rules.js";
import { pounds } from "./lib/stay.js";
import { layout, rings, walkText } from "./lib/map.js";

/** @param {any} eleventyConfig */
export default function residencesKit(eleventyConfig) {
  eleventyConfig.addGlobalData("homeParts", { order: Object.keys(HOME_PARTS), paths: HOME_PARTS });
  eleventyConfig.addGlobalData("rules", { ...RULES, checkedText: ukDay(RULES.checked) });
  eleventyConfig.addFilter("pounds", pounds);
  eleventyConfig.addFilter("ukDay", ukDay);
  eleventyConfig.addFilter("demoTag", (/** @type {string} */ mode) => (mode === "demo" ? " (demo)" : ""));
  eleventyConfig.addFilter("sampleTag", (/** @type {string} */ mode) => (mode === "demo" ? " Sample figures for this demo." : ""));
  eleventyConfig.addFilter("mapLayout", (/** @type {any} */ n, /** @type {number} */ size) => layout(n.centre, n.places, size, n.ring));
  eleventyConfig.addFilter("mapRings", (/** @type {any} */ n, /** @type {number} */ size) => rings(Array.from({ length: Math.floor(n.ring / 5) }, (_, i) => (i + 1) * 5), size, n.ring));
  eleventyConfig.addFilter("walkText", walkText);
}
