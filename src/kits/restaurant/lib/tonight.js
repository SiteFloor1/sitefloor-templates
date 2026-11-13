// @ts-check
/**
 * Today's specials, sold-out dishes and walk-in tables, from the restaurant's published Google Sheet (CSV):
 *
 *   kind,name,price,note,updated_at
 *   tables,few,,Bar seats free,2026-10-29 18:40
 *   special,Lamb neck shawarma,19,Until it's gone,2026-10-29 11:05
 *   soldout,lamb-shoulder,,,2026-10-29 19:12
 *
 * Cafés add three optional kinds to the same sheet (restaurants that don't use them see no change):
 *
 *   fresh,cardamom-knot,,,2026-10-29 08:10     a tray just came out: its time is the row's updated_at
 *   busy,steady,,About a 4-minute queue,2026-10-29 08:40
 *   board,Guest roaster,,Round Hill: a washed Ethiopian on filter,2026-10-27 07:30
 *
 * Fails closed. A row is only used on the day it was updated (specials don't carry over to tomorrow);
 * the walk-in tables and busy rows are only used while they're fresher than `staleAfterMinutes`; board
 * rows are the one exception to "today only" and show for seven days (each card says since when); an
 * unreadable sheet returns { ok: false } and the page says nothing rather than something that may be wrong.
 * A bake marked "fresh" after it was marked "soldout" is back on the counter.
 */
import { parseCsv, parseSheetTime } from "../../../core/lib/sheet.js";
import { zonedNow } from "../../../core/lib/hours.js";

export const TABLE_STATES = /** @type {const} */ (["free", "few", "full", "bar"]);
/** @typedef {(typeof TABLE_STATES)[number]} TableState */
/** @typedef {{ name: string, price: number|null, note: string }} Special */
export const BUSY_STATES = /** @type {const} */ (["quiet", "steady", "busy", "queue"]);
/** @typedef {(typeof BUSY_STATES)[number]} BusyState */
/** @typedef {{ name: string, at: number }} Fresh a bake's id or name (lowercase) and when the latest tray came out */
/** @typedef {{ label: string, text: string, at: number }} BoardCard */
/** @typedef {{ ok: true, tables: { state: TableState, note: string, updatedAt: number }|null, specials: Special[], soldOut: string[], fresh: Fresh[], busy: { state: BusyState, note: string, updatedAt: number }|null, board: BoardCard[], updatedAt: number } | { ok: false }} Tonight */

/** How long a board card stays up. */
export const BOARD_DAYS = 7;

/** Words for each walk-in state. */
export const TABLE_WORDS = {
  free: "Walk-in tables free now",
  few: "A few walk-in tables left",
  full: "Full right now",
  bar: "Bar seats only",
};

/** @typedef {{ kind: string, name: string, note: string, price: string, at: number }} Row */
/** @typedef {{ specials: Special[], outAt: Map<string, number>, freshAt: Map<string, number>, board: Map<string, BoardCard>, tables: { state: TableState, note: string, updatedAt: number }|null, busy: { state: BusyState, note: string, updatedAt: number }|null }} Acc */

/**
 * @param {string} csv @param {number} nowMs @param {string} timeZone @param {number} staleAfterMinutes
 * @returns {Tonight}
 */
