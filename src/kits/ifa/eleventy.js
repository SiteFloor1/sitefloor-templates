// @ts-check
/** ifa kit additions to the shared Eleventy setup: the home sections, the FCA facts, fees in pounds at build time. */
import { HOME_PARTS } from "./home.js";
import { REGISTER, OMBUDSMAN, RISK, NOT_ADVICE, SCAMSMART, CHECKED } from "./lib/fca.js";
import { statement, money, pounds, chargeWords } from "./lib/fees.js";
import { CHECKED as MS_CHECKED, SPA_CHECKER, NMPA_SOURCE } from "./lib/milestones.js";
import { TRACING, ASK } from "./lib/tracing.js";
import { MONTHS } from "./lib/year.js";

const UK = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/** @param {any} eleventyConfig */
export default function ifaKit(eleventyConfig) {
  eleventyConfig.addGlobalData("homeParts", { order: Object.keys(HOME_PARTS), paths: HOME_PARTS });
  eleventyConfig.addGlobalData("fca", { register: REGISTER, ombudsman: OMBUDSMAN, risk: RISK, notAdvice: NOT_ADVICE, scamsmart: SCAMSMART, checked: CHECKED });
  eleventyConfig.addGlobalData("pensionRules", { checked: MS_CHECKED, spa: SPA_CHECKER, nmpa: NMPA_SOURCE });
  eleventyConfig.addGlobalData("tracingInfo", { url: TRACING, ask: ASK });
  eleventyConfig.addGlobalData("months", MONTHS);
  // The statement as it first paints: the example amount worked out at build time, so the page reads right before
  // (and without) JavaScript. A broken schedule renders nothing, and the template links to the fees page instead.
  eleventyConfig.addFilter("feeStatement", (/** @type {any} */ fees, /** @type {number|undefined} */ amount) => {
    const s = statement(amount ?? fees.example, fees.schedule);
    return s.ok ? { ok: true, initial: money(s.initial), ongoing: money(s.ongoing), monthly: money(s.monthly), firstYear: money(s.firstYear) } : { ok: false };
  });
  eleventyConfig.addFilter("gbp", (/** @type {number} */ n) => pounds(n));
  eleventyConfig.addFilter("chargeWords", (/** @type {any} */ c) => chargeWords(c));
  eleventyConfig.addFilter("ukDate", (/** @type {string} */ ymd) => UK.format(new Date(`${ymd}T00:00:00Z`)));
  eleventyConfig.addFilter("newestFirst", (/** @type {any[]} */ items) => [...(items ?? [])].sort((a, b) => (a.date < b.date ? 1 : -1)));
  eleventyConfig.addFilter("topicById", (/** @type {any} */ t, /** @type {string} */ id) => (t?.items ?? []).find((/** @type {any} */ x) => x.id === id));
  // The service a topic page belongs to, for its "what to bring".
  eleventyConfig.addFilter("serviceFor", (/** @type {any} */ a, /** @type {string} */ topic) => (a?.items ?? []).find((/** @type {any} */ x) => x.topic === topic));
  eleventyConfig.addFilter("demoTag", (/** @type {string} */ mode) => (mode === "demo" ? " (demo)" : ""));
}
