// @ts-check
/**
 * The nail salon's home sections, in their default order. A look leads with different ones by listing every id in its
 * own order (look.json "homeOrder"), and moves sections to their own pages (look.json "onPages") so the home page
 * stays to a few: the hand, the month's sets, the menu by the hour, the salon, the visit.
 */
export const HOME_PARTS = {
  "usual-set": "kits/nails/features/usual-set/usual-set.njk",
  "monthly-edit": "kits/nails/features/monthly-edit/monthly-edit.njk",
  "menu-hours": "kits/nails/features/menu-hours/menu-hours.njk",
  "salon": "kits/nails/features/salon/salon.njk",
  "gel-biab": "kits/nails/features/gel-biab/gel-biab.njk",
  "build-set": "kits/nails/features/build-set/build-set.njk",
  "infill-reminder": "kits/nails/features/infill-reminder/infill-reminder.njk",
  "finish-clips": "kits/nails/features/finish-clips/finish-clips.njk",
  "nail-bridal-timeline": "kits/nails/features/nail-bridal-timeline/nail-bridal-timeline.njk",
  "party-booking": "kits/nails/features/party-booking/party-booking.njk",
  "gallery": "features/gallery/gallery.njk",
  "photo-band": "features/photo-band/photo-band.njk",
  "page-links": "features/page-links/page-links.njk",
  "reviews": "features/reviews/reviews.njk",
  "vouchers": "features/vouchers/vouchers.njk",
  "questions": "features/questions/questions.njk",
  "visit": "features/visit/visit.njk",
};

/**
 * Sections a look may move to a page when that page is on. The home page leaves them out then and the page shows
 * them. Plan your visit already lists every question, so the questions only leave the home page.
 */
export const HOSTABLE = {
  "nail-menu": ["gel-biab", "build-set", "infill-reminder", "photo-band", "reviews"],
  "art-page": ["gallery"],
  "shades-page": ["finish-clips"],
  "nail-bridal": ["nail-bridal-timeline", "party-booking"],
  "nail-gifts": ["vouchers", "page-links"],
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

/** A look's home order lists every section exactly once, so a typo can't silently drop one. @param {unknown} order */
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
