// @ts-check
/** Hol kit additions to the shared Eleventy setup: the home sections, the rules by region, the estimate and money. */
import { HOME_PARTS } from "./home.js";
import { REGIONS, longDate, rulesState } from "./lib/rules.js";
import { estimate, LONDON_RULE } from "./lib/estimate.js";
import { pounds, feeOn } from "./lib/money.js";
import { statementFee, turnoverHours, codeHash } from "./lib/owners.js";

/** @param {any} eleventyConfig */
export default function holKit(eleventyConfig) {
  eleventyConfig.addGlobalData("homeParts", { order: Object.keys(HOME_PARTS), paths: HOME_PARTS });
  eleventyConfig.addGlobalData("holRegions", REGIONS);
  eleventyConfig.addGlobalData("londonRule", { ...LONDON_RULE, checkedText: longDate(LONDON_RULE.checked) });
  eleventyConfig.addFilter("gbp", pounds);
  eleventyConfig.addFilter("feeOn", (/** @type {number} */ amount, /** @type {number} */ percent) => feeOn(amount, percent));
  eleventyConfig.addFilter("longDate", (/** @type {string} */ ymd) => longDate(ymd));
  eleventyConfig.addFilter("ruleState", (/** @type {any} */ rule, /** @type {string} */ today) => rulesState(rule, today));
  // the estimate at its first view (the most common size, no own weeks), so the sum reads the same without JavaScript
  eleventyConfig.addFilter("firstEstimate", (/** @type {any} */ site) => {
    const fig = { ...site.estimate, percent: site.fees.percent };
    const beds = fig.sizes.reduce((/** @type {any} */ a, /** @type {any} */ s) => (s.homes > a.homes ? s : a)).beds;
    return estimate(fig, beds, 0);
  });
  eleventyConfig.addFilter("statementFee", (/** @type {any} */ s, /** @type {number} */ percent) => statementFee(s, percent));
  eleventyConfig.addFilter("turnoverHours", (/** @type {any[]} */ steps) => turnoverHours(steps));
  eleventyConfig.addFilter("codeHash", (/** @type {string} */ c) => codeHash(c));
  eleventyConfig.addFilter("homeById", (/** @type {any} */ homes, /** @type {string} */ id) => (homes?.items ?? []).find((/** @type {any} */ h) => h.id === id));
  eleventyConfig.addFilter("hoursWord", (/** @type {number} */ n) => ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"][n] ?? String(n));
  eleventyConfig.addFilter("demoTag", (/** @type {string} */ mode) => (mode === "demo" ? " (sample)" : ""));
}
