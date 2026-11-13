// @ts-check
/**
 * The bridal home page's sections, in their default order. A look can lead with different features by listing every
 * id in its own order (look.json → "homeOrder"), and can move sections to their own pages (look.json → "onPages").
 */
export const HOME_PARTS = {
  "appointment": "kits/bridal/features/appointment/appointment.njk",
  "gowns-page": "kits/bridal/features/gowns-page/gowns-home.njk",
  "designers": "kits/bridal/features/designers/designers.njk",
  "gown-diary": "kits/bridal/features/gown-diary/gown-diary.njk",
  "trunk-shows": "kits/bridal/features/trunk-shows/trunk-shows.njk",
  "photo-band": "features/photo-band/photo-band.njk",
  "reviews": "features/reviews/reviews.njk",
  "gallery": "features/gallery/gallery.njk",
  "vouchers": "features/vouchers/vouchers.njk",
  "questions": "features/questions/questions.njk",
  "page-links": "features/page-links/page-links.njk",
  "visit": "features/visit/visit.njk",
};

/**
 * Sections a look may move to a page when that page is on (look.json "onPages": { "<page feature>": [parts] }). The
 * home page leaves them out then and that page shows them, so the home page stays to a few quiet sections. Plan your
 * visit already lists every question, so the questions only leave the home page.
 */
export const HOSTABLE = {
  "gowns-page": ["designers"],
  "fittings-page": ["photo-band"],
  "brides-page": ["reviews", "gallery"],
  "gift-page": ["vouchers", "page-links"],
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

/**
 * A look's home order must list every section exactly once, so a typo can't silently drop one.
 * @param {unknown} order @returns {string | null} what's wrong, or null
 */
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
