// @ts-check
/**
 * The cakes home page's sections, in their default order. A look can reorder them with look.json "homeOrder" (every
 * id once), put some in its hero ("heroParts") and move some to a page with "onPages".
 */
export const HOME_PARTS = {
  "flavours": "kits/cakes/features/flavours/flavours.njk",
  "commissions": "kits/cakes/features/commissions/commissions.njk",
  "servings": "kits/cakes/features/servings/servings.njk",
  "cake-date-check": "kits/cakes/features/cake-date-check/cake-date-check.njk",
  "lead-time": "kits/cakes/features/lead-time/lead-time.njk",
  "seasonal-flavours": "kits/cakes/features/seasonal-flavours/seasonal-flavours.njk",
  "how-it-works": "kits/cakes/features/how-it-works/how-it-works.njk",
  "consultation": "kits/cakes/features/consultation/consultation.njk",
  "tasting-box": "kits/cakes/features/tasting-box/tasting-box.njk",
  "venue-check": "kits/cakes/features/venue-check/venue-check.njk",
  "cake-care": "kits/cakes/features/cake-care/cake-care.njk",
  "allergens": "kits/cakes/features/allergens/allergens.njk",
  "page-links": "features/page-links/page-links.njk",
  "reviews": "features/reviews/reviews.njk",
  "questions": "features/questions/questions.njk",
  "visit": "features/visit/visit.njk",
};

/** Sections a look may move to a page when that page is on (look.json "onPages"). */
export const HOSTABLE = {
  "flavours-page": ["seasonal-flavours"],
  "allergens-page": ["allergens"],
  "servings-page": ["servings"],
  "tasting-page": ["tasting-box"],
  "delivery-page": ["venue-check"],
  "cake-care-page": ["cake-care"],
  "how-it-works-page": ["how-it-works", "consultation", "lead-time"],
  "plan-visit": ["questions", "visit"],
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
