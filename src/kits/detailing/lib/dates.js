// @ts-check
/**
 * Dates for a detailing studio: the next start for a job of a given length from the studio's diary sheet, the
 * first-wash and care reminders after handover, and maintenance washes as a repeating calendar entry. Every interval
 * and step comes from the studio's site.json; dates are calendar days (YYYY-MM-DD) handled in UTC, and reminder times
 * are the studio's local time written as UTC, so a clock change never moves them.
 */
import { parseCsv, parseSheetTime } from "../../../core/lib/sheet.js";
import { addDays, wallTimeToUtc } from "../../../core/lib/hours.js";
import { FUTURE_SLACK_MS } from "./collection.js";

const WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
/** @param {string} ymd */
export const weekdayOf = (ymd) => WEEKDAYS[new Date(`${ymd}T12:00:00Z`).getUTCDay()];

/** @typedef {{ date: string, free: boolean }} DiaryDay */
/** @typedef {{ ok: true, days: DiaryDay[], updated: number } | { ok: false, reason: "unreadable"|"stale"|"empty" }} Diary */

/**
 * The studio's diary sheet: one row a working day, `date` (YYYY-MM-DD), `status` (free or booked) and `updated_at`.
 * A sheet nobody has touched in `staleAfterHours` is treated as unknown, so the site never offers a date that went.
 * @param {string} text @param {number} nowMs @param {string} timeZone @param {number} staleAfterHours @returns {Diary}
 */
export function diaryFromCsv(text, nowMs, timeZone, staleAfterHours) {
  const rows = parseCsv(text);
  if (rows.length < 2) return { ok: false, reason: "empty" };
  const head = rows[0].map((h) => h.trim().toLowerCase());
  const at = (/** @type {string} */ k) => head.indexOf(k);
  const [d, s, u] = [at("date"), at("status"), at("updated_at")];
  if (d < 0 || s < 0 || u < 0) return { ok: false, reason: "unreadable" };
  /** @type {DiaryDay[]} */ const days = [];
  let updated = NaN;
  for (const r of rows.slice(1)) {
    const date = (r[d] ?? "").trim(), status = (r[s] ?? "").trim().toLowerCase();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !["free", "booked"].includes(status)) continue;
    days.push({ date, free: status === "free" });
    const t = parseSheetTime(r[u] ?? "", timeZone);
    if (!Number.isNaN(t)) updated = Number.isNaN(updated) ? t : Math.max(updated, t);
  }
  if (!days.length) return { ok: false, reason: "empty" };
  if (Number.isNaN(updated)) return { ok: false, reason: "unreadable" };
  if (updated - nowMs > FUTURE_SLACK_MS) return { ok: false, reason: "unreadable" }; // a date ahead of now never goes stale
  if (nowMs - updated > staleAfterHours * 3600_000) return { ok: false, reason: "stale" };
  return { ok: true, days: days.sort((a, b) => (a.date < b.date ? -1 : 1)), updated };
}

/**
 * The first day a job of `days` working days can start: that many free working days in a row, from `from` on.
 * Days the studio doesn't work (not in `workdays`) are skipped, not counted; a day missing from the sheet breaks the
 * run, because nobody said it was free. Null when the sheet has no such run.
 * @param {DiaryDay[]} diary @param {string} from @param {number} days @param {string[]} workdays e.g. ["mon","tue",…]
 * @returns {{ start: string, end: string } | null}
 */
export function nextStart(diary, from, days, workdays) {
  const free = new Map(diary.map((x) => [x.date, x.free]));
  const last = diary.length ? diary[diary.length - 1].date : from;
  for (let start = from; start <= last; start = addDays(start, 1)) {
    if (!workdays.includes(weekdayOf(start)) || free.get(start) !== true) continue;
    let run = 0, day = start, end = start;
    while (run < days && day <= last) {
      if (workdays.includes(weekdayOf(day))) {
        if (free.get(day) !== true) break;
        run++; end = day;
      }
      day = addDays(day, 1);
    }
    if (run === days) return { start, end };
  }
  return null;
}

/* ------------------------------------------------------------------ calendar files */

const utc = (/** @type {number} */ ms) => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const esc = (/** @type {string} */ s) => s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\r?\n/g, "\\n");
/** Local time of day the reminders go off. */
export const REMIND_AT = { hour: 9, minute: 0 };
/** @param {string} ymd @param {string} tz */
const nineAm = (ymd, tz) => { const [year, month, day] = ymd.split("-").map(Number); return wallTimeToUtc({ year, month, day, ...REMIND_AT }, tz); };
/** @param {string} business */
const slug = (business) => business.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** @typedef {{ day: number, title: string, text: string }} CareStep */

/**
 * The care reminders after handover (first wash and the rest): one 15-minute entry at 9am on each step's day.
 * @param {{ steps: CareStep[], handover: string, business: string, place: string, tz: string, stamp: Date }} o
 */
