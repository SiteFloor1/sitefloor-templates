// @ts-check
/**
 * The construction kit's home page sections, in their default order. The visualiser sits in the hero (the look includes
 * it); how a build runs, the finished projects and the rest follow. A look can reorder them with look.json
 * "homeOrder" (every id once) and move some to a page with "onPages", so the home page stays short.
 */
export const HOME_PARTS = {
  "build-stages": "kits/construction/features/build-stages/build-stages.njk",
  "projects": "kits/construction/features/projects/projects.njk",
  "build-types": "kits/construction/features/build-types/build-types.njk",
  "credentials": "kits/construction/features/credentials/credentials.njk",
  "brief": "kits/construction/features/brief/brief.njk",
  "reviews": "features/reviews/reviews.njk",
  "questions": "features/questions/questions.njk",
  "page-links": "features/page-links/page-links.njk",
  "visit": "features/visit/visit.njk",
};

/** Sections a look may move to a page when that page is on (look.json "onPages"). */
export const HOSTABLE = {
  "services-page": ["build-types"],
  "start-page": ["brief"],
  "jobs-page": ["reviews"],
  "reviews-page": ["reviews"],
  "credentials-page": ["credentials"],
  "plan-visit": ["questions", "page-links"],
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

/** A look's home order must list every section exactly once. @param {unknown} order @returns {string | null} */
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
