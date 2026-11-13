// @ts-check
/**
 * Take-home gelato: a tub of the shop's size, up to its number of flavours, priced from its table. No DOM.
 */
import { gbp } from "../../../core/lib/text.js";

/** @typedef {{ id: string, name: string, price: number, flavours: number }} Tub */

/** @param {Tub} tub @param {{ id: string, name: string }[]} picked in the order chosen */
export function tubQuote(tub, picked) {
  const flavours = picked.slice(0, tub.flavours);
  return { tub, flavours, full: flavours.length === tub.flavours, left: tub.flavours - flavours.length, price: tub.price };
}

/** @param {ReturnType<typeof tubQuote>} q @param {{ business: string, when: string }} o */
export function tubText(q, o) {
  return [
    `Hi ${o.business}, I'd like a ${q.tub.name} to take home:`,
    "",
    ...q.flavours.map((f) => f.name),
    `Price on your site: ${gbp(q.price)}`,
    `Collection: ${o.when}`,
    "Please confirm.",
  ].join("\n");
}
