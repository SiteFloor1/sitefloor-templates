// @ts-check
/**
 * The barber home page's sections, in their default order (Noir's). A look can lead with
 * different features by listing every id in its own order: look.json → "homeOrder".
 * Each section still shows only when its feature is enabled.
 */
export const HOME_PARTS = {
  "chair-board": "kits/barber/features/chair-board/chair-board.njk",
  "photo-band": "features/photo-band/photo-band.njk",
  "build-your-cut": "kits/barber/features/build-your-cut/build-your-cut.njk",
  "price-list": "features/price-list/price-list.njk",
  "gallery": "features/gallery/gallery.njk",
  "reviews": "features/reviews/reviews.njk",
  "questions": "features/questions/questions.njk",
  "page-links": "features/page-links/page-links.njk",
  "visit": "features/visit/visit.njk",
  "walk-in-queue": "features/walk-in-queue/walk-in-queue.njk",
  "fit-a-cut": "features/fit-a-cut/fit-a-cut.njk",
  "before-after": "features/before-after/before-after.njk",
  "memberships": "features/memberships/memberships.njk",
  "loyalty": "features/loyalty/loyalty.njk",
  "vouchers": "features/vouchers/vouchers.njk",
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
