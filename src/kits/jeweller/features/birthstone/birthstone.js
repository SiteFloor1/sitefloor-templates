// @ts-check
/** Shows the month for today in the shop's timezone (the page may have been built last month). */
/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const paint = () => {
    const m = Number(ctx.now().date.slice(5, 7));
    for (const el of root.querySelectorAll("[data-month]")) /** @type {HTMLElement} */ (el).hidden = Number(/** @type {HTMLElement} */ (el).dataset.month) !== m;
    for (const el of root.querySelectorAll("[data-month-row]")) el.classList.toggle("is-now", Number(/** @type {HTMLElement} */ (el).dataset.monthRow) === m);
  };
  paint();
  ctx.everyMinute(paint);
}
