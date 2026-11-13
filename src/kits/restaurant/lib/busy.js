// @ts-check
/**
 * How busy the café usually is, from its own numbers (e.g. its till receipts per hour), and how busy it is
 * right now when staff have said so on the sheet. Levels: 0 quiet, 1 steady, 2 busy, 3 queue at the door.
 *
 *   busy: { basis: "From our till, Sept–Oct 2026", from: "07:00", week: { mon: [1, 3, 2, 1, 1, 2, 2, 1, 0] , … } }
 *
 * Each day's list starts at `from`, one value an hour; null is an hour the café is closed. A missing day or hour
 * means no number, never a guess.
 */
import { toMinutes, formatTime12, DAY_KEYS } from "../../../core/lib/hours.js";

export const LEVELS = ["Quiet", "Steady", "Busy", "Queue at the door"];
/** The sheet's words for right now, as levels. */
export const LIVE_LEVEL = { quiet: 0, steady: 1, busy: 2, queue: 3 };

/** @typedef {{ basis: string, from: string, week: Partial<Record<string, (number|null)[]>>, laptopMax?: number }} Busy */

/**
 * The usual level at a time on a weekday (0 Sunday … 6 Saturday), or null when the café gave no number for it.
 * @param {Busy} b @param {number} weekday @param {number} minutes
 */
export function usualAt(b, weekday, minutes) {
  const day = b.week[DAY_KEYS[weekday]];
  if (!day) return null;
  const i = Math.floor((minutes - toMinutes(b.from)) / 60);
  return i >= 0 && i < day.length ? day[i] ?? null : null;
}

/**
 * The day's hours as bars: { start, level } from the café's numbers, leaving out the hours it's closed.
 * @param {Busy} b @param {number} weekday
 * @returns {{ start: number, level: number }[]}
 */
export function dayBars(b, weekday) {
  const day = b.week[DAY_KEYS[weekday]] ?? [];
  return day.flatMap((level, i) => (level === null ? [] : [{ start: toMinutes(b.from) + i * 60, level }]));
}

/**
 * When it next gets quieter than now, later today ("Quieter from 10am"), or null.
 * @param {Busy} b @param {number} weekday @param {number} minutes @param {number} level now
 */
export function quieterFrom(b, weekday, minutes, level) {
  const later = dayBars(b, weekday).filter((h) => h.start > minutes && h.level < level);
  return later.length ? later[0].start : null;
}

/**
 * The laptop-friendly stretches of a day: runs of hours at or below `laptopMax` (default 1, steady), at least
 * two hours long. e.g. [{ from: 600, to: 720 }] for 10am–12pm.
 * @param {Busy} b @param {number} weekday
 */
export function laptopWindows(b, weekday) {
  const max = b.laptopMax ?? 1;
  /** @type {{ from: number, to: number }[]} */ const out = [];
  for (const h of dayBars(b, weekday)) {
    const last = out[out.length - 1];
    if (h.level > max) continue;
    if (last && last.to === h.start) last.to = h.start + 60; else out.push({ from: h.start, to: h.start + 60 });
  }
  return out.filter((w) => w.to - w.from >= 120);
}

/** "10am–12pm". @param {{ from: number, to: number }} w */
export const windowLabel = (w) => `${formatTime12(w.from)}–${formatTime12(w.to)}`;
