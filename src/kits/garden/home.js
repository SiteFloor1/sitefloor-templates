// @ts-check
/**
 * The garden home page's sections, in their default order. A look can lead with different features by listing every
 * id in its own order (look.json → "homeOrder"), can take sections into its hero (look.json → "heroParts"), and can move
 * sections to a page when that page is on (look.json → "onPages"), so the home page stays short.
 */
export const HOME_PARTS = {
  "the-year": "kits/garden/features/the-year/the-year.njk",
  "garden-calendar": "kits/garden/features/garden-calendar/garden-calendar.njk",
  "what-we-do": "kits/garden/features/what-we-do/what-we-do.njk",
  "gardens": "kits/garden/features/gardens/gardens.njk",
  "sun-study": "kits/garden/features/sun-study/sun-home.njk",
  "through-the-year": "kits/garden/features/through-the-year/through-the-year.njk",
  "before-after": "features/before-after/before-after.njk",
  "reviews": "features/reviews/reviews.njk",
  "questions": "features/questions/questions.njk",
  "visit": "features/visit/visit.njk",
};

/** A look's home order must list every section exactly once. @param {unknown} order @returns {string | null} */
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

/**
 * Sections a look may move off home to a page ("onPages": { "<page feature>": [sections] }). Start your garden (Plan
 * your visit) already lists every question and shows where and when, so questions and visit only leave home; the
 * footer keeps the address and hours. Reviews go to the studio's page, before/after to the gardens page.
 */
export const HOSTABLE = {
  "plan-visit": ["questions", "visit"],
  "team": ["reviews"],
  "garden-pages": ["before-after"],
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
