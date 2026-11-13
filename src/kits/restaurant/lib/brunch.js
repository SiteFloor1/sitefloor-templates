// @ts-check
/**
 * The brunch builder: a plate for each person, from the café's own brunch dishes, with the sides it adds.
 * Prices and allergens all come from the menu (one source of truth); totals are in pence.
 */
import { toPence, money } from "./order.js";
import { allergenNames } from "../../../core/lib/allergens.js";

/** @typedef {{ id: string, name: string, price: number, allergens: string[], diets?: string[] }} MenuDish */
/** @typedef {{ plate: string, sides: string[] }} Plate */

/**
 * @param {Plate[]} plates
 * @param {Map<string, MenuDish>} dishes every dish by id
 * @returns {{ lines: { label: string, pence: number, allergens: string[] }[], totalPence: number, allergens: string[] }}
 */
export function brunchOrder(plates, dishes) {
  const lines = plates.flatMap((p) => {
    const plate = dishes.get(p.plate);
    if (!plate) return [];
    const sides = p.sides.map((id) => dishes.get(id)).filter((d) => d !== undefined);
    const all = [plate, ...sides];
    return [{
      label: sides.length ? `${plate.name} with ${sides.map((s) => s.name.toLowerCase()).join(", ")}` : plate.name,
      pence: all.reduce((sum, d) => sum + toPence(d.price), 0),
      allergens: [...new Set(all.flatMap((d) => d.allergens))],
    }];
  });
  return {
    lines,
    totalPence: lines.reduce((s, l) => s + l.pence, 0),
    allergens: allergenNames({ allergens: [...new Set(lines.flatMap((l) => l.allergens))] }),
  };
}

/**
 * The pre-order as one short block for the table request: "Plate 1: Eggs royale with bacon, £15.50 …".
 * @param {ReturnType<typeof brunchOrder>} o
 */
export function brunchSummary(o) {
  if (!o.lines.length) return "";
  return [
    ...o.lines.map((l, i) => `Plate ${i + 1}: ${l.label}, ${money(l.pence)}`),
    `Brunch total: ${money(o.totalPence)}`,
    o.allergens.length ? `Allergens in these plates: ${o.allergens.join(", ")}` : "No allergens listed in these plates",
  ].join("\n");
}
