// @ts-check
/**
 * The pâtisserie window and the house box: a box of a set size filled piece by piece from the day's window (pieces
 * sold out on the sheet can't go in), and the message that goes with the shop's own Stripe link for that box.
 */
import { money, toPence } from "./order.js";
import { addDays, rangesFor, toMinutes } from "../../../core/lib/hours.js";

/** "Thursday 29 October" for a YYYY-MM-DD date. @param {string} iso */
export const longDate = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

/**
 * Days a box can be collected: the shop's next open days, today only while there's still `margin` minutes before it
 * closes. Each has the date to send ("Thursday 29 October") and a label for the list ("Tomorrow, Thursday 29 October").
 * @param {import("../../../core/lib/hours.js").Hours} hours @param {{ date: string, minutes: number }} now
 * @param {{ count?: number, margin?: number }} [o]
 * @returns {{ date: string, text: string, label: string }[]}
 */
export function collectDays(hours, now, o = {}) {
  const count = o.count ?? 7, margin = o.margin ?? 30;
  /** @type {{ date: string, text: string, label: string }[]} */ const out = [];
  for (let i = 0; i < 21 && out.length < count; i++) {
    const date = addDays(now.date, i);
    const ranges = rangesFor(hours, date).ranges;
    if (!ranges.length) continue;
    if (i === 0) {
      const close = Math.max(...ranges.map((r) => { const s = toMinutes(r[0]), e = toMinutes(r[1]); return e <= s ? e + 1440 : e; }));
      if (now.minutes > close - margin) continue;
    }
    const text = longDate(date);
    out.push({ date, text, label: i === 0 ? `Today, ${text}` : i === 1 ? `Tomorrow, ${text}` : text });
  }
  return out;
}

/** @typedef {{ id: string, name: string, price: number }} Piece */
/** @typedef {{ id: string, name: string, count: number, price: number, link: string }} Box */

/**
 * What's in the box so far: the pieces in order, how many are left to choose, and whether it's full.
 * @param {Record<string, number>} chosen piece id → how many @param {Piece[]} pieces @param {Box} box
 * @returns {{ lines: { piece: Piece, qty: number }[], count: number, left: number, full: boolean }}
 */
export function boxContents(chosen, pieces, box) {
  const lines = pieces.filter((p) => (chosen[p.id] ?? 0) > 0).map((p) => ({ piece: p, qty: Math.floor(chosen[p.id]) }));
  const count = lines.reduce((n, l) => n + l.qty, 0);
  return { lines, count, left: Math.max(0, box.count - count), full: count >= box.count };
}

/**
 * Add or take one piece, never past the box's size and never a sold-out piece.
 * @param {Record<string, number>} chosen @param {string} id @param {1|-1} step @param {Box} box @param {string[]} [out] ids sold out
 * @returns {Record<string, number>}
 */
export function boxStep(chosen, id, step, box, out = []) {
  const now = Object.values(chosen).reduce((n, v) => n + v, 0);
  if (step > 0 && (now >= box.count || out.includes(id))) return chosen;
  const next = { ...chosen, [id]: Math.max(0, (chosen[id] ?? 0) + step) };
  if (!next[id]) delete next[id];
  return next;
}

/**
 * The WhatsApp message for a box: the box and its price, each piece, when to collect, and that it's paid by card.
 * @param {{ opening: string, box: Box, lines: { piece: Piece, qty: number }[], when: string, name?: string }} o
 */
export function boxMessage(o) {
  return [
    o.opening,
    "",
    `${o.box.name}, ${money(toPence(o.box.price))}`,
    ...o.lines.map((l) => `${l.qty} × ${l.piece.name}`),
    `To collect: ${o.when}`,
    o.name ? `Name: ${o.name}` : "",
    "I've paid by card online.",
  ].filter((l, i) => l !== "" || i === 1).join("\n").trim();
}
