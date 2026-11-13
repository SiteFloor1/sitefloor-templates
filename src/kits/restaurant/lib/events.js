// @ts-check
/** Events: upcoming ones only, in date order, and a calendar file with times in UTC (every calendar app reads them right). */
import { wallTimeToUtc } from "../../../core/lib/hours.js";

/** @typedef {{ id: string, title: string, date: string, start: string, end?: string, price?: number, text: string, photo?: string, book?: boolean }} RestaurantEvent */

/** @param {RestaurantEvent[]} events @param {string} today YYYY-MM-DD */
export function upcoming(events, today) {
  return events.filter((e) => e.date >= today).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
}

/**
 * @param {{ event: RestaurantEvent, place: string, business: string, timeZone: string, stamp: Date }} o
 */
export function eventIcs(o) {
  const utc = (/** @type {number} */ ms) => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const esc = (/** @type {string} */ s) => s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
  const [year, month, day] = o.event.date.split("-").map(Number);
  const at = (/** @type {string} */ hm) => wallTimeToUtc({ year, month, day, hour: Number(hm.slice(0, 2)), minute: Number(hm.slice(3, 5)) }, o.timeZone);
  const start = at(o.event.start);
  const end = o.event.end ? at(o.event.end) : start + 2 * 3_600_000;
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Sitefloor//Events//EN", "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT", `UID:${o.event.id}-${o.event.date}@sitefloor`, `DTSTAMP:${utc(o.stamp.getTime())}`,
    `DTSTART:${utc(start)}`, `DTEND:${utc(end > start ? end : end + 86_400_000)}`,
    `SUMMARY:${esc(`${o.event.title} at ${o.business}`)}`, `LOCATION:${esc(o.place)}`, `DESCRIPTION:${esc(o.event.text)}`,
    "END:VEVENT", "END:VCALENDAR", "",
  ].join("\r\n");
}
