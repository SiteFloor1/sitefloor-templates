// @ts-check
/**
 * The modest boutique home page's sections, in their default order. A look can lead with different sections by
 * listing every id in its own order (look.json → "homeOrder").
 */
export const HOME_PARTS = {
  "modest-hem-line": "kits/modest/features/modest-hem-line/modest-hem-line.njk",
  "modest-size-guide": "kits/modest/features/modest-size-guide/modest-size-guide.njk",
  "modest-collection": "kits/modest/features/modest-collection/modest-collection.njk",
  "modest-eid": "kits/modest/features/modest-eid/modest-eid.njk",
  "vouchers": "features/vouchers/vouchers.njk",
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
