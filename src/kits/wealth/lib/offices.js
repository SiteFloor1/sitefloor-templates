// @ts-check
/** An office's time now and whether it is open, wherever it is. Pure: pass the date in. */
import { zonedNow, openStatus, formatTime24, DAY_NAMES } from "../../../core/lib/hours.js";

/**
 * @param {{ timezone: string, weekly: Record<string, [string, string][]>, exceptions?: any[] }} hours
 * @param {Date} at
 * @returns {{ time: string, open: boolean, opens: string|null, day: string|null }} `day` is set when it next opens on another day
 */
export function officeNow(hours, at) {
  const now = zonedNow(at, hours.timezone);
  const s = openStatus(/** @type {any} */ ({ exceptions: [], ...hours }), now);
  const next = s.nextOpen;
  return { time: formatTime24(now.minutes), open: s.open, opens: next ? formatTime24(next.minutes) : null, day: next && next.date !== now.date ? DAY_NAMES[next.weekday] : null };
}

/** One plain line: "Open now", "Closed. We open at 08:30", "Closed. We open on Monday at 08:30". @param {ReturnType<typeof officeNow>} n */
export function officeLine(n) {
  if (n.open) return "Open now";
  if (!n.opens) return "Closed";
  return n.day ? `Closed. We open on ${n.day} at ${n.opens}` : `Closed. We open at ${n.opens}`;
}
