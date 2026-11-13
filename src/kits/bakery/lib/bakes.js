// @ts-check
/**
 * Tonight's counter, from the shop's published Google Sheet (CSV). One sheet answers three questions:
 * what's left on the counter, can we sit in, and which days are already full for celebration cakes.
 *
 *   kind,item,status,note,updated_at,left (optional: how many are left)
 *   dessert,pistachio-kunafa,low,,2026-10-29 21:10
 *   dessert,basque-cheesecake,sold out,Back tomorrow at 2,2026-10-29 20:42
 *   seats,,filling,Upstairs is free,2026-10-29 21:05
 *   cakes,2026-11-07,full,,2026-10-28 09:00
 *   gelato,pistachio,sold out,,2026-10-29 16:10
 *   kitchen,,,"Tempering raspberry, out at 4",2026-10-29 13:40
 *
 * Fails closed. A dessert or seats row is only used on the day it was updated (tonight's sold-out never carries over to
 * tomorrow); "low" and every seats row go quiet once older than `staleAfterMinutes` ("sold out" stands for the rest
 * of that day: it doesn't come back). A cakes row names a future date the shop can't take a cake for; it holds until
 * that date passes. Unreadable or future times are ignored, and an unreadable sheet returns { ok: false }, so the page
 * says nothing rather than something that may be wrong. A kitchen row is one line about what's being made today; it
 * goes quiet after six hours.
 */
import { parseCsv, parseSheetTime } from "../../../core/lib/sheet.js";
import { zonedNow } from "../../../core/lib/hours.js";

export const STATUSES = /** @type {const} */ (["available", "low", "sold out"]);
/** @typedef {(typeof STATUSES)[number]} Status */
export const SEATS = /** @type {const} */ (["plenty", "filling", "full", "queue"]);
/** @typedef {(typeof SEATS)[number]} Seats */
/** @typedef {{ status: Status, note: string, updatedAt: number, left: number|null }} ItemState left: how many are left, if the shop says */
/**
 * @typedef {{ ok: true, items: Record<string, ItemState>, seats: { state: Seats, note: string, updatedAt: number }|null,
 *   kitchen: { note: string, updatedAt: number }|null, fullDays: string[], updatedAt: number } | { ok: false }} Bakes
 */
export const KITCHEN_HOURS = 6;

/** What each state says on the page. */
export const STATUS_WORDS = { available: "On the counter", low: "A few left", "sold out": "Sold out today" };
export const SEATS_WORDS = { plenty: "Plenty of seats", filling: "Filling up", full: "Full inside, takeaway only", queue: "A short queue for seats" };

/**
 * @param {string} csv @param {number} nowMs @param {string} timeZone @param {number} staleAfterMinutes
 * @returns {Bakes}
 */
export function bakesFromCsv(csv, nowMs, timeZone, staleAfterMinutes) {
  const rows = parseCsv(csv);
  const head = (rows[0] ?? []).map((h) => h.trim().toLowerCase());
  const col = (/** @type {string} */ k) => head.indexOf(k);
  if (col("kind") < 0 || col("item") < 0 || col("status") < 0 || col("updated_at") < 0) return { ok: false };
  const today = zonedNow(new Date(nowMs), timeZone).date;
  const stale = staleAfterMinutes * 60_000;
  /** @type {Record<string, ItemState>} */ const items = {};
  /** @type {{ state: Seats, note: string, updatedAt: number }|null} */ let seats = null;
  /** @type {{ note: string, updatedAt: number }|null} */ let kitchen = null;
  /** @type {Set<string>} */ const fullDays = new Set();
  let updatedAt = 0;
  for (const r of rows.slice(1)) {
    const cell = (/** @type {string} */ k) => (col(k) < 0 ? "" : (r[col(k)] ?? "").trim());
    const at = parseSheetTime(cell("updated_at"), timeZone);
    if (!Number.isFinite(at) || at > nowMs + 5 * 60_000) continue;
    const kind = cell("kind").toLowerCase();
    const status = cell("status").toLowerCase().replace(/\s+/g, " ").replace("soldout", "sold out");
    const note = cell("note");
    if (kind === "cakes") {
      const day = cell("item");
      if (/^\d{4}-\d{2}-\d{2}$/.test(day) && day >= today && (status === "full" || status === "closed")) fullDays.add(day);
      continue;
    }
    // Everything else is about tonight only.
    if (zonedNow(new Date(at), timeZone).date !== today) continue;
    if (kind === "dessert" || kind === "gelato") { // a gelato flavour works like a piece: on, a few left, or off for today
      const id = cell("item").toLowerCase();
      if (!id || !STATUSES.includes(/** @type {Status} */ (status))) continue;
      if (status !== "sold out" && nowMs - at > stale) continue;
      const prev = items[id];
      const n = cell("left");
      const left = status === "sold out" ? 0 : /^\d{1,3}$/.test(n) && Number(n) > 0 ? Number(n) : null;
      if (!prev || at > prev.updatedAt) items[id] = { status: /** @type {Status} */ (status), note, updatedAt: at, left };
    } else if (kind === "seats") {
      if (!SEATS.includes(/** @type {Seats} */ (status)) || nowMs - at > stale) continue;
      if (!seats || at > seats.updatedAt) seats = { state: /** @type {Seats} */ (status), note, updatedAt: at };
    } else if (kind === "kitchen") {
      if (!note || nowMs - at > KITCHEN_HOURS * 3_600_000) continue;
      if (!kitchen || at > kitchen.updatedAt) kitchen = { note: note.slice(0, 90), updatedAt: at };
    } else continue;
    updatedAt = Math.max(updatedAt, at);
  }
  return { ok: true, items, seats, kitchen, fullDays: [...fullDays].sort(), updatedAt };
}

/**
 * The state of one item: by its id, or by its name as the shop typed it.
 * @param {Bakes} b @param {{ id: string, name: string }} item @returns {ItemState|null}
 */
export function stateOf(b, item) {
  if (!b.ok) return null;
  return b.items[item.id.toLowerCase()] ?? b.items[item.name.toLowerCase()] ?? null;
}

/**
 * What a piece's mark says: a count when the shop gives one ("Only 2 left today", "6 left today"), else the status.
 * @param {ItemState} s
 */
export function leftWords(s) {
  if (s.status === "sold out") return STATUS_WORDS["sold out"];
  if (s.left !== null) return s.left <= 3 ? `Only ${s.left} left today` : `${s.left} left today`;
  return STATUS_WORDS[s.status];
}

/** "Updated 4 min ago". @param {number} ms */
export function ago(ms) {
  const m = Math.max(1, Math.round(ms / 60_000));
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return `${h} hour${h === 1 ? "" : "s"} ago`;
}
