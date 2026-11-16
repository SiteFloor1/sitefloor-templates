// @ts-check
/**
 * The trainer's home page sections, in their default order (HOSTS below moves some to their own page). The diary sits in the hero (the look includes it). A look
 * can lead with different sections by listing every id in its own order (look.json → "homeOrder").
 */
export const HOME_PARTS = {
  "trainer-month": "kits/trainer/features/trainer-month/trainer-month.njk",
  "trainer-goal": "kits/trainer/features/trainer-goal/trainer-goal.njk",
  "trainer-timeline": "kits/trainer/features/trainer-timeline/trainer-timeline.njk",
  "trainer-services": "kits/trainer/features/trainer-services/trainer-services.njk",
  "trainer-coverage": "kits/trainer/features/trainer-coverage/trainer-coverage.njk",
  "trainer-checklist": "kits/trainer/features/trainer-checklist/trainer-checklist.njk",
  "page-links": "features/page-links/page-links.njk",
  "reviews": "features/reviews/reviews.njk",
  "vouchers": "features/vouchers/vouchers.njk",
  "gallery": "features/gallery/gallery.njk",
  "photo-band": "features/photo-band/photo-band.njk",
  "questions": "features/questions/questions.njk",
  "visit": "features/visit/visit.njk",
};

/**
 * A section that has a page of its own to live on leaves the home page when that page is on (the goal finder sits
 * with the programmes, the twelve weeks with the prices, the sessions and qualifications with the coaches, and so on),
 * so the home page stays short (the footer keeps the address and hours). Without the page,
 * it stays on the home page.
 */
export const HOSTS = {
  "trainer-goal": "trainer-programmes",
  "trainer-timeline": "trainer-prices",
  "vouchers": "trainer-prices",
  "trainer-coverage": "trainer-online",
  "trainer-checklist": "trainer-start",
  "reviews": "trainer-stories",
  "gallery": "trainer-studio",
  "photo-band": "trainer-studio",
  "trainer-services": "team",
  "visit": "plan-visit",
};

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
