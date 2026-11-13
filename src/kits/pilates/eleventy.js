// @ts-check
/** Pilates kit additions to the shared Eleventy setup: the home sections, the week from the build date, class words. */
import { HOME_PARTS, onPagesProblem } from "./home.js";
import { weekFrom, saidTime, dayName, shortDay, upcoming, reformerMarks, waitlistText } from "./lib/classes.js";
import { MONTHS } from "./lib/classes.js";

/** @param {any} eleventyConfig */
export default function pilatesKit(eleventyConfig) {
  eleventyConfig.addGlobalData("homeParts", { order: Object.keys(HOME_PARTS), paths: HOME_PARTS });
  eleventyConfig.addFilter("hostedBy", (/** @type {Record<string, string[]>|null} */ onPages) => {
    const problem = onPagesProblem(onPages ?? undefined);
    if (problem) throw new Error(problem);
    return Object.fromEntries(Object.entries(onPages ?? {}).flatMap(([page, parts]) => parts.map((part) => [part, page])));
  });
  eleventyConfig.addFilter("hosted", (/** @type {Record<string, string[]>|null} */ onPages, /** @type {string} */ page) => (onPages ?? {})[page] ?? []);
  // The week as at the build; the timetable's script redraws it from the visitor's own today.
  eleventyConfig.addFilter("weekFrom", (/** @type {any} */ site, /** @type {string} */ today) => weekFrom(site.timetable, site.hours, today));
  eleventyConfig.addFilter("todayClasses", (/** @type {any} */ site, /** @type {string} */ today) => weekFrom(site.timetable, site.hours, today, 1)[0].classes);
  eleventyConfig.addFilter("nextOf", (/** @type {any} */ site, /** @type {string} */ today, /** @type {string} */ type, /** @type {number} */ n) => upcoming(site.timetable, site.hours, { date: today, minutes: 0 }, n, type));
  eleventyConfig.addFilter("classOf", (/** @type {any} */ site, /** @type {string} */ id) => site.classTypes.items.find((/** @type {any} */ c) => c.id === id));
  eleventyConfig.addFilter("bookText", (/** @type {any} */ site, /** @type {string} */ name, /** @type {string} */ date, /** @type {string} */ time) => waitlistText(site.messages.book, { class: name, day: dayName(date), time: saidTime(time) }));
  eleventyConfig.addFilter("said", (/** @type {string} */ t) => saidTime(t));
  eleventyConfig.addFilter("dayName", (/** @type {string} */ d) => dayName(d));
  eleventyConfig.addFilter("shortDay", (/** @type {string} */ d) => shortDay(d));
  eleventyConfig.addFilter("marks", (/** @type {number} */ reformers) => reformerMarks(reformers, reformers) ?? []);
  eleventyConfig.addFilter("gbpWhole", (/** @type {number} */ n) => `£${n.toLocaleString("en-GB")}`);
  eleventyConfig.addFilter("retreatDates", (/** @type {any} */ r) => {
    const a = new Date(`${r.from}T12:00:00Z`), b = new Date(`${r.to}T12:00:00Z`);
    const d = (/** @type {Date} */ x) => `${x.getUTCDate()} ${MONTHS[x.getUTCMonth()]}`;
    return a.getUTCMonth() === b.getUTCMonth() && a.getUTCFullYear() === b.getUTCFullYear()
      ? `${a.getUTCDate()}–${b.getUTCDate()} ${MONTHS[b.getUTCMonth()]} ${b.getUTCFullYear()}` : `${d(a)} – ${d(b)} ${b.getUTCFullYear()}`;
  });
  // A teacher's week: their classes by weekday, from the timetable.
  eleventyConfig.addFilter("teacherWeek", (/** @type {any} */ site, /** @type {string} */ name) => {
    const days = [["mon", "Mondays"], ["tue", "Tuesdays"], ["wed", "Wednesdays"], ["thu", "Thursdays"], ["fri", "Fridays"], ["sat", "Saturdays"], ["sun", "Sundays"]];
    return days.map(([k, label]) => ({ label, classes: (site.timetable.weekly[k] ?? []).filter((/** @type {any} */ c) => c.teacher === name).sort((/** @type {any} */ a, /** @type {any} */ b) => (a.time < b.time ? -1 : 1)) })).filter((d) => d.classes.length);
  });
  // Who teaches a class, from the timetable.
  eleventyConfig.addFilter("teachersOf", (/** @type {any} */ site, /** @type {string} */ cls) => [...new Set(Object.values(site.timetable.weekly).flat().filter((/** @type {any} */ c) => c.class === cls && c.teacher).map((/** @type {any} */ c) => c.teacher))]);
  eleventyConfig.addFilter("staffOf", (/** @type {any} */ site, /** @type {string} */ name) => (site.staff ?? []).find((/** @type {any} */ s) => s.name === name));
  eleventyConfig.addFilter("teacherPageOf", (/** @type {any} */ site, /** @type {string} */ name) => (site.teacherPages?.items ?? []).find((/** @type {any} */ t) => t.name === name));
  eleventyConfig.addFilter("exercisesIn", (/** @type {any} */ site, /** @type {string} */ cls) => (site.method?.items ?? []).filter((/** @type {any} */ x) => x.classes.includes(cls)));
  eleventyConfig.addFilter("upcomingWorkshops", (/** @type {any[]} */ items, /** @type {string} */ today) => items.filter((w) => w.date >= today).sort((a, b) => (a.date + a.from < b.date + b.from ? -1 : 1)));
  eleventyConfig.addFilter("ukDay", (/** @type {string} */ d) => dayName(d));
  eleventyConfig.addFilter("ukDate", (/** @type {string} */ d) => { const x = new Date(`${d}T12:00:00Z`); return `${x.getUTCDate()} ${MONTHS[x.getUTCMonth()]} ${x.getUTCFullYear()}`; });
  eleventyConfig.addFilter("upcomingRetreats", (/** @type {any[]} */ items, /** @type {string} */ today) => items.filter((r) => r.to >= today).sort((a, b) => (a.from < b.from ? -1 : 1)));
}
