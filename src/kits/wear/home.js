// @ts-check
/**
 * The wear kit's home page sections, in their default order. A look lists every id in its own order
 * (look.json → "homeOrder") and can put some in its hero instead ("heroParts"); those are skipped below the hero.
 */
export const HOME_PARTS = {
  "drop-line": "kits/wear/features/drop-line/drop-line.njk",
  "pieces": "kits/wear/features/pieces/pieces.njk",
  "drop-queue": "kits/wear/features/drop-queue/drop-queue.njk",
  "size-run": "kits/wear/features/size-run/size-run.njk",
  "details": "kits/wear/features/details/details.njk",
  "wear-today": "kits/wear/features/wear-today/wear-today.njk",
  "club-runs": "kits/wear/features/club-runs/club-runs.njk",
  "photo-band": "features/photo-band/photo-band.njk",
  "page-links": "features/page-links/page-links.njk",
  "gallery": "features/gallery/gallery.njk",
  "reviews": "features/reviews/reviews.njk",
  "vouchers": "features/vouchers/vouchers.njk",
  "questions": "features/questions/questions.njk",
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
