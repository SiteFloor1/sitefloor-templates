// @ts-check
/**
 * Run club: weekly runs (a day and a start time in the brand's timezone), the next date each one happens, and a
 * calendar file for that one run (times in UTC, so every calendar app reads them right; one run, not a repeating
 * series, because a repeating UTC time would drift an hour when the clocks change).
 */
import { DAY_KEYS, wallTimeToUtc, zonedNow, addDays, toMinutes } from "../../../core/lib/hours.js";

/** @typedef {{ id: string, day: string, time: string, minutes: number, title: string, text: string, meet: string, route?: string }} Run */

/**
 * The date of the next time this run starts (today if it hasn't started yet).
 * @param {Run} run @param {number} now @param {string} timeZone @returns {string} YYYY-MM-DD
 */
export function nextRunDate(run, now, timeZone) {
  const z = zonedNow(new Date(now), timeZone);
  const want = DAY_KEYS.indexOf(/** @type {any} */ (run.day));
  let ahead = (want - z.weekday + 7) % 7;
  if (ahead === 0 && z.minutes >= toMinutes(run.time)) ahead = 7;
  return addDays(z.date, ahead);
}

/** The club's runs in the order they next happen. @param {Run[]} runs @param {number} now @param {string} timeZone */
export function runsInOrder(runs, now, timeZone) {
  return runs.map((r) => ({ run: r, date: nextRunDate(r, now, timeZone) })).sort((a, b) => (a.date + a.run.time).localeCompare(b.date + b.run.time));
}

/**
 * @param {{ run: Run, date: string, place: string, business: string, timeZone: string, stamp: Date }} o
 */
export function runIcs(o) {
  const utc = (/** @type {number} */ ms) => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const esc = (/** @type {string} */ s) => s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
  const [year, month, day] = o.date.split("-").map(Number);
  const start = wallTimeToUtc({ year, month, day, hour: Number(o.run.time.slice(0, 2)), minute: Number(o.run.time.slice(3, 5)) }, o.timeZone);
  const end = start + o.run.minutes * 60_000;
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Sitefloor//Run club//EN", "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT", `UID:${o.run.id}-${o.date}@sitefloor`, `DTSTAMP:${utc(o.stamp.getTime())}`,
    `DTSTART:${utc(start)}`, `DTEND:${utc(end)}`,
    `SUMMARY:${esc(`${o.run.title}, ${o.business} run club`)}`, `LOCATION:${esc(o.run.meet || o.place)}`, `DESCRIPTION:${esc(o.run.text)}`,
    "END:VEVENT", "END:VCALENDAR", "",
  ].join("\r\n");
}

/** "Thursday, 7pm" / "Saturday, 8.30am". @param {Run} run */
export function runWhen(run) {
  const names = { sun: "Sunday", mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday", sat: "Saturday" };
  const m = toMinutes(run.time);
  const h = Math.floor(m / 60);
  const min = m % 60;
  const t = `${h % 12 || 12}${min ? `.${String(min).padStart(2, "0")}` : ""}${h < 12 ? "am" : "pm"}`;
  return `${names[/** @type {keyof typeof names} */ (run.day)]}, ${t}`;
}
