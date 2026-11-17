// @ts-check
/**
 * The garage home page's sections, in their default order. A look can lead with different sections by listing every
 * id in its own order (look.json → "homeOrder").
 */
export const HOME_PARTS = {
  "garage-pick": "kits/garage/features/garage-pick/garage-pick.njk",
  "garage-spaces": "kits/garage/features/garage-spaces/garage-spaces.njk",
  "garage-charging": "kits/garage/features/garage-charging/garage-charging.njk",
  "garage-security": "kits/garage/features/garage-security/garage-security.njk",
  "garage-night": "kits/garage/features/garage-night/garage-night-home.njk",
  "garage-kept": "kits/garage/features/garage-kept/garage-kept.njk",
  "garage-care-card": "kits/garage/features/garage-care-card/garage-care-card.njk",
  "garage-access": "kits/garage/features/garage-access/garage-access.njk",
  "garage-move-in": "kits/garage/features/garage-move-in/garage-move-in.njk",
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
