// @ts-check
/**
 * The adviser's home page sections, in their default order. A look can reorder them (look.json → "homeOrder").
 * The statement (Fees in pounds) belongs to the hero, which the look draws.
 */
export const HOME_PARTS = {
  "ifa-services": "kits/ifa/features/ifa-services/ifa-services.njk",
  "ifa-advisers": "kits/ifa/features/ifa-advisers/ifa-advisers.njk",
  "questions": "features/questions/questions.njk",
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
