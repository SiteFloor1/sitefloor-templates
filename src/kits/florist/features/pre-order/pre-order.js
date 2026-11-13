// @ts-check
/**
 * Pre-order windows: each shows from its opening date to its order-by date (the florist's own), by the shop's clock,
 * so a page built last week never shows a closed window. When none is open the section is empty and hidden.
 */
/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const paint = () => {
    const today = ctx.now().date;
    let any = false;
    for (const w of /** @type {NodeListOf<HTMLElement>} */ (root.querySelectorAll("[data-pre-opens]"))) {
      const open = (w.dataset.preOpens ?? "") <= today && today <= (w.dataset.preCloses ?? "");
      w.hidden = !open;
      any ||= open;
    }
    root.hidden = !any;
  };
  paint();
  ctx.everyMinute(paint);
}
