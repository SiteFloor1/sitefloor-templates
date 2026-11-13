// @ts-check
/** Weddingfilm kit additions to the shared Eleventy setup: the home sections, the day's light, prices and dates. */
import { HOME_PARTS, onPagesProblem, homeOrderProblem } from "./home.js";
import { dayLight, portraitWindow, along } from "./lib/sun.js";
import { gbp } from "./lib/packages.js";
import { STAGES } from "./lib/couples.js";
import { dayPlan } from "./lib/day.js";
import { ukDate } from "../../core/lib/diary.js";

/** @param {any} eleventyConfig */
export default function weddingFilmKit(eleventyConfig) {
  eleventyConfig.addGlobalData("homeParts", { order: Object.keys(HOME_PARTS), paths: HOME_PARTS });
  eleventyConfig.addFilter("checkHomeOrder", (/** @type {unknown} */ order) => { const p = homeOrderProblem(order ?? undefined); if (p) throw new Error(p); return order; });
  eleventyConfig.addFilter("hostedBy", (/** @type {Record<string, string[]>|null} */ onPages) => {
    const problem = onPagesProblem(onPages ?? undefined);
    if (problem) throw new Error(problem);
    return Object.fromEntries(Object.entries(onPages ?? {}).flatMap(([page, parts]) => parts.map((part) => [part, page])));
  });
  eleventyConfig.addFilter("hosted", (/** @type {Record<string, string[]>|null} */ onPages, /** @type {string} */ page) => (onPages ?? {})[page] ?? []);
  // The light on the planner's first date at its first place, so the page reads right before any script runs.
  eleventyConfig.addFilter("lightAt", (/** @type {any} */ site, /** @type {string} */ ymd, /** @type {string} */ placeId) => {
    const p = site.places.items.find((/** @type {any} */ x) => x.id === placeId) ?? site.places.items[0];
    const l = dayLight(ymd, p.lat, p.lon, p.tz ?? "Europe/London");
    const w = site.lightPlanner?.portrait ? portraitWindow(l, site.lightPlanner.portrait.start, site.lightPlanner.portrait.length) : null;
    return { ...l, place: p, portrait: w };
  });
  eleventyConfig.addFilter("along", (/** @type {string|null} */ hhmm) => (hhmm ? along(hhmm).toFixed(2) : "0"));
  eleventyConfig.addFilter("between", (/** @type {string|null} */ a, /** @type {string|null} */ b) => (a && b ? (along(b) - along(a)).toFixed(2) : "0"));
  eleventyConfig.addFilter("gbp", (/** @type {number|null} */ n) => (n === null || n === undefined ? "Price on request" : gbp(n)));
  eleventyConfig.addFilter("ukDay", (/** @type {string} */ d) => ukDate(d, true));
  eleventyConfig.addFilter("roman", (/** @type {number} */ n) => ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"][n - 1] ?? String(n));
  eleventyConfig.addFilter("venueOf", (/** @type {any} */ site, /** @type {string} */ id) => site.venues.items.find((/** @type {any} */ v) => v.id === id));
  // The light at a venue on a day, calculated (lib/sun.js).
  eleventyConfig.addFilter("venueLight", (/** @type {any} */ v, /** @type {string} */ ymd) => dayLight(ymd, v.lat, v.lon, v.tz ?? "Europe/London"));
  // Golden hour at a venue on the next 21 June and 20 September after the build date.
  eleventyConfig.addFilter("venueSeasons", (/** @type {any} */ v, /** @type {string} */ today) => {
    const next = (/** @type {string} */ md) => { const y = Number(today.slice(0, 4)); return `${today.slice(5) <= md ? y : y + 1}-${md}`; };
    return [["Midsummer", next("06-21")], ["Late September", next("09-20")]].map(([label, ymd]) => ({ label, ymd, light: dayLight(ymd, v.lat, v.lon, v.tz ?? "Europe/London") }));
  });
  eleventyConfig.addFilter("filmsAt", (/** @type {any} */ site, /** @type {string} */ venue) => site.films.items.filter((/** @type {any} */ f) => f.venue === venue));
  eleventyConfig.addFilter("nextFilm", (/** @type {any[]} */ items, /** @type {string} */ id) => { const i = items.findIndex((f) => f.id === id); return items[(i + 1) % items.length]; });
  eleventyConfig.addFilter("byTopic", (/** @type {any[]} */ qs) => { /** @type {Map<string, any[]>} */ const m = new Map(); for (const q of qs) { const t = q.topic ?? "Questions"; if (!m.has(t)) m.set(t, []); m.get(t)?.push(q); } return [...m.entries()].map(([topic, items]) => ({ topic, items })); });
  eleventyConfig.addGlobalData("progressStages", STAGES);
  // The day planner's opening plan: the planner's date and place, the studio's ceremony time.
  eleventyConfig.addFilter("dayPlanAt", (/** @type {any} */ site) => {
    const lp = site.lightPlanner, p = site.places.items.find((/** @type {any} */ x) => x.id === lp.place) ?? site.places.items[0];
    const l = dayLight(lp.date, p.lat, p.lon, p.tz ?? "Europe/London");
    return { date: lp.date, place: p, plan: dayPlan(site.dayPlanner.ceremony, l, site.dayPlanner.blocks, lp.portrait ?? { start: 5, length: 40 }) };
  });
  eleventyConfig.addFilter("weeksWord", (/** @type {number} */ n) => (n === 1 ? "1 week" : `${n} weeks`));
}