export function tonightFromCsv(csv, nowMs, timeZone, staleAfterMinutes) {
  const rows = parseCsv(csv);
  const head = (rows[0] ?? []).map((h) => h.trim().toLowerCase());
  const col = (/** @type {string} */ k) => head.indexOf(k);
  if (col("kind") < 0 || col("name") < 0 || col("updated_at") < 0) return { ok: false };
  const today = zonedNow(new Date(nowMs), timeZone).date;
  /** @type {Acc} */
  const acc = { specials: [], outAt: new Map(), freshAt: new Map(), board: new Map(), tables: null, busy: null };
  let updatedAt = 0;
  for (const r of rows.slice(1)) {
    const cell = (/** @type {string} */ k) => (col(k) < 0 ? "" : (r[col(k)] ?? "").trim());
    const at = parseSheetTime(cell("updated_at"), timeZone);
    if (!Number.isFinite(at) || at > nowMs + 5 * 60_000 || !cell("name")) continue; // unreadable, in the future or nameless: never shown
    /** @type {Row} */ const row = { kind: cell("kind").toLowerCase(), name: cell("name"), note: cell("note"), price: cell("price"), at };
    // Board cards stay up for a week; everything else is only used on the day it was updated.
    const used = row.kind === "board" ? addBoard(acc, row, nowMs) : zonedNow(new Date(at), timeZone).date === today && addRow(acc, row, nowMs - at <= staleAfterMinutes * 60_000);
    if (used) updatedAt = Math.max(updatedAt, at);
  }
  const { outAt, freshAt } = acc;
  // Sold out unless a later tray came out; a fresh tray after "sold out" puts it back on the counter.
  const soldOut = [...outAt].filter(([k, t]) => (freshAt.get(k) ?? 0) <= t).map(([k]) => k);
  const fresh = [...freshAt].filter(([k, t]) => (outAt.get(k) ?? -1) < t).map(([name, at]) => ({ name, at }));
  return { ok: true, tables: acc.tables, specials: acc.specials, soldOut, fresh, busy: acc.busy, board: [...acc.board.values()].sort((a, b) => b.at - a.at), updatedAt };
}

/** A board card: the newest for each label, for a week. @param {Acc} acc @param {Row} r @param {number} nowMs */
function addBoard(acc, r, nowMs) {
  if (nowMs - r.at > BOARD_DAYS * 86_400_000 || !r.note) return false;
  const key = r.name.toLowerCase();
  if ((acc.board.get(key)?.at ?? -1) < r.at) acc.board.set(key, { label: r.name, text: r.note, at: r.at });
  return true;
}

/**
 * Today's row of any other kind. The walk-in tables and busy rows only count while fresh.
 * @param {Acc} acc @param {Row} r @param {boolean} fresh @returns {boolean} whether the row was used
 */
function addRow(acc, r, fresh) {
  const key = r.name.toLowerCase();
  const latest = (/** @type {Map<string, number>} */ m) => m.set(key, Math.max(m.get(key) ?? 0, r.at));
  if (r.kind === "special") {
    const p = r.price.replace(/^£/, "");
    acc.specials.push({ name: r.name, price: /^\d+(\.\d{1,2})?$/.test(p) ? Number(p) : null, note: r.note });
  } else if (r.kind === "soldout") latest(acc.outAt);
  else if (r.kind === "fresh") latest(acc.freshAt);
  else if (r.kind === "tables") {
    if (!TABLE_STATES.includes(/** @type {TableState} */ (key)) || !fresh) return false;
    if (!acc.tables || r.at > acc.tables.updatedAt) acc.tables = { state: /** @type {TableState} */ (key), note: r.note, updatedAt: r.at };
  } else if (r.kind === "busy") {
    if (!BUSY_STATES.includes(/** @type {BusyState} */ (key)) || !fresh) return false;
    if (!acc.busy || r.at > acc.busy.updatedAt) acc.busy = { state: /** @type {BusyState} */ (key), note: r.note, updatedAt: r.at };
  } else return false;
  return true;
}

/**
 * Is this dish sold out? The sheet may name it by id ("lamb-shoulder") or by name ("Lamb shoulder").
 * @param {string[]} soldOut lowercase @param {{ id: string, name: string }} dish
 */
export function isSoldOut(soldOut, dish) {
  return soldOut.includes(dish.id.toLowerCase()) || soldOut.includes(dish.name.toLowerCase());
}

/** "Updated 4 min ago". @param {number} ms */
export function ago(ms) {
  const m = Math.max(1, Math.round(ms / 60_000));
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return `${h} hour${h === 1 ? "" : "s"} ago`;
}
