// @ts-check
/** Law kit additions to the shared Eleventy setup: the home sections, people and areas by id, UK dates, prices. */
import { HOME_PARTS, onPagesProblem } from "./home.js";
import { SRA_SERVICES, OMBUDSMAN, SRA, CHECKED } from "./lib/sra.js";
import { layout } from "./lib/succession.js";
import { RELATIVES, FIXED_SUM, CHECKED as INT_CHECKED, SOURCES as INT_SOURCES } from "./lib/intestacy.js";

/** @param {any} eleventyConfig */
export default function lawKit(eleventyConfig) {
  eleventyConfig.addGlobalData("homeParts", { order: Object.keys(HOME_PARTS), paths: HOME_PARTS });
  eleventyConfig.addGlobalData("intestacyRules", {
    first: [["spouse", "A husband, wife or civil partner"], ["partner", "A partner you are not married to"], ["children", "Children"], ["grandchildrenOfDeadChild", "Grandchildren whose parent has died"]],
    relatives: RELATIVES.map(([k, label]) => [k, label]), fixed: FIXED_SUM.toLocaleString("en-GB"), checked: INT_CHECKED, sources: INT_SOURCES,
  });
  // The facts a practice can honestly show: the published price and timescale of a service it offers, and its most-asked question.
  eleventyConfig.addFilter("areaFacts", (/** @type {any} */ a, /** @type {any} */ site) => {
    const svc = (site.features.includes("pricing") ? site.pricing?.services ?? [] : []).find((/** @type {any} */ x) => (a.sraServices ?? []).includes(x.service));
    const price = !svc ? "" : svc.price.fixed !== undefined ? `£${svc.price.fixed.toLocaleString("en-GB")}` : svc.price.from !== undefined ? `£${svc.price.from.toLocaleString("en-GB")} to £${svc.price.to.toLocaleString("en-GB")}` : `£${svc.price.hourly.toLocaleString("en-GB")} an hour`;
    return { service: svc?.service ?? "", name: svc?.name ?? "", price, timescale: svc?.timescale ?? "", asked: a.asked ?? null };
  });
  eleventyConfig.addGlobalData("regulator", { services: SRA_SERVICES, ombudsman: OMBUDSMAN, sra: SRA, checked: CHECKED });
  eleventyConfig.addFilter("hostedBy", (/** @type {Record<string, string[]>|null} */ onPages) => {
    const problem = onPagesProblem(onPages ?? undefined);
    if (problem) throw new Error(problem);
    return Object.fromEntries(Object.entries(onPages ?? {}).flatMap(([page, parts]) => parts.map((part) => [part, page])));
  });
  eleventyConfig.addFilter("hosted", (/** @type {Record<string, string[]>|null} */ onPages, /** @type {string} */ page) => (onPages ?? {})[page] ?? []);
  eleventyConfig.addFilter("person", (/** @type {any} */ people, /** @type {string} */ id) => people.items.find((/** @type {any} */ p) => p.id === id));
  eleventyConfig.addFilter("area", (/** @type {any} */ practice, /** @type {string} */ id) => practice.items.find((/** @type {any} */ a) => a.id === id));
  eleventyConfig.addFilter("peopleIn", (/** @type {any} */ people, /** @type {string} */ area, /** @type {string} */ except) => people.items.filter((/** @type {any} */ p) => (p.practice ?? []).includes(area) && p.id !== except));
  // "Alice Hart, Ben Cole and Cara Dunn" @param names
  eleventyConfig.addFilter("andList", (/** @type {string[]} */ names) => (names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`));
  eleventyConfig.addFilter("areaNames", (/** @type {string[]} */ ids, /** @type {any} */ practice) => (ids ?? []).map((id, i) => { const n = practice.items.find((/** @type {any} */ a) => a.id === id)?.name ?? id; return i ? n.toLowerCase() : n; }));
  eleventyConfig.addFilter("names", (/** @type {any[]} */ people) => people.map((p) => p.name));
  eleventyConfig.addFilter("byArea", (/** @type {any[]} */ items, /** @type {string} */ area) => (items ?? []).filter((x) => x.practice === area));
  eleventyConfig.addFilter("newestFirst", (/** @type {any[]} */ items) => [...items].sort((a, b) => (a.date < b.date ? 1 : -1)));
  eleventyConfig.addFilter("ukDate", (/** @type {string} */ d) => new Date(`${d.length === 7 ? `${d}-01` : d}T12:00:00Z`).toLocaleDateString("en-GB", d.length === 7 ? { month: "long", year: "numeric", timeZone: "UTC" } : { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }));
  // £1,250 and, when the firm charges VAT, £1,500 with it (20%, the UK standard rate on legal services).
  eleventyConfig.addFilter("gbp", (/** @type {number} */ n) => `£${n.toLocaleString("en-GB", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`);
  eleventyConfig.addFilter("withVat", (/** @type {number} */ n) => Math.round(n * 120) / 100);
  // The succession map drawn at build time: nodes on a 720-wide board, one row per generation; arrows carry their step.
  eleventyConfig.addFilter("succession", (/** @type {any} */ sc) => {
    const nodes = layout(sc, 720, 132);
    const at = new Map(nodes.map((n) => [n.id, n]));
    const flows = sc.steps.flatMap((/** @type {any} */ st, /** @type {number} */ i) => st.flows.map((/** @type {[string, string]} */ [f, t]) => ({ step: i, a: at.get(f), b: at.get(t) })));
    return { nodes, flows, height: 132 * new Set(sc.nodes.map((/** @type {any} */ n) => n.gen)).size };
  });
  eleventyConfig.addFilter("serviceLabel", (/** @type {string} */ id) => SRA_SERVICES[id]?.label ?? id);
}
