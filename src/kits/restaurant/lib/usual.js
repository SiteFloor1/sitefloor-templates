// @ts-check
/**
 * Your usual: a coffee built from the café's own price list. The price is worked out in pence from the café's
 * own numbers (the drink's price for the size, the milk's extra, each extra shot, the syrup, decaf, the cup);
 * the allergens come from the café's own chart (the drink's, the milk's and the syrup's); the collection
 * time is now plus the café's own prep time, inside its opening hours. Nothing here is invented.
 */
import { toPence, money, priceOrder, orderMessage } from "./order.js";
import { openStatus, formatTime12 } from "../../../core/lib/hours.js";
import { allergenNames } from "../../../core/lib/allergens.js";

/**
 * @typedef {{ id: string, name: string, prices: Record<string, number>, milk?: boolean, allergens: string[], desc?: string, pour?: string }} Drink
 * @typedef {{ id: string, name: string, ml: number }} Size
 * @typedef {{ id: string, name: string, price: number, allergens: string[], note?: string, shade?: string }} Milk
 * @typedef {{ id: string, name: string, price: number, allergens: string[] }} Syrup
 * @typedef {{ message: string, prepMinutes: number, drinks: Drink[], sizes: Size[], milks: Milk[], defaultMilk: string,
 *   extraShot: number, maxShots: number, syrups?: Syrup[], decaf?: number, ownCup?: number, note?: string }} UsualConfig
 * @typedef {{ drink: string, size: string, milk?: string, shots?: number, syrup?: string, decaf?: boolean, hot?: boolean, cup?: "here"|"takeaway"|"own" }} Choice
 */

/**
 * The choice made safe: anything the drink doesn't offer falls back to its first option, so an old "usual" saved
 * on a phone never breaks when the café changes its list.
 * @param {UsualConfig} cfg @param {Choice} c
 */
function resolve(cfg, c) {
  const drink = cfg.drinks.find((d) => d.id === c.drink) ?? cfg.drinks[0];
  const sizes = cfg.sizes.filter((s) => drink.prices[s.id] !== undefined);
  const milkOf = (/** @type {string|undefined} */ id) => cfg.milks.find((m) => m.id === id);
  return {
    drink,
    size: sizes.find((s) => s.id === c.size) ?? sizes[0],
    milk: drink.milk ? milkOf(c.milk) ?? milkOf(cfg.defaultMilk) ?? cfg.milks[0] : null,
    syrup: (cfg.syrups ?? []).find((s) => s.id === c.syrup) ?? null,
    shots: Math.max(0, Math.min(cfg.maxShots, Math.floor(c.shots ?? 0))),
    decaf: Boolean(c.decaf) && cfg.decaf !== undefined,
    hot: Boolean(c.hot),
    cup: /** @type {"here"|"takeaway"|"own"} */ (c.cup === "own" && cfg.ownCup === undefined ? "takeaway" : c.cup ?? "takeaway"),
  };
}

/**
 * The drink as chosen, priced in pence, with its allergens and how it reads on the order.
 * @param {UsualConfig} cfg @param {Choice} c
 * @returns {{ choice: { drink: string, size: string, milk: string, syrup: string, shots: number, decaf: boolean, hot: boolean, cup: "here"|"takeaway"|"own" }, pence: number, allergens: string[], label: string, short: string }}
 */
export function priceDrink(cfg, c) {
  const r = resolve(cfg, c);
  const extras = [r.milk?.price ?? 0, r.shots * cfg.extraShot, r.syrup?.price ?? 0, r.decaf ? cfg.decaf ?? 0 : 0];
  const pence = toPence(r.drink.prices[r.size.id]) + extras.reduce((sum, x) => sum + toPence(x), 0) - (r.cup === "own" ? toPence(cfg.ownCup ?? 0) : 0);
  return { choice: choiceOf(r), pence: Math.max(0, pence), allergens: [...new Set([...r.drink.allergens, ...(r.milk?.allergens ?? []), ...(r.syrup?.allergens ?? [])])], ...words(cfg, r) };
}

