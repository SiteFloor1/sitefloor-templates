// @ts-check
/** Build kit additions to the shared Eleventy setup: the home sections, projects by kind, the map, stage lengths. */
import { HOME_PARTS, onPagesProblem, homeOrderProblem } from "./home.js";
import { HOUSES, ROOFS, extensionSize, readout, startState, depthRange } from "./lib/extension.js";
import { mapView } from "./lib/map.js";
import { totalWeeks, weeksWords } from "./lib/brief.js";
import { SOURCES, CHECKED, TOPICS, GUIDE_RULES, NOT_A_DECISION, rearZone, LOFT_CHECKED, LOFT_RULES, loftZone } from "./lib/planning.js";
import { HOUSE_AGES, SURVEY_SOURCES, SURVEY_CHECKED, NOT_A_SURVEY, checklist } from "./lib/survey.js";
import { LOFTS, ROOF_MODEL, loftsFor, loftStart, loftVolume, dormerRange, meterAt, METER_SCALE } from "./lib/loft.js";
import { markAt } from "./features/planning-guide/planning-guide.js";
import { FACINGS } from "./lib/sun.js";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** @param {any} eleventyConfig */
export default function buildKit(eleventyConfig) {
  eleventyConfig.addGlobalData("homeParts", { order: Object.keys(HOME_PARTS), paths: HOME_PARTS });
  eleventyConfig.addFilter("checkHomeOrder", (/** @type {unknown} */ order) => { const p = homeOrderProblem(order ?? undefined); if (p) throw new Error(p); return order; });
  eleventyConfig.addFilter("hostedBy", (/** @type {Record<string, string[]>|null} */ onPages) => {
    const problem = onPagesProblem(onPages ?? undefined);
    if (problem) throw new Error(problem);
    return Object.fromEntries(Object.entries(onPages ?? {}).flatMap(([page, parts]) => parts.map((part) => [part, page])));
  });
  eleventyConfig.addFilter("hosted", (/** @type {Record<string, string[]>|null} */ onPages, /** @type {string} */ page) => (onPages ?? {})[page] ?? []);
  // The visualiser's controls and read-out as the page first shows them (its script takes over from there).
  eleventyConfig.addGlobalData("extensionOptions", { houses: HOUSES, roofs: ROOFS });
  eleventyConfig.addFilter("extensionStart", (/** @type {any} */ v) => {
    const s = startState(v);
    return { ...s, range: depthRange(v?.depth), depthText: `${s.depth.toFixed(1)} m`, words: readout(extensionSize(s.house, s.depth)) };
  });
  // Planning facts for England, each with its GOV.UK source and the date checked (lib/planning.js is the only copy).
  eleventyConfig.addGlobalData("planningFacts", { sources: SOURCES, checked: CHECKED, topics: TOPICS, guideRules: GUIDE_RULES, notADecision: NOT_A_DECISION, facings: Object.keys(FACINGS) });
  // The loft guide as the page first shows it: the house's usual conversion, its volume and where it sits.
  eleventyConfig.addGlobalData("loftFacts", { lofts: LOFTS, model: ROOF_MODEL, rules: LOFT_RULES, checked: LOFT_CHECKED, scale: METER_SCALE });
  eleventyConfig.addFilter("loftNow", (/** @type {string} */ house, /** @type {number} */ before = 0) => {
    const s = loftStart(house), v = loftVolume(house, s.loft, s.width), z = loftZone(house, v.total + before);
    return { ...s, can: loftsFor(house), range: dormerRange(house, s.loft), volume: v, zone: z, mark: meterAt(v.total + before, z.allowance), line: meterAt(z.allowance, z.allowance) };
  });
  // The survey checklist by the house's age: general guidance, each fact with its source (lib/survey.js).
  eleventyConfig.addGlobalData("surveyFacts", { ages: HOUSE_AGES, sources: SURVEY_SOURCES, checked: SURVEY_CHECKED, notASurvey: NOT_A_SURVEY });
  eleventyConfig.addFilter("surveyChecklist", (/** @type {string} */ age) => checklist(age));
  eleventyConfig.addFilter("rearZoneOf", (/** @type {any} */ s) => { const z = rearZone(s.house, s.depth); return { ...z, mark: markAt(s.depth, z.limits) }; });
  eleventyConfig.addFilter("buildTypeOf", (/** @type {any} */ site, /** @type {string} */ id) => (site.buildTypes?.items ?? []).find((/** @type {any} */ t) => t.id === id));
  eleventyConfig.addFilter("projectsOfType", (/** @type {any} */ site, /** @type {string} */ id) => (site.projects?.items ?? []).filter((/** @type {any} */ p) => p.type === id));
  eleventyConfig.addFilter("projectsMapView", (/** @type {any[]} */ items) => mapView(items.filter((p) => p.district).map((p) => p.district)));
  // Districts in the order of the list, each with its projects (two projects in one district share a marker).
  eleventyConfig.addFilter("byDistrict", (/** @type {any[]} */ items) => {
    /** @type {Map<string, any>} */ const m = new Map();
    for (const p of items.filter((x) => x.district)) { if (!m.has(p.district.code)) m.set(p.district.code, { ...p.district, projects: [] }); m.get(p.district.code).projects.push(p); }
    return [...m.values()];
  });
  eleventyConfig.addFilter("thousands", (/** @type {number} */ n) => n.toLocaleString("en-GB"));
  eleventyConfig.addFilter("weeksWords", (/** @type {[number, number]} */ w) => weeksWords(w));
  eleventyConfig.addFilter("totalWeeks", (/** @type {any[]} */ stages) => totalWeeks(stages));
  eleventyConfig.addFilter("ukDate", (/** @type {string} */ d) => { const x = new Date(`${d}T12:00:00Z`); return `${x.getUTCDate()} ${MONTHS[x.getUTCMonth()]} ${x.getUTCFullYear()}`; });
  eleventyConfig.addFilter("monthWords", (/** @type {string} */ ym) => { const [y, m] = ym.split("-").map(Number); return `${MONTHS[m - 1]} ${y}`; });
  eleventyConfig.addFilter("newestFirst", (/** @type {any[]} */ items) => [...items].sort((a, b) => (a.date < b.date ? 1 : -1)));
}
