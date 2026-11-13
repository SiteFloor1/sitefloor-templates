// @ts-check
/**
 * The law firm home page's sections, in their default order. A look can lead with different sections by listing
 * every id in its own order (look.json → "homeOrder"), and can move sections to their own pages (look.json →
 * "onPages") so the home page stays to a few quiet sections.
 */
export const HOME_PARTS = {
  "practice": "kits/law/features/practice/practice.njk",
  "people": "kits/law/features/people/people.njk",
  "arrival": "kits/law/features/arrival/arrival.njk",
  "matters": "kits/law/features/matters/matters.njk",
  "enquiry": "kits/law/features/enquiry/enquiry.njk",
  "regulation": "kits/law/features/regulation/regulation.njk",
  "photo-band": "features/photo-band/photo-band.njk",
  "questions": "features/questions/questions.njk",
  "page-links": "features/page-links/page-links.njk",
  "visit": "features/visit/visit.njk",
};

/** Sections a look may move to a page when that page is on. */
export const HOSTABLE = {
  "people-page": ["people", "photo-band"],
  "practice-page": ["matters"],
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
