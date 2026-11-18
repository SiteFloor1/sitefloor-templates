// @ts-check
/** Gym kit additions to the shared Eleventy setup: the home sections, lawful prices, the count and the week. */
import { HOME_PARTS, HOSTS } from "./home.js";
import { priceWords, membershipTotal, usualAt, hourWords, quietWords, weekOf, pounds, busyDay, samplePlan, ukNumeric, shortDate, numberWords } from "./lib/gym.js";
import { classWeeks, coachClasses, packWords, upcomingEvents, eventHours, eventIcs, sessionLabel, finderCount } from "./lib/club.js";
import { DAY_NAMES } from "../../core/lib/hours.js";
import { ukDate } from "../../core/lib/diary.js";

/** @param {any} eleventyConfig */
export default function gymKit(eleventyConfig) {
  eleventyConfig.addGlobalData("homeParts", { order: Object.keys(HOME_PARTS), paths: HOME_PARTS, hosts: HOSTS });
  eleventyConfig.addFilter("hostedHere", (/** @type {string} */ page) => Object.keys(HOME_PARTS).filter((id) => /** @type {Record<string, string>} */ (HOSTS)[id] === page));
  // Every price on the site comes through here: the total with its mandatory fees, never typed by hand.
  eleventyConfig.addFilter("priceWords", (/** @type {any} */ p) => priceWords(p));
  eleventyConfig.addFilter("lawfulTotal", (/** @type {any} */ p) => membershipTotal(p));
  eleventyConfig.addFilter("pounds", (/** @type {number} */ n) => pounds(n));
  eleventyConfig.addFilter("tierOf", (/** @type {any} */ site, /** @type {string} */ id) => site.clubMemberships.tiers.find((/** @type {any} */ t) => t.id === id));
  eleventyConfig.addFilter("classOf", (/** @type {any} */ site, /** @type {string} */ id) => site.classTypes.items.find((/** @type {any} */ c) => c.id === id));
  eleventyConfig.addFilter("rateOf", (/** @type {any} */ site, /** @type {string} */ id) => site.corporate.rates.find((/** @type {any} */ r) => r.id === id));
  // The count as at the build (the page's script redraws it for the visitor's own hour): the hour the build ran, or the
  // evening if the club was closed then. It always names its day and hour, so it stays true without the script.
  eleventyConfig.addFilter("buildCount", (/** @type {any} */ busy, /** @type {string} */ today) => {
    const wd = new Date(`${today}T12:00:00Z`).getUTCDay();
    let h = 18;
    while (h < 24 && usualAt(busy, wd, h) === null) h++;
    if (h === 24) h = (busy.usual[["sun", "mon", "tue", "wed", "thu", "fri", "sat"][wd]] ?? []).findIndex((/** @type {any} */ v) => v !== null);
    return { n: usualAt(busy, wd, h) ?? 0, line: `usually in the club on a ${DAY_NAMES[wd]} at ${hourWords(h)}.`, say: quietWords(busy, wd, h) };
  });
  eleventyConfig.addFilter("weekOf", (/** @type {any} */ weekly, /** @type {any} */ hours, /** @type {string} */ today, /** @type {number} */ n) => weekOf(weekly, hours, today, n));
  eleventyConfig.addFilter("dayName", (/** @type {number} */ wd) => DAY_NAMES[wd]);
  eleventyConfig.addFilter("ukDay", (/** @type {string} */ ymd) => ukDate(ymd, true).replace(/ \d{4}$/, ""));
  // Recovery slots on one weekday, in time order: [{ id, name, time, … }]
  eleventyConfig.addFilter("slotsOn", (/** @type {any[]} */ slots, /** @type {string} */ day) => slots.flatMap((s) => s.days.includes(day) ? s.times.map((/** @type {string} */ time) => ({ ...s, time })) : []).sort((a, b) => (a.time < b.time ? -1 : 1)));
  eleventyConfig.addFilter("dayKeys", () => ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]);
  eleventyConfig.addFilter("dayIndexOf", (/** @type {string} */ iso) => new Date(iso).getUTCDay());
  // The first n items at or after a time (or the first n of the day when none are left).
  eleventyConfig.addFilter("selectFrom", (/** @type {any[]} */ list, /** @type {string} */ time, /** @type {number} */ n) => { const later = list.filter((x) => x.time >= time); return (later.length ? later : list).slice(0, n); });
  // How busy a day usually is, hour by hour, for the open hours: [{ h, v, pct, label }], and its busiest and quietest stretches.
  eleventyConfig.addFilter("busyDay", (/** @type {any} */ busy, /** @type {string} */ day) => busyDay(busy, day));
  // The race plan for the sample race the planner opens on (the build's day; the script redraws it for the visitor's).
  eleventyConfig.addFilter("samplePlan", (/** @type {any} */ hyrox, /** @type {string} */ today) => samplePlan(hyrox, today));
  eleventyConfig.addFilter("ukNumeric", (/** @type {string} */ d) => ukNumeric(d));
  eleventyConfig.addFilter("shortDate", (/** @type {string} */ d) => shortDate(d));
  eleventyConfig.addFilter("numberWords", (/** @type {number} */ n) => numberWords(n));
  eleventyConfig.addFilter("hourWords", (/** @type {number} */ h) => hourWords(h));
  // The club's own pages (lib/club.js): the class finder, the coaches' weeks, personal training prices, events.
  eleventyConfig.addFilter("classWeeks", (/** @type {any} */ site) => classWeeks(site.classTypes.items, site.timetable.weekly));
  eleventyConfig.addFilter("coachClasses", (/** @type {any} */ site, /** @type {string} */ name) => coachClasses(site.timetable.weekly, name));
  eleventyConfig.addFilter("sessionLabel", (/** @type {any} */ s) => sessionLabel(s.day, s.time));
  eleventyConfig.addFilter("finderCount", (/** @type {number} */ n) => finderCount(n));
  eleventyConfig.addFilter("packWords", (/** @type {any} */ p) => packWords(p));
  eleventyConfig.addFilter("upcomingEvents", (/** @type {any[]} */ items, /** @type {string} */ today) => upcomingEvents(items, today));
  eleventyConfig.addFilter("eventHours", (/** @type {any} */ e) => eventHours(e));
  eleventyConfig.addFilter("eventIcs", (/** @type {any} */ e, /** @type {any} */ site, /** @type {string} */ stamp) => eventIcs({
    event: e, club: site.business.name, tz: site.hours.timezone, stamp,
    place: [site.business.name, site.location.streetAddress, site.location.locality, site.location.postcode].filter(Boolean).join(", "),
  }));
}
