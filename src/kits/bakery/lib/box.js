// @ts-check
/**
 * The box and the tasting flight: the shop's flat price for a box of n, what's in it and its allergens, the order
 * message, the gift link the sender passes on, and the tasting order. No DOM; the browser modules use these.
 */
import { gbp } from "../../../core/lib/text.js";

/** @typedef {{ id: string, name: string, allergens: string[], notes?: string, tasteOrder?: number }} Piece */
/** @typedef {{ n: number, price: number, payLink?: string }} Size */
/** @typedef {{ n: number, p: string[], c: string, t: string, f: string, w: string }} Gift what the gift link carries */

/** Columns × rows for each box size. */
export const GRIDS = /** @type {Record<number, [number, number]>} */ ({ 4: [2, 2], 6: [3, 2], 9: [3, 3], 12: [4, 3], 16: [4, 4] });

/**
 * @param {Size} size @param {(Piece|null)[]} places
 * @returns {{ n: number, filled: number, full: boolean, price: number, pieces: Piece[], allergens: string[] }}
 */
export function boxQuote(size, places) {
  const pieces = /** @type {Piece[]} */ (places.slice(0, size.n).filter(Boolean));
  return {
    n: size.n, filled: pieces.length, full: pieces.length === size.n, price: size.price, pieces,
    allergens: [...new Set(pieces.flatMap((p) => p.allergens))].sort(),
  };
}

/** "2 × Gianduja, Dark 70%". @param {Piece[]} pieces */
export function countNames(pieces) {
  /** @type {Map<string, number>} */ const n = new Map();
  for (const p of pieces) n.set(p.name, (n.get(p.name) ?? 0) + 1);
  return [...n].map(([name, k]) => (k > 1 ? `${k} × ${name}` : name));
}

/**
 * The order on WhatsApp, for the shop to confirm.
 * @param {ReturnType<typeof boxQuote>} q
 * @param {{ business: string, when: string, card: string, gift: { to: string, from: string } | null, allergenNames: string[] }} o
 */
export function boxText(q, o) {
  return [
    `Hi ${o.business}, I'd like a box of ${q.n}${o.gift ? " as a gift" : ""}:`,
    "",
    ...countNames(q.pieces),
    `Price on your site: ${gbp(q.price)}`,
    ...(o.card.trim() ? [`Card: "${o.card.trim()}"`] : []),
    ...(o.gift ? [`For ${o.gift.to.trim() || "a friend"}, from ${o.gift.from.trim() || "me"}. They'll collect it.`] : []),
    `Collection: ${o.when}`,
    "",
    o.allergenNames.length ? `It contains: ${o.allergenNames.join(", ")}.` : "None of it lists an allergen.",
    "Please confirm.",
  ].join("\n");
}

/** URL-safe base64 of UTF-8 text. @param {string} s */
const b64 = (s) => btoa(String.fromCharCode(...new TextEncoder().encode(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
/** @param {string} s */
const unb64 = (s) => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0)));

/** @param {Gift} g */
export function giftEncode(g) {
  return b64(JSON.stringify({ n: g.n, p: g.p, c: g.c.slice(0, 300), t: g.t.slice(0, 40), f: g.f.slice(0, 40), w: g.w.slice(0, 80) }));
}

/**
 * Reads a gift link back. Anything that isn't a box this shop sells, or names a piece it doesn't make, gives null:
 * the page then says the link isn't complete rather than showing a box that was never ordered.
 * @param {string} code @param {number[]} sizes @param {Set<string>} pieceIds @returns {Gift|null}
 */
export function giftDecode(code, sizes, pieceIds) {
  try {
    const g = JSON.parse(unb64(code));
    if (!sizes.includes(g.n) || !Array.isArray(g.p) || g.p.length !== g.n || g.p.some((/** @type {any} */ id) => !pieceIds.has(id))) return null;
    for (const k of ["c", "t", "f", "w"]) if (typeof g[k] !== "string") return null;
    return { n: g.n, p: g.p, c: g.c.slice(0, 300), t: g.t.slice(0, 40), f: g.f.slice(0, 40), w: g.w.slice(0, 80) };
  } catch { return null; }
}

/**
 * The message the sender passes on to whoever the box is for.
 * @param {{ business: string, to: string, from: string, when: string, link: string }} o
 */
export function giftShareText(o) {
  return `${o.to.trim() ? `${o.to.trim()}, ` : ""}there's a box waiting for you at ${o.business}, ${o.when}. From ${o.from.trim() || "me"}.\n${o.link}`;
}

/**
 * The tasting flight: the pieces chosen, put in the order they're best tasted (the shop's tasteOrder, lightest first).
 * @template {Piece} T @param {T[]} chosen @returns {T[]}
 */
export function flightOrder(chosen) {
  return [...chosen].sort((a, b) => (a.tasteOrder ?? 99) - (b.tasteOrder ?? 99) || a.name.localeCompare(b.name));
}

/** @param {{ business: string, pieces: Piece[], price: number, when: string }} o */
export function flightText(o) {
  return [
    `Hi ${o.business}, I'd like a tasting flight of ${o.pieces.length}:`,
    "",
    ...flightOrder(o.pieces).map((p, i) => `${i + 1}. ${p.name}`),
    `Price on your site: ${gbp(o.price)}`,
    `Collection: ${o.when}`,
    "Please confirm.",
  ].join("\n");
}
