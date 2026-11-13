// @ts-check
/**
 * An occasion page's pre-order line shows only between the window's opening and order-by dates, by the shop's
 * clock, so a page built before the window opened (or after it closed) never says the wrong thing.
 */
/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const paint = () => {
    const today = ctx.now().date;
    root.hidden = !((root.dataset.preOpens ?? "") <= today && today <= (root.dataset.preCloses ?? ""));
  };
  paint();
  ctx.everyMinute(paint);
}