/** The ids to save as "your usual". @param {ReturnType<typeof resolve>} r */
const choiceOf = (r) => ({ drink: r.drink.id, size: r.size.id, milk: r.milk?.id ?? "", shots: r.shots, syrup: r.syrup?.id ?? "", decaf: r.decaf, hot: r.hot, cup: r.cup });

/**
 * "Flat white (regular, oat milk, 1 extra shot, to take away)" and the short "Oat flat white".
 * @param {UsualConfig} cfg @param {ReturnType<typeof resolve>} r
 */
function words(cfg, r) {
  const parts = [
    r.size.name.toLowerCase(), r.milk ? r.milk.name.toLowerCase() : "",
    r.shots ? `${r.shots} extra shot${r.shots === 1 ? "" : "s"}` : "", r.syrup ? r.syrup.name.toLowerCase() : "",
    r.decaf ? "decaf" : "", r.hot ? "extra hot" : "",
    { here: "to drink here", own: "in my own cup", takeaway: "to take away" }[r.cup],
  ].filter(Boolean);
  const short = !r.milk || r.milk.id === cfg.defaultMilk ? r.drink.name : `${r.milk.name.replace(/ milk$/i, "")} ${r.drink.name.toLowerCase()}`;
  return { label: `${r.drink.name} (${parts.join(", ")})`, short };
}

/**
 * When the order can be ready: from now plus the café's prep time, rounded up to five minutes, in steps
 * until five minutes before it closes. Closed now but opening later today: from opening plus prep. Closed
 * for the day: no times, and when it next opens.
 * @param {import("../../../core/lib/hours.js").Hours} hours
 * @param {import("../../../core/lib/hours.js").ZonedNow} now
 * @param {number} prepMinutes
 * @returns {{ times: number[], opensAt: number|null, nextOpen: { date: string, minutes: number }|null }}
 */
export function readyTimes(hours, now, prepMinutes) {
  const s = openStatus(hours, now);
  const up5 = (/** @type {number} */ m) => Math.ceil(m / 5) * 5;
  /** @param {number} from @param {number} close */
  const steps = (from, close) => [0, 10, 20, 30, 45, 60].map((d) => up5(from) + d).filter((t) => t <= close - 5);
  if (s.open && s.closesAt !== null) return { times: steps(now.minutes + prepMinutes, s.closesAt), opensAt: null, nextOpen: null };
  if (s.nextOpen && s.nextOpen.date === now.date) {
    const later = openStatus(hours, { ...now, minutes: s.nextOpen.minutes });
    return { times: steps(s.nextOpen.minutes + prepMinutes, later.closesAt ?? s.nextOpen.minutes), opensAt: s.nextOpen.minutes, nextOpen: null };
  }
  return { times: [], opensAt: null, nextOpen: s.nextOpen ? { date: s.nextOpen.date, minutes: s.nextOpen.minutes } : null };
}

/**
 * The WhatsApp order: each drink with its price, any bakes, the total, the collection time and the
 * allergens in the order, with the same "please confirm" as the takeaway page.
 * @param {{ label: string, pence: number, allergens: string[] }[]} drinks
 * @param {{ name: string, price: number, allergens: string[] }[]} bakes
 * @param {{ opening: string, time: number, name?: string, seat?: string }} o
 */
export function usualMessage(drinks, bakes, o) {
  const items = [
    ...drinks.map((d, i) => ({ id: `d${i}`, name: d.label, price: d.pence / 100, allergens: d.allergens })),
    ...bakes.map((b, i) => ({ id: `b${i}`, name: b.name, price: b.price, allergens: b.allergens })),
  ];
  const order = priceOrder(Object.fromEntries(items.map((it) => [it.id, 1])), items);
  return orderMessage(order, { opening: o.opening, time: `about ${formatTime12(o.time)}`, name: o.name, notes: o.seat ? `Where I'd like to sit, if it's free: ${o.seat}` : undefined });
}

/** "£4.10". @param {number} pence */
export const price = (pence) => money(pence);

/** "Milk, Soya" for a drink's allergen line. @param {string[]} ids */
export const allergenLine = (ids) => allergenNames({ allergens: ids }).join(", ");
