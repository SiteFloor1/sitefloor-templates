// @ts-check
/**
 * The holiday-let company's home page sections, in their default order, after the hero (where the estimate sits on
 * Signature). A look can order them (look.json → "homeOrder"). Owners first: between guests, a few of the homes, what
 * we do and what it costs, and the rules where your home is.
 */
export const HOME_PARTS = {
  "hol-turnover": "kits/hol/features/hol-turnover/hol-turnover.njk",
  "hol-homes": "kits/hol/features/hol-homes/hol-homes-home.njk",
  "hol-fees": "kits/hol/features/hol-fees/hol-fees-home.njk",
  "hol-rules": "kits/hol/features/hol-rules/hol-rules.njk",
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
