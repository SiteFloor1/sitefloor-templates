// @ts-check
/**
 * The bridalbeauty home page's sections, in their default order (the cover leads, in the look's hero). A look can lead
 * with different features by listing every id in its own order (look.json → "homeOrder"), and can move sections to
 * their own pages (look.json → "onPages") when those pages are on.
 */
export const HOME_PARTS = {
  "bridalbeauty-looks": "kits/bridalbeauty/features/bridalbeauty-looks/season.njk",
  "bridalbeauty-packages": "kits/bridalbeauty/features/bridalbeauty-packages/bridalbeauty-packages.njk",
  "bridalbeauty-party": "kits/bridalbeauty/features/bridalbeauty-party/bridalbeauty-party.njk",
  "bridalbeauty-travel": "kits/bridalbeauty/features/bridalbeauty-travel/bridalbeauty-travel.njk",
  "bridalbeauty-ready": "kits/bridalbeauty/features/bridalbeauty-ready/bridalbeauty-ready.njk",
  "reviews": "features/reviews/reviews.njk",
  "questions": "features/questions/questions.njk",
  "visit": "features/visit/visit.njk",
};

/** Sections a look may move to a page when that page is on; the home page leaves them out then. */
export const HOSTABLE = {
  "bridalbeauty-bridal": ["reviews", "bridalbeauty-travel"],
  "bridalbeauty-trial": ["bridalbeauty-ready", "visit"],
  "plan-visit": ["questions"],
};

/** @param {unknown} onPages @returns {string|null} what's wrong, or null */
export function onPagesProblem(onPages) {
  if (onPages === undefined || onPages === null) return null;
  if (typeof onPages !== "object" || Array.isArray(onPages)) return "onPages must be { \"<page feature>\": [sections] }";
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
