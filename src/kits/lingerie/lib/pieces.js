// @ts-check
/**
 * Pieces and collections: how a piece is named (Collection · Style · Colour), its swatches, and the WhatsApp messages
 * that carry pieces somewhere (set aside in my size, a hint to someone, the tray for a fitting). Prices and sizes are
 * always the shop's own; nothing here works one out.
 */
import { gbp } from "../../../core/lib/text.js";

/** @typedef {{ id: string, name: string, hex: string }} Colour */
/** @typedef {{ id: string, name: string, colours: Colour[] }} Collection */
/** @typedef {{ id: string, collection: string, style: string, colour: string, colours?: string[], price: number, category: string }} Piece */

/** @param {Collection[]} collections @param {string} id */
export function collectionOf(collections, id) {
  return collections.find((c) => c.id === id);
}

/** A piece's colour as { id, name, hex }. @param {Collection[]} collections @param {Piece} p @param {string} [colourId] */
export function colourOf(collections, p, colourId = p.colour) {
  return collectionOf(collections, p.collection)?.colours.find((c) => c.id === colourId);
}

/** "Calloway · Balconette · Noir". @param {Collection[]} collections @param {Piece} p @param {string} [colourId] */
export function pieceName(collections, p, colourId) {
  return [collectionOf(collections, p.collection)?.name ?? "", p.style, colourOf(collections, p, colourId)?.name ?? ""].filter(Boolean).join(" · ");
}

/** Every colour a piece comes in, its own first, as swatches. @param {Collection[]} collections @param {Piece} p @returns {Colour[]} */
export function swatches(collections, p) {
  const ids = [p.colour, ...(p.colours ?? []).filter((c) => c !== p.colour)];
  return ids.map((id) => colourOf(collections, p, id)).filter((c) => c !== undefined);
}

/**
 * Pieces matching every filter given, in the shop's order.
 * @template {Piece & { newSeason?: boolean }} T
 * @param {T[]} pieces @param {{ collection?: string, category?: string, newSeason?: boolean, ids?: string[] }} f
 * @returns {T[]}
 */
export function piecesWhere(pieces, f) {
  if (f.ids) return f.ids.map((id) => pieces.find((p) => p.id === id)).filter((p) => p !== undefined);
  return pieces.filter((p) => (f.collection === undefined || p.collection === f.collection)
    && (f.category === undefined || p.category === f.category)
    && (f.newSeason === undefined || Boolean(p.newSeason) === f.newSeason));
}

/** @param {string} s */
const line = (s) => s.replace(/\s+/g, " ").trim();

/**
 * "Set this aside in my size": the piece, the colour, the size she gives (or "please help with my size").
 * @param {{ business: string, piece: string, price: number, size?: string, when?: string }} o
 */
export function setAsideText(o) {
  return [
    `Hello ${o.business}, could you set this aside for me?`,
    `${o.piece}, ${gbp(o.price)}.`,
    o.size ? `My size: ${line(o.size)}.` : "I'm not sure of my size; could you help?",
    o.when ? `I'd like to come in ${line(o.when)}.` : "",
  ].filter(Boolean).join("\n");
}

/**
 * Drop a hint: a message she sends to whoever she likes (WhatsApp asks whom), with the piece, its price, her size if she
 * chooses to give it, and the link to the piece. The shop is named so the buyer knows where to go.
 * @param {{ business: string, piece: string, price: number, size?: string, url: string, note?: string }} o
 */
export function hintText(o) {
  return [
    o.note ? line(o.note) : "Thinking of something for me?",
    `${o.piece} from ${o.business}, ${gbp(o.price)}.`,
    o.size ? `My size is ${line(o.size)}.` : "",
    o.url,
  ].filter(Boolean).join("\n");
}

/**
 * The tray: up to `max` pieces she'd like ready at her fitting, sent with the request.
 * @param {string[]} names @param {number} [max]
 */
export function trayLines(names, max = 3) {
  return names.slice(0, max).map((n, i) => `${i + 1}. ${n}`);
}
