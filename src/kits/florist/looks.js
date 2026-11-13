// @ts-check
/**
 * Which of the florist kit's own features each look lays out (golden rule 4: everything a visitor sees belongs to the
 * look). A feature a look hasn't designed would show another look's structure in this look's colours, so the kit's
 * check refuses it, and the look's home order leaves its section out. A new florist look adds its own line here.
 */

/** The new features for social-first florists: their markup lives only in a look (the kit's templates are empty). */
const SOCIAL = ["todays-bouquets", "make-this", "live-dates", "the-drop"];

/** @type {Record<string, { offers?: string[], except?: string[] }>} */
export const LOOK_FEATURES = {
  // Mantel was built with the kit: it lays out every florist feature except the social-first ones.
  mantel: { except: SOCIAL },
  tissue: {
    offers: [...SOCIAL, "same-day", "occasion-pages", "delivery-areas", "care-card", "bouquet-builder", "follow-order"],
  },
};

/**
 * Whether a look lays out one of the kit's own features. A look not listed here offers none of them.
 * @param {string} look @param {string} id
 */
export function lookOffers(look, id) {
  const l = LOOK_FEATURES[look];
  if (!l) return false;
  return l.offers ? l.offers.includes(id) : !(l.except ?? []).includes(id);
}

/**
 * Refuses the kit's features the site's look hasn't designed.
 * @param {any} site @param {(path: string, msg: string) => void} err @param {string[]} kitIds the kit's own feature ids
 */
export function checkLookFeatures(site, err, kitIds) {
  if (site.kit !== "florist" || !Array.isArray(site.features)) return;
  for (const id of site.features) {
    if (kitIds.includes(id) && !lookOffers(site.look, id)) err("features", `"${id}" isn't laid out by the ${site.look} look (src/kits/florist/looks.js); choose a look that has it`);
  }
}
