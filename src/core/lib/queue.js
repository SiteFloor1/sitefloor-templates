// @ts-check
/**
 * Walk-in queue: how many people are waiting now (live, from a sheet the shop updates)
 * and how busy each hour usually is (from the shop's own config).
 *
 * Live sheet (published to the web as CSV), header row required; a Google Form's
 * responses sheet works as it is:
 *   Timestamp,Waiting
 *   26/10/2026 16:05:12,3
 * The newest row counts. It is live for staleAfterMinutes; after that the live part
 * hides (the usual-busyness chart still shows). It never shows an old number as current.
 */
import { parseCsv, parseSheetTime } from "./sheet.js";
import { toMinutes } from "./hours.js";

/** @typedef {{ ok: true, waiting: number, updatedAt: number } | { ok: false, reason: "malformed"|"stale"|"empty" }} QueueData */

export const BUSY_WORDS = ["Quiet", "Steady", "Busy", "Very busy"];
const CLOCK_SKEW_MS = 5 * 60_000;
const MAX_WAITING = 60;

/**
 * @param {string} csv @param {number} nowMs @param {number} staleAfterMinutes @param {string} timeZone
 * @returns {QueueData}
 */
export function queueFromCsv(csv, nowMs, staleAfterMinutes, timeZone) {
  const rows = parseCsv(csv);
  if (rows.length < 2) return { ok: false, reason: "empty" };
  const head = rows[0].map((h) => h.trim().toLowerCase());
  const t = head.findIndex((h) => h === "timestamp" || h === "updated_at");
  const w = head.findIndex((h) => h === "waiting" || h === "people waiting");
  if (t < 0 || w < 0) return { ok: false, reason: "malformed" };
  let best = { at: NaN, waiting: NaN };
  for (const r of rows.slice(1)) {
    const at = parseSheetTime(r[t] ?? "", timeZone);
    const waiting = /^\s*\d{1,3}\s*$/.test(r[w] ?? "") ? Number(r[w]) : NaN;
    if (!Number.isFinite(at) || !Number.isFinite(waiting) || waiting > MAX_WAITING) continue;
    if (!(best.at >= at)) best = { at, waiting };
  }
  if (!Number.isFinite(best.at)) return { ok: false, reason: "malformed" };
  if (best.at > nowMs + CLOCK_SKEW_MS || nowMs - best.at > staleAfterMinutes * 60_000) return { ok: false, reason: "stale" };
  return { ok: true, waiting: best.waiting, updatedAt: best.at };
}

/**
 * Estimated wait before your cut starts. Each chair works through the queue in turn.
 * @param {number} waiting @param {number} chairs barbers cutting @param {number} minutesPerCut average
 */
export function waitMinutes(waiting, chairs, minutesPerCut) {
  if (waiting <= 0) return 0;
  return Math.ceil(waiting / Math.max(1, chairs)) * minutesPerCut;
}

/** "about 15 min", "about 1 hr 10 min", "no wait". @param {number} m */
export function waitWords(m) {
  if (m <= 0) return "no wait";
  if (m < 60) return `about ${m} min`;
  return `about ${Math.floor(m / 60)} hr${m % 60 ? ` ${m % 60} min` : ""}`;
}

/**
 * The usual busyness for one weekday, one level (0–3) per hour the shop is open,
 * starting at the hour it opens. `busyness` is the shop's own estimate
 * (e.g. from Google's "Popular times" for their listing).
 * @param {Record<string, number[]>} busyness @param {any} hours site.hours @param {string} day "mon"…"sun"
 * @returns {{ hour: number, level: number }[]}
 */
export function busyHours(busyness, hours, day) {
  const ranges = hours.weekly?.[day] ?? [];
  if (!ranges.length) return [];
  const first = Math.floor(toMinutes(ranges[0][0]) / 60);
  return (busyness[day] ?? []).map((level, i) => ({ hour: first + i, level }));
}

/** Whole hours a day is open, as the number of levels its busyness must list. @param {any} hours @param {string} day */
export function openHourCount(hours, day) {
  const ranges = hours.weekly?.[day] ?? [];
  if (!ranges.length) return 0;
  const start = Math.floor(toMinutes(ranges[0][0]) / 60);
  const end = Math.ceil(toMinutes(ranges[ranges.length - 1][1]) / 60);
  return end - start;
}

/**
 * The quietest hour still to come today (the earliest, if several tie).
 * @param {{ hour: number, level: number }[]} day @param {number} nowMinutes
 */
export function quietestAhead(day, nowMinutes) {
  const ahead = day.filter((h) => (h.hour + 1) * 60 > nowMinutes);
  if (!ahead.length) return null;
  return ahead.reduce((a, b) => (b.level < a.level ? b : a));
}

/** "2pm", "12pm", "9am". @param {number} hour 0–23 */
export function hourWord(hour) {
  const h = hour % 12 || 12;
  return `${h}${hour < 12 ? "am" : "pm"}`;
}


const GRID_DAYS = [["mon", "Mon"], ["tue", "Tue"], ["wed", "Wed"], ["thu", "Thu"], ["fri", "Fri"], ["sat", "Sat"], ["sun", "Sun"]];

/**
 * A week of usual busyness as a grid: one column per hour any day is open, Monday first.
 * Cells are null when the shop is closed that hour.
 * @param {Record<string, number[]>} busyness @param {any} hours
 */
export function busyGrid(busyness, hours) {
  const days = GRID_DAYS.map(([key, label]) => ({ key, label, dayIndex: ["sun", "mon", "tue", "wed", "thu", "fri", "sat"].indexOf(key), hours: busyHours(busyness, hours, key) }));
  const all = days.flatMap((d) => d.hours.map((h) => h.hour));
  if (!all.length) return { hours: [], rows: [] };
  const first = Math.min(...all), last = Math.max(...all);
  const cols = Array.from({ length: last - first + 1 }, (_, i) => first + i);
  return {
    hours: cols.map((h) => ({ hour: h, label: hourWord(h) })),
    rows: days.map((d) => ({ key: d.key, label: d.label, dayIndex: d.dayIndex, cells: cols.map((h) => d.hours.find((x) => x.hour === h)?.level ?? null) })),
  };
}
