// @ts-check
/**
 * Opening-hours logic. Pure functions, no DOM: used at build time (SEO,
 * hours table) and in the browser (live open/closed status).
 *
 * Schedule format (site.json → hours):
 *   weekly:     { mon: [["09:00","19:00"]], tue: [], ... }   // [] = closed
 *               ranges may cross midnight, e.g. ["22:00","02:00"]
 *   exceptions: [{ date: "2026-12-25", ranges: [] },          // closed
 *                { date: "2026-12-24", ranges: [["09:00","14:00"]], note: "Christmas Eve" }]
 *   timezone:   IANA name, e.g. "Europe/London"
 */

/** @typedef {[string, string]} Range */
/** @typedef {Record<DayKey, Range[]>} Weekly */
/** @typedef {"sun"|"mon"|"tue"|"wed"|"thu"|"fri"|"sat"} DayKey */
/** @typedef {{ date: string, ranges: Range[], note?: string }} Exception */
/** @typedef {{ weekly: Weekly, exceptions?: Exception[], timezone: string }} Hours */
/** @typedef {{ date: string, weekday: number, minutes: number }} ZonedNow */
/**
 * @typedef {object} OpenStatus
 * @property {boolean} open
 * @property {number|null} closesAt   minutes after midnight of the opening day (may exceed 1440 for overnight)
 * @property {{ date: string, weekday: number, minutes: number }|null} nextOpen
 * @property {string|null} note       exception note that applies today, if any
 */

export const DAY_KEYS = /** @type {const} */ (["sun", "mon", "tue", "wed", "thu", "fri", "sat"]);
export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DAY_MINUTES = 24 * 60;
const LOOKAHEAD_DAYS = 14;

/** @param {string} hhmm @returns {number} */
export function toMinutes(hhmm) {
  const m = TIME_RE.exec(hhmm);
  if (!m) throw new Error(`Invalid time "${hhmm}", expected HH:MM (24h)`);
  return Number(m[1]) * 60 + Number(m[2]);
}

/** @param {unknown} value @returns {boolean} */
export function isTime(value) {
  return typeof value === "string" && TIME_RE.test(value);
}

/**
 * "9am", "5:30pm", "12pm", "12am".
 * @param {number} minutes minutes after midnight (wraps past 24h)
 */
