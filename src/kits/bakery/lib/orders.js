// @ts-check
/**
 * Collection requests, the dessert box and the party calculator: the small sums and messages behind them. Everything
 * comes from the shop's own menu and settings; nothing is guessed.
 */
import { hasDiet } from "../../../core/lib/allergens.js";
import { addDays, rangesFor, toMinutes, formatTime12 } from "../../../core/lib/hours.js";
import { gbp } from "../../../core/lib/text.js";

/**
 * Does an item pass the visitor's filters? Every chosen mark must be on it, and none of the avoided allergens in it.
 * @param {{ allergens: string[], diets?: string[] }} item @param {{ diets: string[], avoid: string[] }} f
 */
export function passes(item, f) {
  return f.diets.every((d) => hasDiet(item, d)) && !f.avoid.some((a) => item.allergens.includes(a));
}

/**
 * Collection times on a day, every `step` minutes from opening (or now plus the shop's preparation time) until
 * 15 minutes before closing. Late opening past midnight is handled: a range ending "01:00" runs on.
 * @param {import("../../../core/lib/hours.js").Hours} hours @param {string} day
 * @param {{ date: string, minutes: number }} now @param {{ prepMinutes: number, step: number }} o
 * @returns {string[]} "HH:MM", possibly past midnight as "24:30"
 */
export function collectionSlots(hours, day, now, o) {
  /** @type {string[]} */ const out = [];
  const earliest = day === now.date ? now.minutes + o.prepMinutes : -1;
  for (const r of rangesFor(hours, day).ranges) {
    const start = toMinutes(r[0]);
    let end = toMinutes(r[1]);
    if (end <= start) end += 1440;
    const first = Math.ceil(Math.max(start, earliest) / o.step) * o.step;
    for (let m = first; m <= end - 15; m += o.step) out.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
  }
  return out;
}

/** "9:30pm", "12:30am" for a slot, including past midnight ("24:30"). @param {string} hm */
export const slotLabel = (hm) => formatTime12((Number(hm.slice(0, 2)) * 60 + Number(hm.slice(3, 5))) % 1440);

/**
 * The days a collection can be asked for: today (if there's a slot left) and the next days the shop is open.
 * @param {import("../../../core/lib/hours.js").Hours} hours @param {{ date: string, minutes: number }} now
 * @param {{ prepMinutes: number, step: number, daysAhead: number }} o
 */
export function collectionDays(hours, now, o) {
  /** @type {string[]} */ const days = [];
  for (let i = 0; i <= o.daysAhead; i++) {
    const d = addDays(now.date, i);
    if (collectionSlots(hours, d, now, o).length) days.push(d);
  }
  return days;
}

/** @typedef {{ id: string, name: string, price: number, allergens: string[] }} Line */

/**
 * A list of items with quantities: the total, and the allergens across them.
 * @param {Line[]} items @param {Record<string, number>} qty
 */
export function basket(items, qty) {
  const picked = items.filter((i) => (qty[i.id] ?? 0) > 0).map((i) => ({ ...i, qty: qty[i.id] }));
  const total = Math.round(picked.reduce((s, i) => s + i.price * i.qty, 0) * 100) / 100;
  const allergens = [...new Set(picked.flatMap((i) => i.allergens))];
  return { picked, total, count: picked.reduce((s, i) => s + i.qty, 0), allergens };
}

/**
 * The collection request on WhatsApp.
 * @param {{ business: string, when: string, items: { name: string, qty: number }[], total: number, name: string, note: string, allergenNames: string[] }} o
 */
export function collectText(o) {
  return [
    `Hi ${o.business}, can I collect an order?`,
    "",
    ...o.items.map((i) => `${i.qty} × ${i.name}`),
    `Total on your site: ${gbp(o.total)}`,
    `Collection: ${o.when}`,
    ...(o.name.trim() ? [`Name: ${o.name.trim()}`] : []),
    ...(o.note.trim() ? [`Notes: ${o.note.trim()}`] : []),
    "",
    o.allergenNames.length ? `It contains: ${o.allergenNames.join(", ")}.` : "None of it lists an allergen.",
    "Please confirm the time.",
  ].join("\n");
}

/** @typedef {{ id: string, name: string, servings: number, price: number }} Serving a cake size or a tray, and how many it serves */

/**
 * Party calculator: the fewest cakes or trays from the shop's own list that serve every guest, cheapest first.
 * Returns the best plan for each single item, and a mix of the two largest when one isn't enough.
 * @param {number} guests @param {Serving[]} options
 * @returns {{ items: { id: string, name: string, qty: number }[], servings: number, price: number }[]}
 */
export function partyPlans(guests, options) {
  if (!(guests > 0) || !options.length) return [];
  /** @type {{ items: { id: string, name: string, qty: number }[], servings: number, price: number }[]} */
  const plans = [];
  for (const o of options) {
    const qty = Math.ceil(guests / o.servings);
    plans.push({ items: [{ id: o.id, name: o.name, qty }], servings: qty * o.servings, price: round2(qty * o.price) });
  }
  const big = [...options].sort((a, b) => b.servings - a.servings);
  for (const a of big) for (const b of big) {
    if (a === b || a.servings < b.servings) continue;
    const na = Math.floor(guests / a.servings);
    if (!na) continue;
    const left = guests - na * a.servings;
    if (left <= 0) continue;
    const nb = Math.ceil(left / b.servings);
    plans.push({ items: [{ id: a.id, name: a.name, qty: na }, { id: b.id, name: b.name, qty: nb }], servings: na * a.servings + nb * b.servings, price: round2(na * a.price + nb * b.price) });
  }
  const seen = new Set();
  return plans
    .sort((x, y) => x.price - y.price || x.servings - y.servings)
    .filter((p) => { const k = p.items.map((i) => `${i.id}${i.qty}`).join(); if (seen.has(k)) return false; seen.add(k); return true; })
    .slice(0, 3);
}

/** @param {number} n */
const round2 = (n) => Math.round(n * 100) / 100;
