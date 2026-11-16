// @ts-check
/**
 * The skin clinic home page's sections, in their default order. A look can lead with different sections by listing
 * every id in its own order (look.json → "homeOrder").
 */
export const HOME_PARTS = {
  "skin-finder": "kits/skin/features/skin-finder/skin-finder.njk",
  "skin-menu": "kits/skin/features/skin-menu/skin-menu.njk",
  "skin-first-visit": "kits/skin/features/skin-first-visit/skin-first-visit.njk",
  "reviews": "features/reviews/reviews.njk",
  "page-links": "features/page-links/page-links.njk",
  "questions": "features/questions/questions.njk",
  "visit": "features/visit/visit.njk",
};

/** A look's home order must list every section exactly once. @param {unknown} order @returns {string|null} */
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
