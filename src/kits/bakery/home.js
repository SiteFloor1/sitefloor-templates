// @ts-check
/**
 * The bakery home page's sections, in their default order. A look can lead with different features by listing every
 * id in its own order (look.json → "homeOrder"), and can put some in its hero instead (look.json → "heroParts",
 * e.g. a showpiece); those are skipped below the hero.
 */
export const HOME_PARTS = {
  "gelato-wall": "kits/bakery/features/gelato-wall/gelato-wall.njk",
  "bakes": "kits/bakery/features/bakes/bakes.njk",
  "dessert-box": "kits/bakery/features/dessert-box/dessert-box.njk",
  "tasting-flight": "kits/bakery/features/tasting-flight/tasting-flight.njk",
  "gelato-tubs": "kits/bakery/features/gelato-tubs/gelato-tubs.njk",
  "favours": "kits/bakery/features/favours/favours.njk",
  "advent-box": "kits/bakery/features/advent-box/advent-box.njk",
  "post-box": "kits/bakery/features/post-box/post-box.njk",
  "box-month": "kits/bakery/features/box-month/box-month.njk",
  "late-night": "kits/bakery/features/late-night/late-night.njk",
  "collect": "kits/bakery/features/collect/collect.njk",
  "desserts": "kits/bakery/features/desserts/desserts.njk",
  "flavour-vote": "kits/bakery/features/flavour-vote/flavour-vote.njk",
  "delivery-links": "kits/bakery/features/delivery-links/delivery-links.njk",
  "pay-link": "features/pay-link/pay-link.njk",
  "photo-band": "features/photo-band/photo-band.njk",
  "gallery": "features/gallery/gallery.njk",
  "reviews": "features/reviews/reviews.njk",
  "questions": "features/questions/questions.njk",
  "vouchers": "features/vouchers/vouchers.njk",
  "page-links": "features/page-links/page-links.njk",
  "visit": "features/visit/visit.njk",
};

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