export function formatTime12(minutes) {
  const m = ((minutes % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
  const h24 = Math.floor(m / 60);
  const mm = m % 60;
  const suffix = h24 < 12 ? "am" : "pm";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return mm === 0 ? `${h12}${suffix}` : `${h12}:${String(mm).padStart(2, "0")}${suffix}`;
}

/** @param {number} minutes */
export function formatTime24(minutes) {
  const m = ((minutes % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/**
 * Wall-clock date/time in a timezone, independent of the visitor's own timezone.
 * @param {Date} date
 * @param {string} timeZone
 * @returns {ZonedNow}
 */
export function zonedNow(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23", weekday: "short",
  }).formatToParts(date);
  /** @param {string} type */
  const get = (type) => parts.find((p) => p.type === type)?.value ?? "";
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    weekday,
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

/**
 * The instant (ms since epoch) at which a wall clock in `timeZone` reads the
 * given date and time. Handles BST/GMT; in the skipped spring-forward hour it
 * resolves to the later offset.
 * @param {{ year: number, month: number, day: number, hour: number, minute: number, second?: number }} t month is 1–12
 * @param {string} timeZone
 * @returns {number}
 */
export function wallTimeToUtc(t, timeZone) {
  const guess = Date.UTC(t.year, t.month - 1, t.day, t.hour, t.minute, t.second ?? 0);
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone, year: "numeric", month: "numeric", day: "numeric",
    hour: "numeric", minute: "numeric", second: "numeric", hourCycle: "h23",
  });
  /** @param {number} ms offset of the zone from UTC at that instant */
  const offsetAt = (ms) => {
    /** @type {Record<string, number>} */
    const p = {};
    for (const part of fmt.formatToParts(new Date(ms))) p[part.type] = Number(part.value);
    return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - ms;
  };
  const first = guess - offsetAt(guess);
  return guess - offsetAt(first);
}

/** @param {string} isoDate @param {number} days @returns {string} */
export function addDays(isoDate, days) {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** @param {string} isoDate */
function weekdayOf(isoDate) {
  return new Date(`${isoDate}T12:00:00Z`).getUTCDay();
}

/**
 * Ranges that apply on a calendar date (exception beats weekly schedule).
 * @param {Hours} hours @param {string} isoDate
 * @returns {{ ranges: Range[], note: string|null }}
 */
export function rangesFor(hours, isoDate) {
  const ex = (hours.exceptions ?? []).find((e) => e.date === isoDate);
  if (ex) return { ranges: ex.ranges, note: ex.note ?? null };
  return { ranges: hours.weekly[DAY_KEYS[weekdayOf(isoDate)]] ?? [], note: null };
}

/**
 * Converts a range to [start, end] minutes, with end > start (overnight ends exceed 1440).
 * @param {Range} r
 */
function span(r) {
  const start = toMinutes(r[0]);
  let end = toMinutes(r[1]);
  if (end <= start) end += DAY_MINUTES; // overnight, or "00:00" meaning midnight
  return [start, end];
}

/**
 * Is the business open at a given zoned moment, and when does it next open/close?
 * @param {Hours} hours
 * @param {ZonedNow} now
 * @returns {OpenStatus}
 */
export function openStatus(hours, now) {
  const today = rangesFor(hours, now.date);
  // Still inside yesterday's overnight range?
  const yesterday = rangesFor(hours, addDays(now.date, -1));
  for (const r of yesterday.ranges) {
    const [, end] = span(r);
    if (end > DAY_MINUTES && now.minutes < end - DAY_MINUTES) {
      return { open: true, closesAt: end - DAY_MINUTES, nextOpen: null, note: today.note };
    }
  }
  for (const r of today.ranges) {
    const [start, end] = span(r);
    if (now.minutes >= start && now.minutes < end) {
      return { open: true, closesAt: end, nextOpen: null, note: today.note };
    }
  }
  return { open: false, closesAt: null, nextOpen: nextOpening(hours, now), note: today.note };
}

/**
 * @param {Hours} hours @param {ZonedNow} now
 * @returns {{ date: string, weekday: number, minutes: number }|null}
 */
export function nextOpening(hours, now) {
  for (let i = 0; i <= LOOKAHEAD_DAYS; i++) {
    const date = addDays(now.date, i);
    const starts = rangesFor(hours, date).ranges.map((r) => span(r)[0]).sort((a, b) => a - b);
    const start = starts.find((s) => i > 0 || s > now.minutes);
    if (start !== undefined) return { date, weekday: weekdayOf(date), minutes: start };
  }
  return null;
}

/**
 * Human sentence for the status chip, e.g. "Open now · closes 7pm".
 * @param {OpenStatus} s @param {ZonedNow} now
 */
export function statusLabel(s, now) {
  if (s.open && s.closesAt !== null) return `Open now · closes ${formatTime12(s.closesAt)}`;
  if (!s.nextOpen) return "Closed";
  const dayDiff = Math.round((Date.parse(s.nextOpen.date) - Date.parse(now.date)) / 86400000);
  const when = dayDiff === 0 ? "today" : dayDiff === 1 ? "tomorrow" : DAY_NAMES[s.nextOpen.weekday];
  return `Closed · opens ${when} at ${formatTime12(s.nextOpen.minutes)}`;
}

/**
 * Rows for an hours table, Monday first.
 * @param {Hours} hours
 * @returns {{ day: string, dayIndex: number, label: string }[]}
 */
export function weeklyRows(hours) {
  return [1, 2, 3, 4, 5, 6, 0].map((i) => {
    const ranges = hours.weekly[DAY_KEYS[i]] ?? [];
    const label = ranges.length === 0
      ? "Closed"
      : ranges.map((r) => `${formatTime12(toMinutes(r[0]))} – ${formatTime12(toMinutes(r[1]))}`).join(", ");
    return { day: DAY_NAMES[i], dayIndex: i, label };
  });
}
