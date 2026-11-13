// @ts-check
/**
 * The jeweller's sections. A look decides which sit on the home page (look.json → "homeOrder") and which on the
 * Plan your visit page (look.json → "visitOrder"); between them every section is listed exactly once. A section also
 * steps aside when the feature that takes its place is on (HOME_ELSEWHERE): the gift card moves to Gifts, the visit
 * card into the appointment section, and so on. The piece viewer and the tray are on every page (the look's footer).
 */
export const HOME_PARTS = {
  "collections": "kits/jeweller/features/collections/collections.njk",
  "in-the-box": "kits/jeweller/features/in-the-box/in-the-box.njk",
  "sketch-to-ring": "kits/jeweller/features/sketch-to-ring/sketch-to-ring.njk",
  "bespoke": "kits/jeweller/features/bespoke/home.njk",
  "appointment-request": "kits/jeweller/features/appointment-request/appointment-request.njk",
  "visit": "features/visit/visit.njk",
  "private-room": "kits/jeweller/features/private-room/private-room.njk",
  "visit-prepared": "kits/jeweller/features/visit-prepared/visit-prepared.njk",
  "reviews": "features/reviews/reviews.njk",
  "page-links": "features/page-links/page-links.njk",
  "photo-band": "features/photo-band/photo-band.njk",
  "gallery": "features/gallery/gallery.njk",
  "proposal-brief": "kits/jeweller/features/proposal-brief/proposal-brief.njk",
  "stone-guide": "kits/jeweller/features/stone-guide/stone-guide.njk",
  "anniversary-reminder": "kits/jeweller/features/anniversary-reminder/anniversary-reminder.njk",
  "vouchers": "features/vouchers/vouchers.njk",
  "pay-link": "features/pay-link/pay-link.njk",
  "questions": "features/questions/questions.njk",
};

/** A section that steps aside when another feature is on (section id → the feature that takes its place). */
export const HOME_ELSEWHERE = {
  "vouchers": "gifts",
  "anniversary-reminder": "gifts",
  "pay-link": "bespoke",
  "stone-guide": "engagement-guide",
  "proposal-brief": "engagement-guide",
  "bespoke": "sketch-to-ring",
  "visit": "appointment-request",
  "gallery": "work",
};

/**
 * The look's two lists must cover every section exactly once between them, so a typo can't silently drop one.
 * @param {unknown} order home @param {unknown} [visit] Plan your visit
 * @returns {string | null} what's wrong, or null
 */
export function homeOrderProblem(order, visit = []) {
  if (order === undefined) return null;
  const ids = Object.keys(HOME_PARTS);
  if (!Array.isArray(order) || !Array.isArray(visit)) return `homeOrder and visitOrder must be lists of: ${ids.join(", ")}`;
  const all = [...order, ...visit];
  const unknown = all.filter((id) => !ids.includes(id));
  if (unknown.length) return `homeOrder/visitOrder have unknown sections: ${unknown.join(", ")}`;
  const missing = ids.filter((id) => !all.includes(id));
  if (missing.length) return `homeOrder and visitOrder leave out: ${missing.join(", ")}`;
  if (new Set(all).size !== all.length) return "a section is listed twice";
  return null;
}
