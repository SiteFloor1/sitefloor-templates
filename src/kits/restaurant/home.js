// @ts-check
/**
 * The restaurant home page's sections, in their default order. A look can lead with different features by listing
 * every id in its own order (look.json → "homeOrder"), and can put some of them in its hero instead
 * (look.json → "heroParts", e.g. Carte's menu card and today's slip); those are skipped below the hero.
 * The café sections (CAFE_PARTS) may be left out of a look's order: looks made before them (Carte, Maison) then
 * show any that are switched on just before the page links and Plan your visit.
 */
export const HOME_PARTS = {
  "menu": "kits/restaurant/features/menu/menu-home.njk",
  "sittings": "kits/restaurant/features/sittings/sittings.njk",
  "your-table": "kits/restaurant/features/your-table/your-table.njk",
  "tea-sommelier": "kits/restaurant/features/tea-sommelier/tea-sommelier.njk",
  "give-a-sitting": "kits/restaurant/features/give-a-sitting/give-a-sitting.njk",
  "music": "kits/restaurant/features/music/music.njk",
  "dress-code": "kits/restaurant/features/dress-code/dress-code.njk",
  "the-window": "kits/restaurant/features/the-window/the-window.njk",
  "salon-plan": "kits/restaurant/features/salon-plan/salon-plan.njk",
  "seasonal-tea": "kits/restaurant/features/seasonal-tea/seasonal-tea.njk",
  "specials": "kits/restaurant/features/specials/today.njk",
  "menu-book": "kits/restaurant/features/menu-book/menu-book.njk",
  "the-pass": "kits/restaurant/features/the-pass/the-pass.njk",
  "pairings": "kits/restaurant/features/pairings/pairings.njk",
  "the-table": "kits/restaurant/features/the-table/the-table.njk",
  "the-room": "kits/restaurant/features/the-room/the-room.njk",
  "table-request": "kits/restaurant/features/table-request/table-request.njk",
  "delivery": "kits/restaurant/features/delivery/delivery.njk",
  "gallery": "features/gallery/gallery.njk",
  "reviews": "features/reviews/reviews.njk",
  "photo-band": "features/photo-band/photo-band.njk",
  "questions": "features/questions/questions.njk",
  "vouchers": "features/vouchers/vouchers.njk",
  "page-links": "features/page-links/page-links.njk",
  "visit": "features/visit/visit.njk",
  "your-usual": "kits/restaurant/features/your-usual/your-usual.njk",
  "the-case": "kits/restaurant/features/the-case/the-case.njk",
  "busy-now": "kits/restaurant/features/busy-now/busy-now.njk",
  "work-here": "kits/restaurant/features/work-here/work-here.njk",
  "seat-finder": "kits/restaurant/features/seat-finder/seat-finder.njk",
  "brunch-builder": "kits/restaurant/features/brunch-builder/brunch-builder.njk",
  "regulars-board": "kits/restaurant/features/regulars-board/regulars-board.njk",
  "loyalty": "features/loyalty/loyalty.njk",
};

/** Sections a look's order may leave out (see above). */
export const CAFE_PARTS = ["your-usual", "the-case", "busy-now", "work-here", "seat-finder", "brunch-builder", "regulars-board", "loyalty",
  "sittings", "your-table", "tea-sommelier", "give-a-sitting", "music", "dress-code", "the-window", "salon-plan", "seasonal-tea"];

/**
 * Sections a look may move to their own page when that page is on (look.json "onPages": { "<page feature>": [parts] }):
 * afternoon tea's (Your table, the salon plan, the seasonal stands, the sommelier), the gifts page's, Plan your
 * visit's (the dress code, the questions) and What's on's (music). The home page leaves them out then; each page
 * includes them itself. Only these may move, so a page always has the template that shows them.
 */
export const HOSTABLE = {
  "tea-page": ["your-table", "salon-plan", "seasonal-tea", "tea-sommelier"],
  "gifts-page": ["give-a-sitting", "vouchers"],
  "plan-visit": ["dress-code", "questions"],
  "events": ["music"],
};

/**
 * The order the home page uses: the look's own, with any café sections it leaves out placed just before the
 * page links (or at the end); the kit's default order without one.
 * @param {string[]|null|undefined} order
 * @returns {string[]}
 */
export function homeOrderFor(order) {
  if (!order) return Object.keys(HOME_PARTS);
  const missing = CAFE_PARTS.filter((id) => !order.includes(id));
  if (!missing.length) return order;
  const at = order.indexOf("page-links");
  return at < 0 ? [...order, ...missing] : [...order.slice(0, at), ...missing, ...order.slice(at)];
}

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
  const missing = ids.filter((id) => !order.includes(id) && !CAFE_PARTS.includes(id));
  if (missing.length) return `homeOrder leaves out: ${missing.join(", ")}`;
  if (new Set(order).size !== order.length) return "homeOrder lists a section twice";
  return null;
}
