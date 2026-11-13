// @ts-check
/** Electrician kit additions to the shared Eleventy setup: the home sections, sections hosted on pages, prices. */
import { HOME_PARTS, onPagesProblem, homeOrderProblem } from "./home.js";
import { pounds } from "./lib/quotes.js";
import { KINDS } from "./lib/certificates.js";
import { REGISTERS } from "./config.js";

/** @param {any} eleventyConfig */
export default function electricianKit(eleventyConfig) {
  eleventyConfig.addGlobalData("homeParts", { order: Object.keys(HOME_PARTS), paths: HOME_PARTS });
  eleventyConfig.addFilter("hostedBy", (/** @type {Record<string, string[]>|null} */ onPages) => {
    const problem = onPagesProblem(onPages ?? undefined);
    if (problem) throw new Error(problem);
    return Object.fromEntries(Object.entries(onPages ?? {}).flatMap(([page, parts]) => parts.map((part) => [part, page])));
  });
  eleventyConfig.addFilter("hosted", (/** @type {Record<string, string[]>|null} */ onPages, /** @type {string} */ page) => (onPages ?? {})[page] ?? []);
  eleventyConfig.addFilter("homeOrderOk", (/** @type {string[]|null} */ order) => {
    const problem = homeOrderProblem(order ?? undefined);
    if (problem) throw new Error(problem);
    return order;
  });
  eleventyConfig.addFilter("pounds", (/** @type {number} */ n) => pounds(n));
  eleventyConfig.addFilter("registerName", (/** @type {string} */ id) => /** @type {Record<string, { name: string }>} */ (REGISTERS)[id]?.name ?? id);
  eleventyConfig.addGlobalData("certKinds", KINDS);
  eleventyConfig.addFilter("pad2", (/** @type {number} */ n) => String(n).padStart(2, "0"));
}
