// @ts-check
/**
 * The electrician home page's sections, in their default order. A look can lead with different sections by listing
 * every id in its own order (look.json "homeOrder"), and can move sections to their own pages when those pages are on
 * (look.json "onPages"), so the home page stays short.
 */
export const HOME_PARTS = {
  "light-reasons": "kits/electrician/features/light-reasons/light-reasons.njk",
  "house-3d": "kits/electrician/features/house-3d/house-3d.njk",
  "lit-rooms": "kits/electrician/features/lit-rooms/lit-rooms.njk",
  "photo-band": "features/photo-band/photo-band.njk",
  "circuits": "kits/electrician/features/circuits/circuits.njk",
  "fault-guide": "kits/electrician/features/fault-guide/fault-guide.njk",
  "project-steps": "kits/electrician/features/project-steps/project-steps.njk",
  "before-you-call": "kits/electrician/features/before-you-call/before-you-call.njk",
  "estimate": "kits/electrician/features/estimate/estimate.njk",
  "dimmer": "kits/electrician/features/dimmer/dimmer.njk",
  "reviews": "features/reviews/reviews.njk",
  "gallery": "features/gallery/gallery.njk",
  "vouchers": "features/vouchers/vouchers.njk",
  "questions": "features/questions/questions.njk",
  "page-links": "features/page-links/page-links.njk",
  "visit": "features/visit/visit.njk",
};

/** Sections a look may move to a page when that page is on: { "<page feature>": [sections] }. */
export const HOSTABLE = {
  "project-page": ["project-steps", "before-you-call", "estimate"],
  "room-designer": ["dimmer", "vouchers"],
  "projects-page": ["reviews", "gallery", "page-links"],
  "plan-visit": ["questions", "visit"],
};

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
  if (order === undefined || order === null) return null;
  const ids = Object.keys(HOME_PARTS);
  if (!Array.isArray(order)) return `homeOrder must be a list of: ${ids.join(", ")}`;
  const unknown = order.filter((id) => !ids.includes(id));
  if (unknown.length) return `homeOrder has unknown sections: ${unknown.join(", ")}`;
  const missing = ids.filter((id) => !order.includes(id));
  if (missing.length) return `homeOrder leaves out: ${missing.join(", ")}`;
  if (new Set(order).size !== order.length) return "homeOrder lists a section twice";
  return null;
}