export function careIcs(o) {
  const events = o.steps.filter((s) => s.day >= 1).flatMap((s) => {
    const start = nineAm(addDays(o.handover, s.day), o.tz);
    return [
      "BEGIN:VEVENT", `UID:care-${slug(o.business)}-${o.handover}-${s.day}@sitefloor`, `DTSTAMP:${utc(o.stamp.getTime())}`,
      `DTSTART:${utc(start)}`, `DTEND:${utc(start + 15 * 60_000)}`,
      `SUMMARY:${esc(`${s.title} (${o.business})`)}`, `LOCATION:${esc(o.place)}`, `DESCRIPTION:${esc(s.text)}`,
      "BEGIN:VALARM", "TRIGGER:PT0M", "ACTION:DISPLAY", `DESCRIPTION:${esc(s.title)}`, "END:VALARM",
      "END:VEVENT",
    ];
  });
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Sitefloor//Detailing care//EN", "CALSCALE:GREGORIAN", ...events, "END:VCALENDAR", ""].join("\r\n");
}

/** @typedef {{ id: string, name: string, every: number, text: string }} Plan every = weeks between visits */

/**
 * A maintenance plan as one repeating calendar entry: the first visit `every` weeks after `from`, then every `every`
 * weeks, `count` times. A reminder the visitor's calendar shows, not a booking.
 * @param {{ plan: Plan, from: string, count: number, business: string, place: string, tz: string, stamp: Date }} o
 */
export function maintenanceIcs(o) {
  const first = nineAm(addDays(o.from, o.plan.every * 7), o.tz);
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Sitefloor//Detailing maintenance//EN", "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT", `UID:plan-${slug(o.business)}-${o.plan.id}-${o.from}@sitefloor`, `DTSTAMP:${utc(o.stamp.getTime())}`,
    `DTSTART:${utc(first)}`, `DTEND:${utc(first + 15 * 60_000)}`,
    `RRULE:FREQ=WEEKLY;INTERVAL=${o.plan.every};COUNT=${o.count}`,
    `SUMMARY:${esc(`${o.plan.name}: book with ${o.business}`)}`, `LOCATION:${esc(o.place)}`, `DESCRIPTION:${esc(o.plan.text)}`,
    "BEGIN:VALARM", "TRIGGER:PT0M", "ACTION:DISPLAY", `DESCRIPTION:${esc(o.plan.name)}`, "END:VALARM",
    "END:VEVENT", "END:VCALENDAR", "",
  ].join("\r\n");
}

/* ------------------------------------------------------------------ is my car due? */

/** @typedef {{ id: string, name: string, weeks?: number, months?: number, text: string }} Interval the studio's own interval */

/** A calendar day `n` months on, kept to the month's last day when the day doesn't exist (31 Jan + 1 month = 28 Feb). @param {string} ymd @param {number} n */
export function addMonths(ymd, n) {
  const [y, m, d] = ymd.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1 + n, 1));
  const last = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)).getUTCDate();
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}-${String(Math.min(d, last)).padStart(2, "0")}`;
}

/** When something is next due, from the day it was last done. @param {string} last @param {Interval} item */
export const dueOn = (last, item) => (item.months ? addMonths(last, item.months) : addDays(last, (item.weeks ?? 0) * 7));

/** Whole days from today to the due day (negative when it's overdue). @param {string} due @param {string} today */
export const daysUntil = (due, today) => Math.round((Date.parse(`${due}T12:00:00Z`) - Date.parse(`${today}T12:00:00Z`)) / 86400000);

/** "Due today", "Due in 1 day", "Due in 34 days", "Overdue by 12 days". @param {number} days */
export function dueWords(days) {
  if (days === 0) return "Due today";
  const n = Math.abs(days);
  return days > 0 ? `Due in ${n} ${n === 1 ? "day" : "days"}` : `Overdue by ${n} ${n === 1 ? "day" : "days"}`;
}

/**
 * One reminder on the due day at 9am, the studio's time.
 * @param {{ item: Interval, due: string, business: string, place: string, tz: string, stamp: Date }} o
 */
export function dueIcs(o) {
  const start = nineAm(o.due, o.tz);
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Sitefloor//Detailing due//EN", "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT", `UID:due-${slug(o.business)}-${o.item.id}-${o.due}@sitefloor`, `DTSTAMP:${utc(o.stamp.getTime())}`,
    `DTSTART:${utc(start)}`, `DTEND:${utc(start + 15 * 60_000)}`,
    `SUMMARY:${esc(`${o.item.name} due (${o.business})`)}`, `LOCATION:${esc(o.place)}`, `DESCRIPTION:${esc(o.item.text)}`,
    "BEGIN:VALARM", "TRIGGER:PT0M", "ACTION:DISPLAY", `DESCRIPTION:${esc(o.item.name)}`, "END:VALARM",
    "END:VEVENT", "END:VCALENDAR", "",
  ].join("\r\n");
}
