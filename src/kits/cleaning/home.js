// @ts-check
/**
 * The cleaning company's home page sections, in their default order (the room strip lives in the look's hero). A look
 * can lead with different sections by listing every id in its own order (look.json → "homeOrder").
 */
export const HOME_PARTS = {
  "cleaning-bill": "kits/cleaning/features/cleaning-bill/cleaning-bill.njk",
  "cleaning-keys": "kits/cleaning/features/cleaning-keys/cleaning-keys.njk",
  "reviews": "features/reviews/reviews.njk",
  "cleaning-services": "kits/cleaning/features/cleaning-services/cleaning-services.njk",
  "cleaning-areas": "kits/cleaning/features/cleaning-areas/cleaning-areas.njk",
  "questions": "features/questions/questions.njk",
  "page-links": "features/page-links/page-links.njk",
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
