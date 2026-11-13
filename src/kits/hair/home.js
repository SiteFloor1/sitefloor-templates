// @ts-check
/**
 * The hair salon home page's sections, in their default order. The price by length opens the page inside the look's
 * hero (look.json "heroParts"); a look can lead with different sections by listing every id in its own order
 * (look.json "homeOrder"), and can move sections to their own pages (look.json "onPages").
 */
export const HOME_PARTS = {
  "length-price": "kits/hair/features/length-price/length-price.njk",
  "chairs-today": "kits/hair/features/chairs-today/chairs-today.njk",
  "textures": "kits/hair/features/textures/textures.njk",
  "stylists": "kits/hair/features/stylists/stylists.njk",
  "colour-year": "kits/hair/features/colour-year/colour-year.njk",
  "skin-test": "kits/hair/features/skin-test/skin-test.njk",
  "reviews": "features/reviews/reviews.njk",
  "gallery": "features/gallery/gallery.njk",
  "vouchers": "features/vouchers/vouchers.njk",
  "blowdry-pass": "kits/hair/features/blowdry-pass/blowdry-pass.njk",
  "questions": "features/questions/questions.njk",
  "visit": "features/visit/visit.njk",
};

/**
 * Sections a look may move to a page when that page is on, so the home page stays to a few sections. Plan your visit
 * lists every question and shows where and when, so questions and visit only leave home (the footer keeps the address).
 */
export const HOSTABLE = {
  "colour-page": ["skin-test"],
  "stylists-page": ["stylists"],
  "look-book": ["gallery"],
  "hair-vouchers": ["vouchers"],
  "hair-services": ["blowdry-pass"],
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
