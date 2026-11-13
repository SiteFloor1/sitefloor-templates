// @ts-check
/**
 * The smile studio's logic with no DOM: the message the chooser writes, a treatment's visits and how long they take,
 * the arrival route re-timed to an appointment, and aftercare reminders as a calendar file. Every timing and price is
 * the studio's own from site.json; nothing here invents one. Dates are calendar days handled in UTC.
 */
import { addDaysYmd, ukDate } from "../../../core/lib/diary.js";

/** @typedef {{ label: string, minutes: number, after?: number, note?: string }} Visit  after: weeks after the previous visit */

/**
 * The chooser's message: the option's words, with the date filled in when the visitor gave one.
 * @param {string} template e.g. "Hi Marlie, I'm getting married on {date}…" @param {string} [date] YYYY-MM-DD
 */
export function chooserText(template, date) {
  if (!template.includes("{date}")) return template;
  return template.replace(/\{date\}/g, date ? ukDate(date, false) : "soon");
}

/** How a treatment's visits add up: how many, and over how many weeks. @param {Visit[]} visits */
export function visitSpan(visits) {
  const weeks = visits.reduce((n, v, i) => n + (i ? v.after ?? 0 : 0), 0);
  return { count: visits.length, weeks };
}

const NUMBERS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
/** @param {number} n */
export const inWords = (n) => NUMBERS[n] ?? String(n);

/** "Three visits over four weeks", "One visit". @param {Visit[]} visits */
export function spanWords(visits) {
  const { count, weeks } = visitSpan(visits);
  const v = `${inWords(count)} ${count === 1 ? "visit" : "visits"}`;
  const w = weeks ? ` over ${inWords(weeks)} ${weeks === 1 ? "week" : "weeks"}` : "";
  return (v + w).replace(/^./, (c) => c.toUpperCase());
}

/** Minutes as the studio says them: "45 min", "2 hours", "1 hour 30 min". @param {number} m */
export function duration(m) {
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60), r = m % 60;
  return `${h} ${h === 1 ? "hour" : "hours"}${r ? ` ${r} min` : ""}`;
}

/** Each visit's date from the first one's. @param {Visit[]} visits @param {string} first YYYY-MM-DD */
export function visitDates(visits, first) {
  let d = first;
  return visits.map((v, i) => { if (i) d = addDaysYmd(d, 7 * (v.after ?? 0)); return { ...v, date: d }; });
}

/** "08:15" → minutes after midnight, or NaN. @param {string} t */
export function minutesOf(t) {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(t ?? "");
  return m ? Number(m[1]) * 60 + Number(m[2]) : NaN;
}

/** Minutes after midnight as the studio writes a time: "8.15", "18.45". @param {number} m */
export function clock(m) {
  const d = ((m % 1440) + 1440) % 1440;
  return `${Math.floor(d / 60)}.${String(d % 60).padStart(2, "0")}`;
}

/** The arrival route re-timed to an appointment. @param {string} at "HH:MM" @param {{ at: number }[]} steps minutes from the appointment */
export function arrivalTimes(at, steps) {
  const base = minutesOf(at);
  return steps.map((s) => ({ ...s, time: Number.isNaN(base) ? "" : clock(base + s.at) }));
}

/** A calendar day some whole months after another, kept to the month's last day (31 Jan + 1 → 28/29 Feb). @param {string} ymd @param {number} months */
export function addMonthsYmd(ymd, months) {
  const [y, m, d] = ymd.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1 + months, 1));
  const last = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)).getUTCDate();
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}-${String(Math.min(d, last)).padStart(2, "0")}`;
}

/** @param {string} s */
const icsText = (s) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/**
 * Calendar events as a file: all-day events, so no time zone can move them.
 * @param {{ events: { id: string, date: string, title: string, note?: string }[], studio: string, place: string, stamp: string }} o stamp = UTC "YYYYMMDDTHHMMSSZ"
 */
export function dayEventsIcs(o) {
  const slug = o.studio.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", `PRODID:-//Sitefloor//${slug}//EN`, "CALSCALE:GREGORIAN"];
  for (const e of o.events) {
    lines.push("BEGIN:VEVENT", `UID:${e.id}-${e.date}@${slug}`, `DTSTAMP:${o.stamp}`, `DTSTART;VALUE=DATE:${e.date.replace(/-/g, "")}`,
      `DTEND;VALUE=DATE:${addDaysYmd(e.date, 1).replace(/-/g, "")}`, `SUMMARY:${icsText(e.title)}`,
      ...(e.note ? [`DESCRIPTION:${icsText(e.note)}`] : []), `LOCATION:${icsText(o.place)}`, "END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}

/** Aftercare reminders from the day of treatment: each `months` later. @param {string} from @param {{ id: string, label: string, months: number, note?: string }[]} reminders */
export function reminderEvents(from, reminders) {
  return reminders.map((r) => ({ id: r.id, date: addMonthsYmd(from, r.months), title: r.label, note: r.note }));
}
