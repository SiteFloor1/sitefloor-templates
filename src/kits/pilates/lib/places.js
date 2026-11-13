// @ts-check
/**
 * Places left in each class, from the studio's published Google Sheet (CSV). One row per class the studio has
 * updated; classes without a row simply show no places.
 *
 *   date,time,left,updated_at
 *   2026-10-30,07:00,0,2026-10-29 21:10
 *   2026-10-30,09:15,2,2026-10-30 07:40
 *
 * Fails closed. A row is used only for a class that hasn't started yet, and only while it is fresh (updated within
 * `staleAfterMinutes`), a full class ("0") included: an old "full" says nothing, like any old count. Unreadable times,
 * future times, negative or non-whole numbers are ignored; a count above the room's reformers means that class shows
 * nothing. A sheet with anything written in a column it doesn't expect (a name, a phone number) is refused whole, and
 * an unreadable sheet returns { ok: false }, so the page says nothing rather than something that may be wrong.
 */
import { parseCsv, parseSheetTime } from "../../../core/lib/sheet.js";
import { isTime, toMinutes, zonedNow } from "../../../core/lib/hours.js";
import { sessionKey } from "./classes.js";

/** @typedef {{ ok: true, left: Record<string, number> } | { ok: false }} Places left by session key ("YYYY-MM-DD HH:MM") */

/**
 * True when any row has something written outside the expected columns (or past the header's last column).
 * @param {string[][]} rows header first @param {number[]} cols the expected columns' indexes
 */
export function extraFilled(rows, cols) {
  const keep = new Set(cols);
  return rows.slice(1).some((r) => r.some((v, j) => !keep.has(j) && String(v ?? "").trim() !== ""));
}

/**
 * @param {string} csv @param {number} nowMs @param {string} tz @param {number} staleAfterMinutes
 * @param {number} [room] the room's reformers: a count above it is unreadable
 * @returns {Places}
 */
export function placesFromCsv(csv, nowMs, tz, staleAfterMinutes, room = Infinity) {
  const rows = parseCsv(csv);
  if (!rows.length) return { ok: false };
  const head = rows[0].map((h) => h.trim().toLowerCase());
  const col = (/** @type {string} */ n) => head.indexOf(n);
  const [iDate, iTime, iLeft, iAt] = [col("date"), col("time"), col("left"), col("updated_at")];
  if (iDate < 0 || iTime < 0 || iLeft < 0 || iAt < 0) return { ok: false };
  if (extraFilled(rows, [iDate, iTime, iLeft, iAt])) return { ok: false };
  const now = zonedNow(new Date(nowMs), tz);
  /** @type {Record<string, { left: number, at: number }>} */
  const best = {};
  const bad = new Set();
  for (const r of rows.slice(1)) {
    const row = readRow(r, [iDate, iTime, iLeft, iAt], tz, nowMs);
    if (!row) continue;
    if (row.date < now.date || (row.date === now.date && toMinutes(row.time) <= now.minutes)) continue; // started or past
    if (nowMs - row.at > staleAfterMinutes * 60_000) continue; // stale, "0" too: say nothing
    const key = sessionKey(row.date, row.time);
    if (row.left > room) { bad.add(key); continue; } // more places than reformers: that class says nothing
    if (!best[key] || row.at > best[key].at) best[key] = { left: row.left, at: row.at };
  }
  return { ok: true, left: Object.fromEntries(Object.entries(best).filter(([k]) => !bad.has(k)).map(([k, v]) => [k, v.left])) };
}

/**
 * One sheet row, or null when anything in it can't be read with certainty (or it claims a time in the future).
 * @param {string[]} r @param {number[]} cols date, time, left, updated_at @param {string} tz @param {number} nowMs
 * @returns {{ date: string, time: string, left: number, at: number }|null}
 */
function readRow(r, [iDate, iTime, iLeft, iAt], tz, nowMs) {
  const date = (r[iDate] ?? "").trim(), time = (r[iTime] ?? "").trim(), raw = (r[iLeft] ?? "").trim();
  const at = parseSheetTime(r[iAt] ?? "", tz);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !isTime(time) || !/^\d{1,3}$/.test(raw) || Number.isNaN(at) || at > nowMs + 60_000) return null;
  return { date, time, left: Number(raw), at };
}
