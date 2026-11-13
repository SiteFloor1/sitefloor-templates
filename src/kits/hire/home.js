// @ts-check
/**
 * The car hire home page's sections, in their default order. A look can reorder them (look.json → "homeOrder", every id
 * exactly once) or put some in its hero ("heroParts"). What to bring and the driver details form sit inside the questions.
 */
export const HOME_PARTS = {
  "fleet": "kits/hire/features/fleet/fleet.njk",
  "handover": "kits/hire/features/handover/handover.njk",
  "hire-request": "kits/hire/features/hire-request/hire-request.njk",
  "postcode": "kits/hire/features/postcode/postcode.njk",
  "vouchers": "features/vouchers/vouchers.njk",
  "photo-band": "features/photo-band/photo-band.njk",
  "gallery": "features/gallery/gallery.njk",
  "reviews": "features/reviews/reviews.njk",
  "questions": "features/questions/questions.njk",
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
