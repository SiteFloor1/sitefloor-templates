// @ts-check
/**
 * The perfume house's home page sections, in their default order. A look can lead with different sections by listing
 * every id in its own order (look.json → "homeOrder"). The hero (with the notes, the turntable and launch mode) is the
 * look's own.
 */
export const HOME_PARTS = {
  "fragrance-engraving-desk": "kits/fragrance/features/fragrance-engraving-desk/fragrance-engraving-desk.njk",
  "fragrance-library": "kits/fragrance/features/fragrance-library/fragrance-library.njk",
  "fragrance-launch": "kits/fragrance/features/fragrance-launch/fragrance-launch.njk",
  "page-links": "features/page-links/page-links.njk",
  "reviews": "features/reviews/reviews.njk",
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
