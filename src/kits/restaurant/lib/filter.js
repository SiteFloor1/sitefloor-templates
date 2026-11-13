// @ts-check
/** Menu filters: a dish shows when it carries the chosen diet mark and none of the allergens being avoided. */
import { hasDiet } from "../../../core/lib/allergens.js";

/**
 * @param {{ diets: string[], allergens: string[] }} dish @param {string} diet "" for everything
 * @param {string[]} avoid allergen ids
 */
export function dishVisible(dish, diet, avoid) {
  return (!diet || hasDiet(dish, diet)) && !avoid.some((a) => dish.allergens.includes(a));
}

/** Reads a dish from its data attributes. @param {HTMLElement} el */
export function dishData(el) {
  const list = (/** @type {string|undefined} */ v) => (v ? v.split(" ").filter(Boolean) : []);
  return { id: el.dataset.dish ?? "", name: el.dataset.name ?? "", price: Number(el.dataset.price ?? 0), diets: list(el.dataset.diets), allergens: list(el.dataset.allergens) };
}
