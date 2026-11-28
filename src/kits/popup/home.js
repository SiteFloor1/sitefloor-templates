// @ts-check
/**
 * The pop-up's home page sections, in their default order: the rooms (what it is and how long), then a time, the next
 * opening, Instagram, questions and the address. The run itself sits in the look's hero. A look can list every id in
 * its own order (look.json → "homeOrder").
 */
export const HOME_PARTS = {
  "popup-rooms": "kits/popup/features/popup-rooms/popup-rooms.njk",
  "popup-slots": "kits/popup/features/popup-slots/popup-slots.njk",
  "popup-waitlist": "kits/popup/features/popup-waitlist/popup-waitlist.njk",
  "gallery": "features/gallery/gallery.njk",
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
