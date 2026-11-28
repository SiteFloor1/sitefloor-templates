// @ts-check
/** Pop-up kit additions to the shared Eleventy setup: home sections, and the run as the page first paints it on the build day. */
import { HOME_PARTS, homeOrderProblem } from "./home.js";
import { resolveStops, currentStop, stopState, stateWords, runLine, runDays, entryTimes, nextOpening, tourOrder, longDate, shortDate, shortDay, fullDate, dayOfMonth, daysBetween, pounds, mapsHref, visitMinutes, project, formatTime12 } from "./lib/popup.js";
import { GB_PATH, GB_VIEWBOX } from "./lib/gb-outline.js";
import { buildNow } from "../../core/lib/build-day.js";
import { zonedNow } from "../../core/lib/hours.js";

/** @param {any} eleventyConfig */
export default function popupKit(eleventyConfig) {
  eleventyConfig.addGlobalData("homeParts", { order: Object.keys(HOME_PARTS), paths: HOME_PARTS });
  eleventyConfig.addGlobalData("gbMap", { path: GB_PATH, viewBox: GB_VIEWBOX });
  eleventyConfig.addFilter("checkHomeOrder", (/** @type {unknown} */ order) => { const p = homeOrderProblem(order ?? undefined); if (p) throw new Error(p); return order; });
  /** @param {string} tz */
  const now = (tz) => zonedNow(new Date(buildNow()), tz ?? "Europe/London");
  // The stops as dates on the build day; the browser works them out again for the visitor's day.
  eleventyConfig.addFilter("popStops", (/** @type {any} */ site) => resolveStops(site.popup, now(site.hours.timezone).date));
  eleventyConfig.addFilter("popCurrent", (/** @type {any} */ site) => currentStop(resolveStops(site.popup, now(site.hours.timezone).date), now(site.hours.timezone).date));
  eleventyConfig.addFilter("popNext", (/** @type {any} */ site) => nextOpening(resolveStops(site.popup, now(site.hours.timezone).date), now(site.hours.timezone).date));
  eleventyConfig.addFilter("popTour", (/** @type {any} */ site) => tourOrder(resolveStops(site.popup, now(site.hours.timezone).date), now(site.hours.timezone).date));
  eleventyConfig.addFilter("popEnded", (/** @type {any} */ site) => tourOrder(resolveStops(site.popup, now(site.hours.timezone).date), now(site.hours.timezone).date).filter((s) => stopState(s, now(site.hours.timezone).date).kind === "ended"));
  eleventyConfig.addFilter("popState", (/** @type {any} */ s, /** @type {any} */ site) => stopState(s, now(site.hours.timezone).date));
  eleventyConfig.addFilter("popStateWords", (/** @type {any} */ s, /** @type {any} */ site) => stateWords(stopState(s, now(site.hours.timezone).date), s));
  eleventyConfig.addFilter("popLine", (/** @type {any} */ s, /** @type {any} */ site) => runLine(site.hours, s, now(site.hours.timezone)));
  eleventyConfig.addFilter("popDaysLeft", (/** @type {any} */ s, /** @type {any} */ site) => Math.max(0, daysBetween(now(site.hours.timezone).date, s.end)));
  eleventyConfig.addFilter("popRunDays", (/** @type {any} */ s, /** @type {any} */ site) => runDays(site.hours, s, now(site.hours.timezone).date));
  eleventyConfig.addFilter("popTimes", (/** @type {string} */ ymd, /** @type {any} */ s, /** @type {any} */ site) => entryTimes(site.hours, s, ymd, null, site.slots?.every ?? 30, site.slots?.lastBefore ?? 60));
  eleventyConfig.addFilter("popUpcoming", (/** @type {any[]} */ items, /** @type {any} */ site) => {
    const today = now(site.hours.timezone).date;
    return items.map((e) => ({ ...e, date: typeof e.date === "number" ? resolveStops({ stops: [{ start: e.date, end: e.date }] }, today)[0].start : e.date }))
      .filter((e) => e.date >= today).sort((a, b) => (a.date + a.from).localeCompare(b.date + b.from));
  });
  eleventyConfig.addFilter("popProject", (/** @type {any} */ s) => project(s.lon, s.lat));
  eleventyConfig.addFilter("longDate", longDate);
  eleventyConfig.addFilter("popMonth", (/** @type {string} */ ymd) => longDate(ymd).split(" ")[1]);
  eleventyConfig.addFilter("shortDate", shortDate);
  eleventyConfig.addFilter("popShortDay", shortDay);
  eleventyConfig.addFilter("fullDate", fullDate);
  eleventyConfig.addFilter("dayOfMonth", dayOfMonth);
  eleventyConfig.addFilter("gbp", pounds);
  eleventyConfig.addFilter("popMaps", mapsHref);
  eleventyConfig.addFilter("visitMinutes", visitMinutes);
  eleventyConfig.addFilter("hhmm", (/** @type {number} */ m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
  eleventyConfig.addFilter("time12", (/** @type {string|number} */ t) => formatTime12(typeof t === "number" ? t : Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5))));
}
