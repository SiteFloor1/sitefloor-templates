// @ts-check
/**
 * Chair board data.
 *
 * Client sites read a Google Sheet the shop updates from their phone,
 * published to the web as CSV with these columns (header row required):
 *
 *   barber,status,free_at,updated_at        (or a Google Form's responses sheet:
 *                                            Timestamp, Barber, Status, Free at)
 *   Kofi,busy,15:40,22/10/2026 15:12:00
 *   Danny,free,,2026-10-22T15:10:00Z
 *   Ash,off,,22/10/2026 09:00
 *
 * status: free | busy | off. free_at: HH:MM (shop time) when busy.
 * updated_at: ISO 8601 with an offset (Z, +01:00), or the shop's local time as
 * written by a UK-locale Google Sheet (DD/MM/YYYY HH:MM[:SS]) or YYYY-MM-DD HH:MM[:SS].
 *
 * If a barber has several rows (a Form adds one per answer), the newest counts.
 * Every barber is judged on their own, so one barber updating never makes another
 * barber's old row look live:
 *   free → live for staleAfterMinutes after updated_at
 *   busy → live until free_at, if set today and free_at has not passed
 *   off  → live for the rest of the day it was set
 * A row that is not live, or can't be read, becomes "unknown" (no times shown).
 * If no row is live, or the sheet is unreachable or malformed, the whole board
 * shows a fallback instead of times. It never shows stale or past times.
 */
import { toMinutes, zonedNow } from "../../../core/lib/hours.js";
import { parseCsv, parseSheetTime } from "../../../core/lib/sheet.js";

export { parseCsv, parseSheetTime }; // moved to core (the walk-in queue reads sheets too); kept here for existing imports

/** @typedef {"free"|"busy"|"off"|"unknown"} ChairStatus */
/** @typedef {{ barber: string, status: ChairStatus, freeAt: string|null, updatedAt: number|null }} ChairRow */
/** @typedef {{ ok: true, rows: ChairRow[], updatedAt: number } | { ok: false, reason: "malformed"|"stale"|"empty" }} BoardData */

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;
const CLOCK_SKEW_MS = 5 * 60_000; // a phone clock a few minutes fast is fine; further ahead is not trusted
const BUSY_MAX_MINUTES = 120; // a "busy until" set more than 2 hours ahead is too old to promise a slot from

/**
 * @param {string} csv
 * @param {number} nowMs
 * @param {number} staleAfterMinutes how long a "free" row stays live
 * @param {string} timeZone shop timezone, e.g. "Europe/London"
 * @returns {BoardData}
 */
export function boardFromCsv(csv, nowMs, staleAfterMinutes, timeZone) {
  const rows = parseCsv(csv);
  if (rows.length < 2) return { ok: false, reason: "empty" };
  const header = rows[0].map(columnName);
  const col = (/** @type {string} */ name) => header.indexOf(name);
  if (["barber", "status", "free_at", "updated_at"].some((c) => col(c) === -1)) return { ok: false, reason: "malformed" };
  const now = zonedNow(new Date(nowMs), timeZone);
  const cell = (/** @type {string[]} */ r, /** @type {string} */ name) => (r[col(name)] ?? "").trim();
  /** @type {Map<string, { cells: string[], updatedAt: number }>} newest row per barber */
  const latest = new Map();
  for (const r of rows.slice(1)) {
    const barber = cell(r, "barber");
    if (!barber) continue;
    const updatedAt = parseSheetTime(cell(r, "updated_at"), timeZone);
    const seen = latest.get(barber);
    if (!seen || Number.isNaN(seen.updatedAt) || updatedAt > seen.updatedAt) latest.set(barber, { cells: r, updatedAt });
  }
  /** @type {ChairRow[]} */
  const out = [];
  for (const [barber, { cells, updatedAt }] of latest) {
    const freeAt = clockTime(cell(cells, "free_at"));
    const status = liveStatus(statusWord(cell(cells, "status")), freeAt, updatedAt, { nowMs, now, staleAfterMinutes, timeZone });
    out.push({ barber, status, freeAt: status === "busy" ? freeAt : null, updatedAt: status === "unknown" ? null : updatedAt });
  }
  const live = out.filter((r) => r.updatedAt !== null).map((r) => /** @type {number} */ (r.updatedAt));
  if (!live.length) return { ok: false, reason: out.length ? "stale" : "empty" };
  return { ok: true, rows: out, updatedAt: Math.max(...live) };
}

/**
 * Header names from a hand-made sheet or a Google Form's responses sheet
 * ("Timestamp", "Barber", "Status", "Free at") map to the same columns.
 * @param {string} h @returns {string}
 */
function columnName(h) {
  const n = h.trim().toLowerCase().replace(/[^a-z]+/g, "_").replace(/^_|_$/g, "");
  return n === "timestamp" ? "updated_at" : n;
}

/** "9:40", "09:40" or a Form's "09:40:00" → "09:40"; anything else is returned unchanged (and rejected later). @param {string} v */
function clockTime(v) {
  const m = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(v);
  return m ? `${m[1].padStart(2, "0")}:${m[2]}` : v;
}

/** Form answers like "Free", "Busy", "Off today" → free | busy | off. @param {string} v @returns {string} */
function statusWord(v) {
  const w = v.trim().toLowerCase();
  if (w.startsWith("off") || w.startsWith("not in")) return "off";
  return w;
}

/**
 * Whether one row can be shown as live, and as what.
 * @param {string} status @param {string} freeAt @param {number} updatedAt
 * @param {{ nowMs: number, now: import("../../../core/lib/hours.js").ZonedNow, staleAfterMinutes: number, timeZone: string }} at
 * @returns {ChairStatus}
 */
function liveStatus(status, freeAt, updatedAt, at) {
  if (Number.isNaN(updatedAt) || updatedAt > at.nowMs + CLOCK_SKEW_MS) return "unknown";
  const set = zonedNow(new Date(updatedAt), at.timeZone);
  if (set.date !== at.now.date) return "unknown"; // anything from before today is never live
  if (status === "off") return "off";
  if (status === "free") return at.nowMs - updatedAt <= at.staleAfterMinutes * 60_000 ? "free" : "unknown";
  if (status !== "busy" || !HHMM.test(freeAt)) return "unknown";
  const until = toMinutes(freeAt);
  if (until <= at.now.minutes || until - set.minutes > BUSY_MAX_MINUTES) return "unknown";
  return "busy";
}

/**
 * Demo-only: plausible moving data so the board looks alive.
 * Deterministic for a given minute so tests are stable.
 * @param {string[]} barbers @param {number} nowMinutes minutes after midnight (shop time)
 * @returns {{ barber: string, status: "free"|"busy", freeAtMinutes: number|null, progress: number, cut: string }[]}
 */
export function simulatedBoard(barbers, nowMinutes) {
  const cuts = ["Skin fade", "Taper fade", "Beard shape-up", "Kids cut", "Scissor cut"];
  return barbers.map((barber, i) => {
    const length = [40, 35, 25, 30][i % 4];
    const offset = [18, 0, 31, 9][i % 4];
    const gap = [6, 14, 6, 10][i % 4]; // minutes the chair sits free between customers
    const cycle = length + gap;
    const t = (nowMinutes + offset) % cycle;
    if (t >= length) return { barber, status: "free", freeAtMinutes: null, progress: 1, cut: "" };
    return { barber, status: "busy", freeAtMinutes: nowMinutes + (length - t) + 2, progress: t / length, cut: cuts[(i + Math.floor(nowMinutes / cycle)) % cuts.length] };
  });
}
