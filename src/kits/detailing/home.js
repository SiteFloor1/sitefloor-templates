// @ts-check
/**
 * The detailing home page's sections, in their default order. A look reorders them with look.json "homeOrder" (every
 * id once) and moves some to a page with "onPages" when that page is on.
 */
const F = "kits/detailing/features";
export const HOME_PARTS = {
  "coating-explained": `${F}/coating-explained/coating-explained.njk`,
  "car-progress": `${F}/car-progress/car-progress.njk`,
  "packages": `${F}/packages/packages.njk`,
  "package-builder": `${F}/package-builder/package-builder.njk`,
  "availability": `${F}/availability/availability.njk`,
  "correction-3d": `${F}/correction-3d/correction-3d.njk`,
  "protection-3d": `${F}/protection-3d/protection-3d.njk`,
  "before-after": "features/before-after/before-after.njk",
  "paint-request": `${F}/paint-request/paint-request.njk`,
  "maintenance": `${F}/maintenance/maintenance.njk`,
  "first-wash": `${F}/first-wash/first-wash.njk`,
  "due-check": `${F}/due-check/due-check.njk`,
  "collection": `${F}/collection/collection.njk`,
  "vouchers": "features/vouchers/vouchers.njk",
  "page-links": "features/page-links/page-links.njk",
  "photo-band": "features/photo-band/photo-band.njk",
  "reviews": "features/reviews/reviews.njk",
  "gallery": "features/gallery/gallery.njk",
  "questions": "features/questions/questions.njk",
  "visit": "features/visit/visit.njk",
};

/** Sections a look may move to a page when that page is on (look.json "onPages"). */
export const HOSTABLE = {
  "packages-page": ["packages", "package-builder"],
  "film-page": ["protection-3d"],
  "book-page": ["availability", "collection", "paint-request", "reviews", "vouchers"],
  "correction-page": ["correction-3d"],
  "maintenance-page": ["maintenance"],
  "aftercare-page": ["first-wash", "due-check"],
  "results-page": ["before-after", "gallery"],
  "plan-visit": ["questions", "photo-band"],
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
