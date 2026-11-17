// @ts-check
/**
 * The driving site's home sections below the first screen, in their default order. The first screen's answers
 * (prices, areas, next free lessons, when could I pass) sit in the hero (the look includes them, look.json heroParts).
 * A look can lead with different sections by listing every id in its own order (look.json → "homeOrder").
 */
export const HOME_PARTS = {
  "driving-ready": "kits/driving/features/driving-ready/driving-ready.njk",
  "driving-testday": "kits/driving/features/driving-testday/driving-testday.njk",
  "reviews": "features/reviews/reviews.njk",
  "gallery": "features/gallery/gallery.njk",
  "vouchers": "features/vouchers/vouchers.njk",
  "questions": "features/questions/questions.njk",
  "visit": "features/visit/visit.njk",
};

/** A section with a page of its own to live on leaves the home page when that page is on. */
export const HOSTS = {
  "gallery": "driving-passed",
  "visit": "plan-visit",
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
