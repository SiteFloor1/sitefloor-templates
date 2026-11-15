// @ts-check
/**
 * The trainer's home page sections, in their default order. The diary sits in the hero (the look includes it). A look
 * can lead with different sections by listing every id in its own order (look.json → "homeOrder").
 */
export const HOME_PARTS = {
  "trainer-month": "kits/trainer/features/trainer-month/trainer-month.njk",
  "trainer-services": "kits/trainer/features/trainer-services/trainer-services.njk",
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
