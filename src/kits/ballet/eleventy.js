// @ts-check
/** Ballet kit additions to the shared Eleventy setup: home sections, the words for ages, days, times and dates. */
import { HOME_PARTS } from "./home.js";
import {
  ageGroups, ageLabel, ageText, sessionWords, sessionsWords, weekOrder, lengthWords, timeWords, dateWords, yearItems,
  nextItem, trialText, placeKey, pathFrom, DAYS, DAY_NAMES,
} from "./lib/ballet.js";

/** @param {any} eleventyConfig */
export default function balletKit(eleventyConfig) {
  eleventyConfig.addGlobalData("homeParts", { order: Object.keys(HOME_PARTS), paths: HOME_PARTS });
  eleventyConfig.addFilter("ageGroups", ageGroups);
  // The group shown first: the one with four-year-olds in it, or the youngest.
  eleventyConfig.addFilter("firstGroup", (/** @type {any[]} */ groups) => Math.max(0, groups.findIndex((g) => g.ages[0] <= 4 && g.ages[1] >= 4)));
  eleventyConfig.addFilter("ageLabel", ageLabel);
  eleventyConfig.addFilter("ageText", ageText);
  eleventyConfig.addFilter("sessionWords", sessionWords);
  eleventyConfig.addFilter("sessionsWords", sessionsWords);
  eleventyConfig.addFilter("weekOrder", weekOrder);
  eleventyConfig.addFilter("lengthWords", lengthWords);
  eleventyConfig.addFilter("timeWords", timeWords);
  eleventyConfig.addFilter("dateWords", (/** @type {string} */ d, /** @type {"long"|"short"|"year"} */ form) => dateWords(d, form));
  eleventyConfig.addFilter("placeKey", placeKey);
  // The ring and the next date, as the page first shows them (the script keeps them current on the day).
  eleventyConfig.addFilter("yearRing", (/** @type {any} */ site, /** @type {string} */ today) => {
    const on = (/** @type {string} */ id) => site.features.includes(id);
    return yearItems(site.year.items, on("ballet-shows") ? site.shows.items : [], on("ballet-exams") ? site.exams.items : [], today);
  });
  eleventyConfig.addFilter("nextItem", nextItem);
  eleventyConfig.addFilter("pathFrom", pathFrom);
  // Every age the classes take, youngest to oldest: the path's buttons.
  eleventyConfig.addFilter("pathAges", (/** @type {any[]} */ classes) => {
    const lo = Math.min(...classes.map((c) => c.ages[0])), hi = Math.max(...classes.map((c) => c.ages[1]));
    return Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
  });
  // The first group's trial message, before the parent taps anything.
  eleventyConfig.addFilter("trialText", (/** @type {string} */ opening, /** @type {any} */ cls) =>
    trialText(opening, cls ? { ages: cls.ages, name: cls.name, when: sessionsWords(cls.sessions) } : {}));
  // The week, day by day: [{ day, name, rows: [{ cls, session }] }], days with no class left out.
  eleventyConfig.addFilter("weekRows", (/** @type {any[]} */ classes) => DAYS.map((day) => ({
    day, name: DAY_NAMES[day],
    rows: classes.flatMap((cls) => cls.sessions.filter((/** @type {any} */ s) => s.day === day).map((/** @type {any} */ session) => ({ cls, session })))
      .sort((a, b) => a.session.time.localeCompare(b.session.time)),
  })).filter((d) => d.rows.length));
  // A uniform set's classes, by name. @param {string[]} ids
  eleventyConfig.addFilter("classNames", (/** @type {string[]} */ ids, /** @type {any[]} */ classes) =>
    ids.map((id) => classes.find((c) => c.id === id)?.name).filter(Boolean).join(", "));
  // A month "2026-09" in words: "September 2026".
  eleventyConfig.addFilter("monthWords", (/** @type {string} */ ym) => {
    const [y, m] = ym.split("-").map(Number);
    return `${["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][m - 1]} ${y}`;
  });
}
