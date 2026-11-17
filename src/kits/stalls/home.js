// @ts-check
/**
 * The stall's home page sections, in their default order: where to find us first, then the menu, a drop, the latest
 * posts, and party bookings lower down. A look can list every id in its own order (look.json → "homeOrder").
 */
export const HOME_PARTS = {
  "stalls-where": "kits/stalls/features/stalls-where/stalls-where.njk",
  "stalls-menu": "kits/stalls/features/stalls-menu/stalls-menu.njk",
  "stalls-drop": "kits/stalls/features/stalls-drop/stalls-drop.njk",
  "stalls-posts": "kits/stalls/features/stalls-posts/stalls-posts.njk",
  "gallery": "features/gallery/gallery.njk",
  "stalls-book": "kits/stalls/features/stalls-book/stalls-book-home.njk",
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
