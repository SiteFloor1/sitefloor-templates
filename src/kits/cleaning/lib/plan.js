// @ts-check
/**
 * Dates and times worked out in the browser, nothing stored: the move-out planner (from a check-out date to the day of
 * the clean and the day to book by), the office window (a night's minutes before opening or after closing), and calendar
 * files for a regular clean or a move-out clean. All dates are YYYY-MM-DD; all times minutes after midnight.
 */
import { addDaysYmd, daysBetween } from "../../../core/lib/diary.js";
import { hm } from "./visit.js";

/**
 * The move-out clean: the company's lead days before check-out, and the latest day to book.
 * @param {string} checkout YYYY-MM-DD @param {string} today @param {{ cleanDaysBefore: number, bookDaysBefore: number }} t
 * @returns {{ clean: string, bookBy: string, daysLeft: number, late: boolean, past: boolean }}
 */
export function moveOut(checkout, today, t) {
  const clean = addDaysYmd(checkout, -t.cleanDaysBefore);
  const bookBy = addDaysYmd(clean, -t.bookDaysBefore);
  return { clean, bookBy, daysLeft: daysBetween(today, bookBy), late: today > bookBy, past: today > clean };
}

/** "06:30" @param {number} m */
export const clock = (m) => `${String(Math.floor(((m % 1440) + 1440) % 1440 / 60)).padStart(2, "0")}:${String(((m % 60) + 60) % 60).padStart(2, "0")}`;

/**
 * When the team cleans: before opening (finished `gap` minutes before) or after closing (starting `gap` minutes after).
 * @param {{ open: number, close: number }} hours @param {"before"|"after"} when @param {number} minutes @param {number} gap
 * @returns {{ start: number, end: number, words: string }}
 */
export function officeWindow(hours, when, minutes, gap) {
  if (when === "before") {
    const end = hours.open - gap, start = end - minutes;
    return { start, end, words: `You open at ${clock(hours.open)}. We're in from ${clock(start)} and gone by ${clock(end)}.` };
  }
  const start = hours.close + gap, end = start + minutes;
  return { start, end, words: `You close at ${clock(hours.close)}. We arrive at ${clock(start)} and lock up by ${clock(end)}.` };
}

/**
 * A night's minutes for a floor: the company's minutes per zone, each zone's count as the visitor gives it.
 * @param {{ id: string, name: string, min: number, per?: string }[]} zones @param {Record<string, number>} counts
 * @returns {{ id: string, name: string, min: number }[]}
 */
export function officeZones(zones, counts) {
  return zones.map((z) => ({ id: z.id, name: z.name, min: z.per ? Math.round(z.min * (counts[z.id] ?? 0)) : z.min }));
}

/** "20261124T000000Z"-style UTC stamp. @param {Date} d */
export const icsStamp = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
/** @param {string} s */
const esc = (s) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

/**
 * A calendar file for a regular clean (repeating weekly or fortnightly) or one clean (all day when `minutes` is 0).
 * Floating local times (no zone) so the calendar shows the hour the visitor chose.
 * @param {{ date: string, start: number, minutes: number, every: 0|1|2, title: string, place: string, business: string, stamp: string, note?: string }} o
 */
export function cleanIcs(o) {
  const t = (/** @type {number} */ m) => `${o.date.replace(/-/g, "")}T${clock(m).replace(":", "")}00`;
  const allDay = o.minutes === 0;
  const when = allDay ? [`DTSTART;VALUE=DATE:${o.date.replace(/-/g, "")}`, `DTEND;VALUE=DATE:${addDaysYmd(o.date, 1).replace(/-/g, "")}`] : [`DTSTART:${t(o.start)}`, `DTEND:${t(o.start + o.minutes)}`];
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", `PRODID:-//Sitefloor//${esc(o.business)} cleaning//EN`, "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:clean-${o.date}-${o.start}@${o.business.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    `DTSTAMP:${o.stamp}`, ...when,
    ...(o.every ? [`RRULE:FREQ=WEEKLY;INTERVAL=${o.every}`] : []),
    `SUMMARY:${esc(o.title)}`, `DESCRIPTION:${esc(o.note ?? `About ${hm(o.minutes)}`)}`, ...(o.place ? [`LOCATION:${esc(o.place)}`] : []),
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n") + "\r\n";
}
