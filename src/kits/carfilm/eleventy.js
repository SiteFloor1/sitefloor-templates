// @ts-check
/** Carfilm kit additions to the shared Eleventy setup: the home sections, tonight's light, runtimes, prices and marks. */
import { HOME_PARTS, homeOrderProblem } from "./home.js";
import { evening, eveningLine, dayLight, runtime, sectionMark, shortDay, ukYmd, ratioOf } from "./lib/carfilm.js";
import { gbp } from "../../core/lib/text.js";
import { buildNow } from "../../core/lib/build-day.js";

/** @param {any} eleventyConfig */
export default function carFilmKit(eleventyConfig) {
  eleventyConfig.addGlobalData("homeParts", { order: Object.keys(HOME_PARTS), paths: HOME_PARTS });
  eleventyConfig.addFilter("checkHomeOrder", (/** @type {unknown} */ order) => { const p = homeOrderProblem(order ?? undefined); if (p) throw new Error(p); return order; });
  // Tonight's light on a road at build time, so the readout reads right before any script runs (the page works it out
  // again in the browser, on the visitor's own day).
  eleventyConfig.addFilter("tonightAt", (/** @type {any} */ road) => {
    const e = evening(buildNow(), road.lat, road.lon);
    return { when: e.when, day: shortDay(e.light.ymd), ...eveningLine(e.light) };
  });
  eleventyConfig.addFilter("roadById", (/** @type {any} */ roads, /** @type {string} */ id) => roads.items.find((/** @type {any} */ r) => r.id === id) ?? roads.items[0]);
  // The golden hour on the next 21 June and 20 September after the build day, for the locations page.
  eleventyConfig.addFilter("roadSeasons", (/** @type {any} */ road) => {
    const today = ukYmd(buildNow()), y = Number(today.slice(0, 4));
    const next = (/** @type {string} */ md) => `${today.slice(5) <= md ? y : y + 1}-${md}`;
    return [["Midsummer", next("06-21")], ["Late September", next("09-20")]].map(([label, ymd]) => ({ label, ymd, day: shortDay(ymd), ...eveningLine(dayLight(ymd, road.lat, road.lon)) }));
  });
  eleventyConfig.addFilter("runtime", runtime);
  eleventyConfig.addFilter("mark", (/** @type {number} */ n) => sectionMark(n));
  eleventyConfig.addFilter("gbp", (/** @type {number|null} */ n) => (n === null || n === undefined ? "Ask for a quote" : gbp(n)));
  eleventyConfig.addFilter("ratio", (/** @type {string} */ s) => ratioOf(s).toFixed(4));
  eleventyConfig.addFilter("formatById", (/** @type {any} */ f, /** @type {string} */ id) => f.items.find((/** @type {any} */ x) => x.id === id));
  eleventyConfig.addFilter("forWho", (/** @type {any[]} */ items, /** @type {string} */ who) => items.filter((p) => p.for === who || p.for === "both"));
  eleventyConfig.addFilter("byTopic", (/** @type {any[]} */ qs) => { /** @type {Map<string, any[]>} */ const m = new Map(); for (const q of qs) { const t = q.topic ?? "Questions"; if (!m.has(t)) m.set(t, []); m.get(t)?.push(q); } return [...m.entries()].map(([topic, items]) => ({ topic, items })); });
  eleventyConfig.addFilter("groupLabel", (/** @type {any} */ p, /** @type {string} */ id) => p.groups.find((/** @type {any} */ g) => g.id === id)?.label ?? "");
  eleventyConfig.addFilter("today", () => ukYmd(buildNow()));
  // A section's number for its timecode marker: its place in site.sections (1, 2, 3…), found by its title.
  eleventyConfig.addFilter("secNumber", (/** @type {any} */ sections, /** @type {string} */ title) => Math.max(1, Object.values(sections ?? {}).findIndex((/** @type {any} */ s) => s?.title === title) + 1));
}
