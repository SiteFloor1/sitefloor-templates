// @ts-check
/** Nursery kit additions to the shared Eleventy setup: home sections, and the words for dates, times, months and fees. */
import { HOME_PARTS } from "./home.js";
import { dateWords, timeWords, monthsAhead, monthWords, pounds, upcoming, visitSlots, closedDays, weekCost, hoursWords, DAY_NAMES } from "./lib/nursery.js";
import { weekQuote, weekOptional } from "./features/nursery-week/week-words.js";

const PER = { hour: "an hour", session: "a session", day: "a day", week: "a week", month: "a month", "one-off": "once" };

/** @param {any} eleventyConfig */
export default function nurseryKit(eleventyConfig) {
  eleventyConfig.addGlobalData("homeParts", { order: Object.keys(HOME_PARTS), paths: HOME_PARTS });
  eleventyConfig.addFilter("nDate", (/** @type {string} */ d, /** @type {"short"|"long"|"month"} */ form) => dateWords(d, form));
  eleventyConfig.addFilter("nTime", timeWords);
  eleventyConfig.addFilter("nMonths", (/** @type {string} */ today, /** @type {number} */ n) => monthsAhead(today, n || 6));
  eleventyConfig.addFilter("nMonth", (/** @type {string} */ ym, /** @type {"short"|"long"|"name"} */ form) => monthWords(ym, form));
  eleventyConfig.addFilter("nPounds", pounds);
  eleventyConfig.addFilter("nPer", (/** @type {keyof typeof PER} */ per) => PER[per] ?? "");
  eleventyConfig.addFilter("nDay", (/** @type {keyof typeof DAY_NAMES} */ d) => DAY_NAMES[d] ?? d);
  eleventyConfig.addFilter("nUpcoming", (/** @type {any[]} */ items, /** @type {string} */ today) => upcoming(items, today));
  // The first visit times, as the page first shows them (the script works them out again on the day).
  eleventyConfig.addFilter("nSlots", (/** @type {any} */ site, /** @type {string} */ today) =>
    visitSlots(site.visit.times, today, 4, site.terms ? closedDays(site.terms.items) : []));
  // The week tool's example, as first built: nine months to two, three full days, 30 funded hours.
  eleventyConfig.addFilter("nWeekStart", (/** @type {any} */ site) => {
    const days = ["full", "full", "off", "full", "off"];
    const f = { ...site.fees, message: site.week.message };
    const cost = weekCost(f, days, 30);
    const names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    return {
      band: 1, funded: 30, cost,
      days: days.map((s, i) => ({ s, short: names[i].slice(0, 3), name: names[i], word: s === "off" ? "Off" : site.fees.sessions[s].label })),
      words: { booked: hoursWords(cost.booked), funded: hoursWords(cost.funded), paid: hoursWords(cost.paid) },
      optional: weekOptional(site.fees.extras ?? [], cost.daysOn),
      message: weekQuote(f, days, 30, cost.month),
    };
  });
  eleventyConfig.addFilter("nRoom", (/** @type {string} */ id, /** @type {any[]} */ rooms) => rooms.find((r) => r.id === id)?.name ?? "Every room");
}
