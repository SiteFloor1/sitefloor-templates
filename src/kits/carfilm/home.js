// @ts-check
/**
 * The car-film home page's sections, in their default order. The viewfinder is the hero (the look includes it). A look
 * can reorder these with look.json "homeOrder" (every id once).
 */
export const HOME_PARTS = {
  "carfilm-reel": "kits/carfilm/features/carfilm-reel/carfilm-reel.njk",
  "carfilm-locations": "kits/carfilm/features/carfilm-locations/carfilm-locations.njk",
  "carfilm-packages": "kits/carfilm/features/carfilm-packages/carfilm-packages.njk",
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
