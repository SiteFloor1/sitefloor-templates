// @ts-check
/**
 * The car studio home page's sections, in their default order. The Showroom isn't listed: it lives
 * in the look's hero, so the car is the first thing a visitor sees. A look can lead with different
 * features by listing every id in its own order (look.json → "homeOrder").
 */
export const HOME_PARTS = {
  "price-list": "features/price-list/price-list.njk",
  "driver-view": "kits/car/features/driver-view/driver-view.njk",
  "protection-planner": "kits/car/features/protection-planner/protection-planner.njk",
  "chip-test": "kits/car/features/chip-test/chip-test.njk",
  "swatches": "kits/car/features/swatches/swatches.njk",
  "model-finder": "kits/car/features/model-finder/model-finder.njk",
  "gallery": "features/gallery/gallery.njk",
  "before-after": "features/before-after/before-after.njk",
  "next-bay": "kits/car/features/next-bay/next-bay.njk",
  "quote": "kits/car/features/quote/quote.njk",
  "reviews": "features/reviews/reviews.njk",
  "aftercare-card": "kits/car/features/aftercare-card/aftercare-card.njk",
  "questions": "features/questions/questions.njk",
  "vouchers": "features/vouchers/vouchers.njk",
  "photo-band": "features/photo-band/photo-band.njk",
  "page-links": "features/page-links/page-links.njk",
  "visit": "features/visit/visit.njk",
};

/**
 * A look's home order must list every section exactly once, so a typo can't silently drop one.
 * @param {unknown} order @returns {string | null} what's wrong, or null
 */
export function homeOrderProblem(order) {
  if (order === undefined) return null;
  const ids = Object.keys(HOME_PARTS);
  if (!Array.isArray(order)) return `homeOrder must be a list of: ${ids.join(", ")}`;
  const unknown = order.filter((id) => !ids.includes(id));
  if (unknown.length) return `homeOrder has unknown sections: ${unknown.join(", ")}`;
  const missing = ids.filter((id) => !order.includes(id));
  if (missing.length) return `homeOrder leaves out: ${missing.join(", ")}`;
  if (new Set(order).size !== order.length) return "homeOrder lists a section twice";
  return null;
}
