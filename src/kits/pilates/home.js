// @ts-check
/**
 * The pilates home page's sections, in their default order. Today's classes sit in the hero (the look includes them);
 * the week, the intro card and the rest follow. A look can reorder them with look.json "homeOrder" (every id once) and
 * move some to a page with "onPages".
 */
export const HOME_PARTS = {
  "intro-card": "kits/pilates/features/intro-card/intro-card.njk",
  "timetable": "kits/pilates/features/timetable/timetable.njk",
  "class-types": "kits/pilates/features/class-types/class-types.njk",
  "first-class": "kits/pilates/features/first-class/first-class.njk",
  "class-finder": "kits/pilates/features/class-finder/class-finder.njk",
  "reformer-clip": "kits/pilates/features/reformer-clip/reformer-clip.njk",
  "pack-calculator": "kits/pilates/features/pack-calculator/pack-calculator.njk",
  "gift-cards": "kits/pilates/features/gift-cards/gift-cards.njk",
  "vouchers": "features/vouchers/vouchers.njk",
  "photo-band": "features/photo-band/photo-band.njk",
  "reviews": "features/reviews/reviews.njk",
  "gallery": "features/gallery/gallery.njk",
  "questions": "features/questions/questions.njk",
  "page-links": "features/page-links/page-links.njk",
  "visit": "features/visit/visit.njk",
};

/** Sections a look may move to a page when that page is on (look.json "onPages"). */
export const HOSTABLE = {
  "classes-page": ["class-types", "first-class", "class-finder", "pack-calculator", "reformer-clip"],
  "studio-gifts": ["gift-cards", "vouchers"],
  "plan-visit": ["questions", "photo-band"],
  "work": ["gallery"],
  "private-page": ["reviews"],
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
