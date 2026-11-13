// @ts-check
/**
 * The wealth manager's home page sections, in their default order. A look can order them (look.json → "homeOrder"),
 * lift one into its hero ("heroParts"), and move a section to its own page when that page is on ("onPages"), so the
 * home page stays to a few calm sections. The office band shows the address and hours, so the shared "visit" section
 * isn't repeated on the home page.
 */
export const HOME_PARTS = {
  "situations": "kits/wealth/features/situations/situations.njk",
  "help": "kits/wealth/features/help/help.njk",
  "advisers": "kits/wealth/features/advisers/advisers.njk",
  "insights": "kits/wealth/features/insights/insights.njk",
  "office": "kits/wealth/features/office/office.njk",
};

/** Sections a look may move to a page when that page is on. */
export const HOSTABLE = { "advisers-page": ["advisers"] };

/** @param {unknown} onPages @returns {string|null} what's wrong, or null */
export function onPagesProblem(onPages) {
  if (onPages === undefined || onPages === null) return null;
  if (typeof onPages !== "object" || Array.isArray(onPages)) return 'onPages must be { "<page feature>": [sections] }';
  for (const [page, parts] of Object.entries(onPages)) {
    const allowed = /** @type {Record<string, string[]>} */ (HOSTABLE)[page];
    if (!allowed) return `onPages: "${page}" can't hold home sections (${Object.keys(HOSTABLE).join(", ")})`;
    const bad = (Array.isArray(parts) ? parts : []).filter((p) => !allowed.includes(p));
    if (!Array.isArray(parts) || bad.length) return `onPages.${page}: only ${allowed.join(", ")}`;
  }
  return null;
}

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
