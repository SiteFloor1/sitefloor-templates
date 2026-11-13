// @ts-check
/**
 * The Table: who in a group can eat each dish, from each guest's diet and the allergens they avoid.
 * Only the restaurant's own marks and allergen chart are used; nothing is guessed.
 */
import { hasDiet, allergenName, dietName } from "../../../core/lib/allergens.js";

/** @typedef {{ diets: string[], avoid: string[] }} Guest */
/** @typedef {{ id: string, name: string, diets?: string[], allergens?: string[], share?: boolean }} Dish */

/** @param {Guest} guest @param {Dish} dish */
export function canEat(guest, dish) {
  return guest.diets.every((d) => hasDiet(dish, d)) && !guest.avoid.some((a) => (dish.allergens ?? []).includes(a));
}

/**
 * How many guests can eat each dish, and which can't.
 * @param {Guest[]} guests @param {Dish[]} dishes
 * @returns {{ id: string, count: number, cant: number[] }[]} cant: indexes of the guests who can't
 */
export function tableView(guests, dishes) {
  return dishes.map((d) => {
    const cant = guests.flatMap((g, i) => (canEat(g, d) ? [] : [i]));
    return { id: d.id, count: guests.length - cant.length, cant };
  });
}

/**
 * Why a guest can't have a dish, in words: "not vegan", "has milk".
 * @param {Guest} guest @param {Dish} dish
 */
export function reasons(guest, dish) {
  return [
    ...guest.diets.filter((d) => !hasDiet(dish, d)).map((d) => `not ${dietName(d).toLowerCase()}`),
    ...guest.avoid.filter((a) => (dish.allergens ?? []).includes(a)).map((a) => `has ${allergenName(a).toLowerCase()}`),
  ];
}

/**
 * The group in one line for the restaurant: "8 guests. 2 vegan, 3 halal. Avoiding: tree nuts (1), milk (2)."
 * @param {Guest[]} guests
 */
export function groupSummary(guests) {
  /** @param {string[]} ids */
  const count = (ids) => {
    /** @type {Map<string, number>} */ const m = new Map();
    for (const id of ids) m.set(id, (m.get(id) ?? 0) + 1);
    return [...m];
  };
  const diets = count(guests.flatMap((g) => g.diets)).map(([d, n]) => `${n} ${dietName(d).toLowerCase()}`);
  const avoid = count(guests.flatMap((g) => g.avoid)).map(([a, n]) => `${allergenName(a).toLowerCase()} (${n})`);
  return [`${guests.length} guest${guests.length === 1 ? "" : "s"}.`, diets.length ? `${diets.join(", ")}.` : "", avoid.length ? `Avoiding: ${avoid.join(", ")}.` : ""].filter(Boolean).join(" ");
}
