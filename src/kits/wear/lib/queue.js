// @ts-check
/**
 * The drop-day line at the showroom: staff hand out numbered tickets at the door and type the number they're
 * serving into a sheet; the site shows that number so people can wait nearby instead of in the rain. Numbers are only
 * shown while fresh (the sheet touched within `staleAfterMinutes`); otherwise the line goes quiet.
 *
 * Sheet columns: serving, given, updated_at, note (optional)
 */
import { parseCsv, parseSheetTime } from "../../../core/lib/sheet.js";

/** @typedef {{ serving: number, given: number, updated: number, note: string }} QueueRead */

/**
 * The newest readable row, or null when there is none or it's stale.
 * @param {string} csv @param {{ timeZone: string, now: number, staleAfterMinutes: number }} o @returns {QueueRead|null}
 */
export function readQueueSheet(csv, o) {
  const rows = parseCsv(csv);
  if (rows.length < 2) return null;
  const head = rows[0].map((h) => h.trim().toLowerCase());
  const [is, ig, iu, inote] = ["serving", "given", "updated_at", "note"].map((n) => head.indexOf(n));
  if (is < 0 || ig < 0 || iu < 0) return null;
  /** @type {QueueRead|null} */
  let best = null;
  for (const r of rows.slice(1)) {
    const serving = Number((r[is] ?? "").trim());
    const given = Number((r[ig] ?? "").trim());
    const updated = parseSheetTime(r[iu] ?? "", o.timeZone);
    if (!Number.isInteger(serving) || !Number.isInteger(given) || serving < 0 || given < serving || Number.isNaN(updated)) continue;
    if (!best || updated > best.updated) best = { serving, given, updated, note: inote >= 0 ? (r[inote] ?? "").trim() : "" };
  }
  if (!best || o.now - best.updated > o.staleAfterMinutes * 60_000 || best.updated - o.now > 10 * 60_000) return null;
  return best;
}

/**
 * Where a ticket stands: how many are ahead and a rough wait from the brand's own minutes per person.
 * @param {number} ticket @param {QueueRead} q @param {number} minutesEach
 * @returns {{ ahead: number, wait: number, called: boolean }}
 */
export function ticketPlace(ticket, q, minutesEach) {
  const ahead = Math.max(0, ticket - q.serving);
  return { ahead, wait: ahead * minutesEach, called: ticket <= q.serving };
}
