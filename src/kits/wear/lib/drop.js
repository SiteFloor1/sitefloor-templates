// @ts-check
/**
 * Drops: a release that opens at a set wall-clock time in the brand's own timezone ("2026-11-07T10:00", London),
 * whatever the visitor's own clock says. One quiet line says how long until it opens.
 */
import { wallTimeToUtc, zonedNow } from "../../../core/lib/hours.js";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** @param {string} opens "YYYY-MM-DDTHH:MM" wall time @param {string} timeZone @returns {number} ms */
export function opensAt(opens, timeZone) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(opens);
  if (!m) return NaN;
  const [year, month, day, hour, minute] = m.slice(1).map(Number);
  return wallTimeToUtc({ year, month, day, hour, minute }, timeZone);
}

/** "Saturday 10:00" (or "Saturday 7 November, 10:00" when it's more than six days off). @param {string} opens @param {number} now @param {string} timeZone */
export function opensWords(opens, now, timeZone) {
  const [date, time] = opens.split("T");
  const d = new Date(`${date}T12:00:00Z`);
  const dayName = DAYS[d.getUTCDay()];
  const away = calendarDaysBetween(zonedNow(new Date(now), timeZone).date, date);
  return away > 6 ? `${dayName} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}, ${time}` : `${dayName} ${time}`;
}

/** Whole calendar days from a to b (YYYY-MM-DD). @param {string} a @param {string} b */
export function calendarDaysBetween(a, b) {
  return Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86_400_000);
}

/**
 * How long until a drop opens, as the line says it: "3 days", "tomorrow", "today", "open now".
 * Days are counted on the brand's calendar, so 23:00 the night before is "tomorrow", not "1 hour".
 * @param {string} opens @param {number} now @param {string} timeZone
 * @returns {{ phase: "before"|"today"|"open", words: string }}
 */
export function untilDrop(opens, now, timeZone) {
  const at = opensAt(opens, timeZone);
  if (now >= at) return { phase: "open", words: "open now" };
  const days = calendarDaysBetween(zonedNow(new Date(now), timeZone).date, opens.slice(0, 10));
  if (days <= 0) {
    const mins = Math.ceil((at - now) / 60_000);
    return { phase: "today", words: mins < 60 ? `in ${mins} min` : "today" };
  }
  return { phase: "before", words: days === 1 ? "tomorrow" : `${days} days` };
}

/**
 * Past drops, newest first; a drop whose time hasn't come stays out of the archive.
 * @template {{ opens: string }} T @param {T[]} drops @param {number} now @param {string} timeZone @returns {T[]}
 */
export function pastDrops(drops, now, timeZone) {
  return drops.filter((d) => opensAt(d.opens, timeZone) <= now).sort((a, b) => b.opens.localeCompare(a.opens));
}

/**
 * The quiet clock: time left until a drop opens, as "2d 14h 06m 09s" (days left out on the day itself). Null once open.
 * Fixed-width parts (two digits for hours, minutes, seconds) so the line never changes width as it ticks.
 * @param {string} opens @param {number} now @param {string} timeZone @returns {string|null}
 */
export function countdown(opens, now, timeZone) {
  let s = Math.floor((opensAt(opens, timeZone) - now) / 1000);
  if (!(s > 0)) return null;
  const d = Math.floor(s / 86_400); s %= 86_400;
  const h = Math.floor(s / 3600); s %= 3600;
  const m = Math.floor(s / 60); s %= 60;
  const p = (/** @type {number} */ n) => String(n).padStart(2, "0");
  return `${d ? `${d}d ` : ""}${p(h)}h ${p(m)}m ${p(s)}s`;
}
