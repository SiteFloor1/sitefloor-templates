// @ts-check
/** Wealth kit additions to the shared Eleventy setup: the home sections, the FCA facts, links between the kit's pages. */
import { HOME_PARTS, onPagesProblem } from "./home.js";
import { REGISTER, OMBUDSMAN, CAPITAL_AT_RISK, NOT_ADVICE, CHECKED } from "./lib/fca.js";
import { ukDate } from "./lib/insights.js";
import { SECTIONS, SOURCES, CHECKED as WISHES_CHECKED } from "./lib/wishes.js";

/** @param {any} eleventyConfig */
export default function wealthKit(eleventyConfig) {
  eleventyConfig.addGlobalData("homeParts", { order: Object.keys(HOME_PARTS), paths: HOME_PARTS });
  eleventyConfig.addGlobalData("fca", { register: REGISTER, ombudsman: OMBUDSMAN, capitalAtRisk: CAPITAL_AT_RISK, notAdvice: NOT_ADVICE, checked: CHECKED });
  eleventyConfig.addGlobalData("wishes", { sections: SECTIONS, sources: SOURCES, checked: WISHES_CHECKED });
  eleventyConfig.addFilter("hostedBy", (/** @type {Record<string, string[]>|null} */ onPages) => {
    const problem = onPagesProblem(onPages ?? undefined);
    if (problem) throw new Error(problem);
    return Object.fromEntries(Object.entries(onPages ?? {}).flatMap(([page, parts]) => parts.map((part) => [part, page])));
  });
  eleventyConfig.addFilter("hosted", (/** @type {Record<string, string[]>|null} */ onPages, /** @type {string} */ page) => (onPages ?? {})[page] ?? []);
  eleventyConfig.addFilter("ukDate", ukDate);
  eleventyConfig.addFilter("newestFirst", (/** @type {any[]} */ items) => [...(items ?? [])].sort((a, b) => (a.date < b.date ? 1 : -1)));
  eleventyConfig.addFilter("lifeEvent", (/** @type {any} */ le, /** @type {string} */ id) => (le?.items ?? []).find((/** @type {any} */ e) => e.id === id));
  eleventyConfig.addFilter("insightsById", (/** @type {any} */ ins, /** @type {string[]} */ ids) => (ids ?? []).map((id) => (ins?.items ?? []).find((/** @type {any} */ x) => x.id === id)).filter(Boolean));
  eleventyConfig.addFilter("insightPhoto", (/** @type {any} */ ins, /** @type {string} */ key) => ins.photos[key] ?? Object.values(ins.photos)[0]);
  eleventyConfig.addFilter("advisersFor", (/** @type {any} */ people, /** @type {string} */ event) => (people?.items ?? []).filter((/** @type {any} */ p) => (p.leads ?? []).includes(event)));
  eleventyConfig.addFilter("demoTag", (/** @type {string} */ mode) => (mode === "demo" ? " (demo)" : ""));
}
