// @ts-check
/**
 * The next free appointment, from the salon's published Google Sheet (CSV). Two columns, one row:
 *
 *   next_free,updated_at
 *   2026-10-30 14:30,2026-10-29 09:12
 *
 * The salon changes it from its phone when the book fills. Fails closed: an unreadable sheet, a slot already gone,
 * or an update older than `staleAfterMinutes` returns { ok: false }, and the page says "message us" instead.
 */
import { parseCsv, parseSheetTime } from "../../../core/lib/sheet.js";

const SLOT = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}):(\d{2})$/;

/**
 * @param {string} csv @param {number} nowMs @param {number} staleAfterMinutes @param {string} timeZone
 * @param {string} nowLocal the salon's wall time now, "YYYY-MM-DD HH:MM"
 * @returns {{ ok: true, at: string, updatedAt: number } | { ok: false }}
 */
export function slotFromCsv(csv, nowMs, staleAfterMinutes, timeZone, nowLocal) {
  const rows = parseCsv(csv);
  const head = (rows[0] ?? []).map((h) => h.trim().toLowerCase());
  const si = head.indexOf("next_free"), ui = head.indexOf("updated_at");
  const row = rows[1];
  if (si < 0 || ui < 0 || !row) return { ok: false };
  const at = (row[si] ?? "").trim().replace("T", " ");
  const m = SLOT.exec(at);
  if (!m || Number(m[2]) > 23 || Number(m[3]) > 59 || Number.isNaN(Date.parse(`${m[1]}T12:00:00Z`))) return { ok: false };
  const updatedAt = parseSheetTime(row[ui] ?? "", timeZone);
  if (!Number.isFinite(updatedAt) || updatedAt > nowMs + 5 * 60_000 || nowMs - updatedAt > staleAfterMinutes * 60_000) return { ok: false };
  if (at <= nowLocal) return { ok: false };
  return { ok: true, at, updatedAt };
}

/**
 * "Today, 14:30", "Tomorrow, 10:00", "Thursday, 14:30" within the week, else "Thu 12 Nov, 14:30".
 * @param {string} at "YYYY-MM-DD HH:MM" @param {string} today YYYY-MM-DD
 */
export function slotWords(at, today) {
  const [date, time] = at.split(" ");
  const d = new Date(`${date}T12:00:00Z`), t = new Date(`${today}T12:00:00Z`);
  const diff = Math.round((d.getTime() - t.getTime()) / 86_400_000);
  const day = diff === 0 ? "Today" : diff === 1 ? "Tomorrow" : diff < 7
    ? d.toLocaleDateString("en-GB", { weekday: "long", timeZone: "UTC" })
    : d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
  return `${day}, ${time}`;
}
