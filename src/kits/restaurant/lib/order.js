// @ts-check
/**
 * Takeaway orders: a running total in pence (no rounding errors), the allergens in the order and the
 * WhatsApp message. The FSA asks for allergen information before a distance order and again at
 * collection, so the message lists them and asks the restaurant to confirm.
 */
import { allergenNames } from "../../../core/lib/allergens.js";

/** @typedef {{ id: string, name: string, price: number, allergens?: string[], leadDays?: number }} Dish */

/** £ from pence: "£12", "£12.50". @param {number} pence */
export function money(pence) {
  const p = Math.round(pence);
  return p % 100 === 0 ? `£${(p / 100).toLocaleString("en-GB")}` : `£${(p / 100).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** @param {number} pounds */
export const toPence = (pounds) => Math.round(pounds * 100);

/**
 * @param {Record<string, number>} qty dish id → how many
 * @param {Dish[]} dishes
 * @returns {{ lines: { dish: Dish, qty: number, pence: number }[], totalPence: number, count: number, allergens: string[] }}
 */
export function priceOrder(qty, dishes) {
  const lines = dishes.filter((d) => (qty[d.id] ?? 0) > 0).map((d) => ({ dish: d, qty: Math.floor(qty[d.id]), pence: toPence(d.price) * Math.floor(qty[d.id]) }));
  const totalPence = lines.reduce((s, l) => s + l.pence, 0);
  const allergens = allergenNames({ allergens: [...new Set(lines.flatMap((l) => l.dish.allergens ?? []))] });
  return { lines, totalPence, count: lines.reduce((s, l) => s + l.qty, 0), allergens };
}

/**
 * @param {ReturnType<typeof priceOrder>} order @param {{ opening: string, time: string, name?: string, notes?: string }} o
 */
export function orderMessage(order, o) {
  return [
    o.opening,
    "",
    ...order.lines.map((l) => `${l.qty} × ${l.dish.name}, ${money(l.pence)}`),
    `Total: ${money(order.totalPence)}`,
    `Collection: ${o.time}`,
    o.name ? `Name: ${o.name}` : "",
    order.allergens.length ? `Allergens in this order: ${order.allergens.join(", ")}` : "No allergens listed in this order",
    o.notes ? `Notes: ${o.notes}` : "",
    "",
    "Please confirm the order, the time and the allergens when you reply.",
  ].filter((l, i, a) => l !== "" || (a[i - 1] !== "" && i > 0)).join("\n").trim();
}

/**
 * Collection days for an order of made-to-order cakes: the earliest is today plus the longest lead time in the
 * order (each dish's own leadDays), then every open day up to daysAhead. Days the shop is shut are skipped.
 * @param {{ dish: { leadDays?: number } }[]} lines @param {string} today YYYY-MM-DD
 * @param {(date: string) => boolean} isOpen @param {number} daysAhead
 * @returns {{ lead: number, days: string[] }}
 */
export function collectionDays(lines, today, isOpen, daysAhead) {
  const lead = lines.reduce((m, l) => Math.max(m, l.dish.leadDays ?? 0), 0);
  /** @type {string[]} */ const days = [];
  const base = new Date(`${today}T12:00:00Z`);
  for (let i = lead; i <= Math.max(lead, daysAhead); i++) {
    const d = new Date(base.getTime() + i * 864e5).toISOString().slice(0, 10);
    if (isOpen(d)) days.push(d);
  }
  return { lead, days };
}

/**
 * The deposit an order asks for, if any: a fixed amount (the shop's own Stripe Payment Link is set to it), only when
 * the order reaches the shop's threshold.
 * @param {number} totalPence @param {{ from: number, amount: number, link: string }|undefined} deposit
 * @returns {{ pence: number, link: string }|null}
 */
export function depositFor(totalPence, deposit) {
  if (!deposit || totalPence < Math.round(deposit.from * 100)) return null;
  return { pence: Math.round(deposit.amount * 100), link: deposit.link };
}
