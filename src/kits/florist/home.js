// @ts-check
/**
 * The florist's home page sections, in their default order. A look can order them its own way (look.json →
 * "homeOrder", every section the look lays out, once; see looks.js). The hero (the look's) shows this week's arrangement; "this-week" is the band beneath
 * it with the name, prices, the same-day line and the one order button.
 */
import { lookOffers } from "./looks.js";
export const HOME_PARTS = {
  "this-week": "kits/florist/features/this-week/this-week.njk",
  "todays-bouquets": "kits/florist/features/todays-bouquets/todays-bouquets.njk",
  "live-dates": "kits/florist/features/live-dates/live-dates.njk",
  "make-this": "kits/florist/features/make-this/make-this.njk",
  "pre-order": "kits/florist/features/pre-order/pre-order.njk",
  "two-ways": "kits/florist/features/two-ways/two-ways.njk",
  "the-wrap": "kits/florist/features/the-wrap/the-wrap.njk",
  "shop-by-occasion": "kits/florist/features/shop-by-occasion/shop-by-occasion.njk",
  "in-season": "kits/florist/features/in-season/in-season.njk",
  "rooms-we-dress": "kits/florist/features/rooms-we-dress/rooms-we-dress.njk",
  "remember-date": "kits/florist/features/remember-date/remember-date.njk",
  "gift-a-season": "kits/florist/features/gift-a-season/gift-a-season.njk",
  "reviews": "features/reviews/reviews.njk",
  "photo-band": "features/photo-band/photo-band.njk",
  "gallery": "features/gallery/gallery.njk",
  "page-links": "features/page-links/page-links.njk",
  "vouchers": "features/vouchers/vouchers.njk",
  "questions": "features/questions/questions.njk",
  "visit": "features/visit/visit.njk",
};

/**
 * Sections that move off the home page when the page that holds them is on (section → page feature), so the home
 * page stays to this week's flowers and a few quiet sections. Each page includes what it takes in.
 */
export const HOME_ELSEWHERE = {
  "gift-a-season": "every-week",
  "remember-date": "every-week",
  "vouchers": "every-week",
  "reviews": "plan-visit",
  "questions": "plan-visit",
  "visit": "plan-visit",
  "gallery": "work",
  "photo-band": "weddings-planner",
};

/**
 * A look's home order must list every section it can show exactly once, so a typo can't silently drop one. Sections
 * of the kit's own features the look doesn't lay out (looks.js) are left out, never listed.
 * @param {unknown} order @param {string} [look] @param {string[]} [kitIds] the kit's own feature ids
 * @returns {string | null} what's wrong, or null
 */
export function homeOrderProblem(order, look, kitIds = []) {
  if (order === undefined) return null;
  const offered = (/** @type {string} */ id) => !look || !kitIds.includes(id) || lookOffers(look, id);
  const notHere = Array.isArray(order) ? order.filter((id) => Object.keys(HOME_PARTS).includes(id) && !offered(id)) : [];
  if (notHere.length) return `homeOrder lists sections the ${look} look doesn't lay out: ${notHere.join(", ")}`;
  const ids = Object.keys(HOME_PARTS).filter(offered);
  if (!Array.isArray(order)) return `homeOrder must be a list of: ${ids.join(", ")}`;
  const unknown = order.filter((id) => !ids.includes(id));
  if (unknown.length) return `homeOrder has unknown sections: ${unknown.join(", ")}`;
  const missing = ids.filter((id) => !order.includes(id));
  if (missing.length) return `homeOrder leaves out: ${missing.join(", ")}`;
  if (new Set(order).size !== order.length) return "homeOrder lists a section twice";
  return null;
}
