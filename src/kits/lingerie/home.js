// @ts-check
/**
 * The lingerie home page's sections, in their default order. A look can reorder them by listing every id in its own
 * order (look.json → "homeOrder"). Chapters (a full-width close crop between sections) are placed by their own
 * "before" setting in site.json, not here. A gift takeover (Valentine's, Christmas) comes before the hero, in pages/index.njk.
 */
export const HOME_PARTS = {
  "new-season": "kits/lingerie/features/new-season/new-season.njk",
  "category-doors": "kits/lingerie/features/category-doors/category-doors.njk",
  "drop": "kits/lingerie/features/drop/drop.njk",
  "preorders": "kits/lingerie/features/preorders/preorders.njk",
  "tell-us-about-her": "kits/lingerie/features/tell-us-about-her/tell-us-about-her.njk",
  "private-evening": "kits/lingerie/features/private-evening/private-evening.njk",
  "party-evening": "kits/lingerie/features/party-evening/party-evening.njk",
  "fit-finder": "kits/lingerie/features/fit-finder/fit-finder.njk",
  "size-guide": "kits/lingerie/features/size-guide/size-guide.njk",
  "private-fitting": "kits/lingerie/features/private-fitting/private-fitting.njk",
  "gift-wrap": "kits/lingerie/features/gift-wrap/gift-wrap.njk",
  "gift-concierge": "kits/lingerie/features/gift-concierge/gift-concierge.njk",
  "lace-viewer": "kits/lingerie/features/lace-viewer/lace-viewer.njk",
  "discreet": "kits/lingerie/features/discreet/discreet.njk",
  "services": "kits/lingerie/features/services/services.njk",
  "stockists": "kits/lingerie/features/stockists/stockists.njk",
  "pay-link": "features/pay-link/pay-link.njk",
  "photo-band": "features/photo-band/photo-band.njk",
  "gallery": "features/gallery/gallery.njk",
  "reviews": "features/reviews/reviews.njk",
  "vouchers": "features/vouchers/vouchers.njk",
  "questions": "features/questions/questions.njk",
  "page-links": "features/page-links/page-links.njk",
  "visit": "features/visit/visit.njk",
};

/**
 * Home sections that move to their own page when the site has it: on Starter the home page carries them; once the
 * page is built, the home page leaves them to it so it stays a campaign, not a run of forms.
 */
export const ON_PAGES = {
  "size-guide": "fitting-page", "fit-finder": "fitting-page", "private-fitting": "fitting-page",
  "gift-concierge": "for-her-page", "gift-wrap": "for-her-page", "vouchers": "for-her-page",
  "lace-viewer": "lace-page", "stockists": "founder-page",
  "party-evening": "bridal-page",
};
