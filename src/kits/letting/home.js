// @ts-check
/**
 * The letting agent's home page sections, in their default order. A look can order them (look.json → "homeOrder")
 * and lift one into its hero ("heroParts"), so the home page stays short: the entrance and today's homes, then one
 * rent from both sides. Fees, owners and the residences schedule have their own pages, in the menu.
 */
export const HOME_PARTS = {
  "letting-board": "kits/letting/features/letting-board/letting-board.njk",
  "letting-net": "kits/letting/features/letting-net/letting-net.njk",
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
