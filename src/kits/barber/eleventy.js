// @ts-check
/** Barber kit additions to the shared Eleventy setup: diagram filters, style-guide copy and home sections. */
import { faceSVG } from "./lib/face-svg.js";
import { profileSVG, FADE_TOP } from "./lib/profile-svg.js";
import * as styleGuide from "./data/style-guide.js";
import { HOME_PARTS } from "./home.js";

/** @param {any} eleventyConfig */
export default function barberKit(eleventyConfig) {
  eleventyConfig.addGlobalData("styleGuide", { ...styleGuide });
  eleventyConfig.addGlobalData("homeParts", { order: Object.keys(HOME_PARTS), paths: HOME_PARTS });
  eleventyConfig.addFilter("faceSvg", (/** @type {any} */ shape, /** @type {string} */ name) => faceSVG(shape, name));
  eleventyConfig.addFilter("fadeSvg", (/** @type {{ id: string, fade: any, height: "low"|"mid"|"high", label: string }} */ o) =>
    profileSVG({ id: o.id, fade: o.fade, fadeTop: FADE_TOP.adult[o.height], length: 8, showFadeLine: false, label: o.label }));
}
