// @ts-check
/**
 * The 14 allergens UK food businesses must give information about, and the diet marks a menu can carry.
 * Names follow the FSA's allergen guidance for food businesses (gov.uk, checked 27 October 2026). A dish's
 * allergens and marks always come from the restaurant's own allergen chart; the site never decides them.
 */

/** @typedef {{ id: string, name: string, long: string }} Allergen */
/** @type {Allergen[]} */
export const ALLERGENS = [
  { id: "celery", name: "Celery", long: "Celery" },
  { id: "gluten", name: "Gluten", long: "Cereals containing gluten (wheat, rye, barley, oats)" },
  { id: "crustaceans", name: "Crustaceans", long: "Crustaceans (prawns, crab, lobster)" },
  { id: "eggs", name: "Eggs", long: "Eggs" },
  { id: "fish", name: "Fish", long: "Fish" },
  { id: "lupin", name: "Lupin", long: "Lupin" },
  { id: "milk", name: "Milk", long: "Milk" },
  { id: "molluscs", name: "Molluscs", long: "Molluscs (mussels, oysters)" },
  { id: "mustard", name: "Mustard", long: "Mustard" },
  { id: "peanuts", name: "Peanuts", long: "Peanuts" },
  { id: "sesame", name: "Sesame", long: "Sesame" },
  { id: "soya", name: "Soya", long: "Soya" },
  { id: "sulphites", name: "Sulphites", long: "Sulphur dioxide and sulphites" },
  { id: "nuts", name: "Tree nuts", long: "Tree nuts (almonds, hazelnuts, walnuts, cashews, pistachios and others)" },
];
export const ALLERGEN_IDS = ALLERGENS.map((a) => a.id);
export const ALLERGEN_GUIDANCE = {
  url: "https://www.gov.uk/government/publications/allergen-guidance-for-food-businesses/allergen-guidance-for-food-businesses",
  checked: "2026-10-27",
};

/** @typedef {{ id: string, name: string, mark: string }} Diet */
/** Diet marks. A vegan dish also counts as vegetarian; nothing else is inferred. @type {Diet[]} */
export const DIETS = [
  { id: "halal", name: "Halal", mark: "H" },
  { id: "vegetarian", name: "Vegetarian", mark: "V" },
  { id: "vegan", name: "Vegan", mark: "VG" },
];
export const DIET_IDS = DIETS.map((d) => d.id);

/**
 * The bakery kit's marks: the restaurant's three plus eggless, which dessert and cake customers ask for. A vegan item
 * also counts as eggless and vegetarian. The restaurant kit keeps DIETS (halal, vegetarian, vegan) unchanged.
 * @type {Diet[]}
 */
export const BAKERY_DIETS = [
  { id: "eggless", name: "Eggless", mark: "E" },
  ...DIETS,
];
export const BAKERY_DIET_IDS = BAKERY_DIETS.map((d) => d.id);

/** @param {string} id */
export const allergenName = (id) => ALLERGENS.find((a) => a.id === id)?.name ?? id;
/** @param {string} id */
export const dietName = (id) => DIETS.find((d) => d.id === id)?.name ?? id;

/**
 * Does the dish carry this diet mark? Vegan dishes count as vegetarian (and, in the bakery kit, as eggless).
 * @param {{ diets?: string[] }} dish @param {string} diet
 */
export function hasDiet(dish, diet) {
  const marks = dish.diets ?? [];
  return marks.includes(diet) || ((diet === "vegetarian" || diet === "eggless") && marks.includes("vegan"));
}

/**
 * Allergens in a dish, in the FSA's order, as names.
 * @param {{ allergens?: string[] }} dish
 */
export function allergenNames(dish) {
  return ALLERGENS.filter((a) => (dish.allergens ?? []).includes(a.id)).map((a) => a.name);
}
