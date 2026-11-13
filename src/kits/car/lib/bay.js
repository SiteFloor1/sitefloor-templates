// @ts-check
/**
 * Next free bay, from the studio's published Google Sheet (CSV). Two columns, one row:
 *
 *   next_free,updated_at
 *   2026-10-29,2026-10-26 09:12
 *
 * Fails closed: an unreadable sheet, a date in the past, or an update older than `staleAfterHours`
 * returns { ok: false } and the page shows "message us" instead of a date that may be wrong.
 */
import { parseCsv, parseSheetTime } from "../../../core/lib/sheet.js";

/**
 * @param {string} csv @param {number} nowMs @param {number} staleAfterHours @param {string} timeZone @param {string} today YYYY-MM-DD in the studio's timezone
 * @returns {{ ok: true, date: string, updatedAt: number } | { ok: false }}
 */
export function bayFromCsv(csv, nowMs, staleAfterHours, timeZone, today) {
  const rows = parseCsv(csv);
  const head = (rows[0] ?? []).map((h) => h.trim().toLowerCase());
  const di = head.indexOf("next_free");
  const ui = head.indexOf("updated_at");
  const row = rows[1];
  if (di < 0 || ui < 0 || !row) return { ok: false };
  const date = (row[di] ?? "").trim();
  const updatedAt = parseSheetTime(row[ui] ?? "", timeZone);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T12:00:00Z`))) return { ok: false };
  if (!Number.isFinite(updatedAt) || updatedAt > nowMs + 5 * 60_000 || nowMs - updatedAt > staleAfterHours * 3_600_000) return { ok: false };
  if (date < today) return { ok: false };
  return { ok: true, date, updatedAt };
}

/** "Thursday 29 October", or "Today" / "Tomorrow". @param {string} date @param {string} today */
export function dayWords(date, today) {
  const t = new Date(`${today}T12:00:00Z`);
  const d = new Date(`${date}T12:00:00Z`);
  const diff = Math.round((d.getTime() - t.getTime()) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
}
