// @ts-check
/**
 * The smile studio home page's sections, in their default order. A look can lead with different sections by listing
 * every id in its own order (look.json → "homeOrder").
 */
export const HOME_PARTS = {
  "smile-chooser": "kits/smile/features/smile-chooser/smile-chooser.njk",
  "smile-treatments": "kits/smile/features/smile-treatments/smile-treatments.njk",
  "smile-wedding": "kits/smile/features/smile-wedding/smile-wedding.njk",
  "smile-clinicians": "kits/smile/features/smile-clinicians/smile-clinicians.njk",
  "smile-before-book": "kits/smile/features/smile-before-book/smile-before-book.njk",
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
