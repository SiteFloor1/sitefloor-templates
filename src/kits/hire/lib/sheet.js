// @ts-check
/**
 * The client's live Sheet (published as CSV), read the same way on every page: which days each car is taken, and where a
 * deposit is. Fails closed: an unreadable sheet, a missing column or data older than the client's limit is an error,
 * and the site then says "ask us", never "free".
 */
import { parseCsv, parseSheetTime } from "../../../core/lib/sheet.js";
import { addDays } from "../../../core/lib/hours.js";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** The only columns each published tab may have. A published tab is public, so anything else (a name, a note) is a
 *  mistake: the reader refuses the whole tab and the page says "ask us" until it's moved to an unpublished tab. */
export const AVAILABILITY_COLUMNS = ["car", "from", "to", "updated_at"];
export const DEPOSIT_COLUMNS = ["ref", "status", "date", "updated_at"];
/** @param {string[]} head @param {string[]} allowed */
const onlyColumns = (head, allowed) => head.filter(Boolean).every((h) => allowed.includes(h)) && allowed.every((k) => head.includes(k));
/** Nothing in any other column, even one with no header: a name typed there would still be public.
 *  @param {string[]} head @param {string[][]} rows @param {string[]} allowed */
const nothingElse = (head, rows, allowed) => rows.every((r) => r.every((cell, i) => allowed.includes(head[i] ?? "") || cell.trim() === ""));
const MAX_ROW_DAYS = 400;

/** @typedef {{ ok: true, taken: Record<string, string[]>, checkedAt: number } | { ok: false }} Availability */

/**
 * Availability tab: one row per hire or blocked spell: `car,from,to,updated_at` (dates YYYY-MM-DD, `to` included).
 * `updated_at` is when the client last touched that row; the newest one must be within `staleAfterHours`.
 * @param {string} csv @param {number} nowMs @param {string} timeZone @param {number} staleAfterHours
 * @returns {Availability}
 */
export function availabilityFromCsv(csv, nowMs, timeZone, staleAfterHours) {
  const rows = parseCsv(csv);
  const head = rows.shift()?.map((h) => h.trim().toLowerCase()) ?? [];
  const col = (/** @type {string} */ k) => head.indexOf(k);
  if (!onlyColumns(head, AVAILABILITY_COLUMNS) || !nothingElse(head, rows, AVAILABILITY_COLUMNS)) return { ok: false };
  const [c, f, t, u] = AVAILABILITY_COLUMNS.map(col);
  /** @type {Record<string, Set<string>>} */ const taken = {};
  let newest = NaN;
  for (const r of rows) {
    const at = parseSheetTime(r[u] ?? "", timeZone);
    if (Number.isFinite(at) && (!Number.isFinite(newest) || at > newest)) newest = at;
    const id = (r[c] ?? "").trim().toLowerCase();
    const from = (r[f] ?? "").trim();
    const to = (r[t] ?? "").trim() || from;
    if (!id) continue;
    if (!DATE.test(from) || !DATE.test(to) || to < from) return { ok: false }; // a row we can't read: never guess
    const set = (taken[id] ??= new Set());
    for (let d = from, n = 0; d <= to && n < MAX_ROW_DAYS; d = addDays(d, 1), n++) set.add(d);
  }
  if (!Number.isFinite(newest) || nowMs - newest > staleAfterHours * 3_600_000 || newest - nowMs > 3_600_000) return { ok: false };
  return { ok: true, taken: Object.fromEntries(Object.entries(taken).map(([k, s]) => [k, [...s].sort()])), checkedAt: newest };
}

/**
 * The weekend a customer means by "this weekend": the coming Saturday and Sunday (today and tomorrow on a Saturday,
 * just today on a Sunday). @param {{ date: string, weekday: number }} now
 */
export function thisWeekend(now) {
  if (now.weekday === 0) return [now.date];
  const sat = addDays(now.date, 6 - now.weekday);
  return [sat, addDays(sat, 1)];
}

/**
 * "Free this weekend?" for one car: "free" only when the sheet was read and neither day is taken; "taken" when either
 * is; otherwise "ask" (no sheet, an error, or old data).
 * @param {Availability|null} a @param {string} carId @param {string[]} weekend
 * @returns {"free"|"taken"|"ask"}
 */
export function weekendState(a, carId, weekend) {
  if (!a || !a.ok) return "ask";
  const days = a.taken[carId] ?? [];
  return weekend.some((d) => days.includes(d)) ? "taken" : "free";
}

/** The deposit stages, in order, and how the page says each. */
export const DEPOSIT_STAGES = /** @type {const} */ (["held", "checked", "returned"]);
export const DEPOSIT_WORDS = { held: "Held", checked: "Car checked", returned: "Returned" };

/** A deposit reference as typed: letters, digits and dashes, upper case. @param {string} s */
export const cleanRef = (s) => String(s ?? "").toUpperCase().trim().replace(/\s+/g, "-").replace(/[^A-Z0-9-]/g, "").slice(0, 32);

/**
 * Deposits tab: exactly `ref,status,date,updated_at`. A published tab is public, so it may hold nothing else: a tab
 * with any other column (a name, a note) is refused and the page says "ask us". Returns the stage reached and its date, or "unknown" for a reference not on the sheet.
 * @param {string} csv @param {string} ref @param {number} nowMs @param {string} timeZone @param {number} staleAfterHours
 * @returns {{ ok: true, stage: number, date: string } | { ok: false, reason: "unknown"|"error" }}
 */
export function depositFromCsv(csv, ref, nowMs, timeZone, staleAfterHours) {
  const rows = parseCsv(csv);
  const head = rows.shift()?.map((h) => h.trim().toLowerCase()) ?? [];
  if (!onlyColumns(head, DEPOSIT_COLUMNS) || !nothingElse(head, rows, DEPOSIT_COLUMNS)) return { ok: false, reason: "error" };
  const [r, s, d, u] = DEPOSIT_COLUMNS.map((k) => head.indexOf(k));
  // Dashes and spaces don't matter when matching: "dh 4821" finds DH-4821.
  const key = (/** @type {string} */ v) => cleanRef(v).replace(/-/g, "");
  const want = key(ref);
  const row = rows.find((x) => want !== "" && key(x[r] ?? "") === want);
  if (!row) return { ok: false, reason: "unknown" };
  const at = parseSheetTime(row[u] ?? "", timeZone);
  const stage = DEPOSIT_STAGES.indexOf(/** @type {any} */ ((row[s] ?? "").trim().toLowerCase()));
  const date = (row[d] ?? "").trim();
  if (stage < 0 || !DATE.test(date) || !Number.isFinite(at)) return { ok: false, reason: "error" };
  // A returned deposit is final; a held or checked one must be recent, or the page says to ask.
  if (stage < DEPOSIT_STAGES.length - 1 && nowMs - at > staleAfterHours * 3_600_000) return { ok: false, reason: "error" };
  return { ok: true, stage, date };
}
