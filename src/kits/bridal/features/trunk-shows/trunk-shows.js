// @ts-check
/** Trunk shows and sample sales: hide any that have finished since the site was built, so a past date never shows as coming. */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const none = /** @type {HTMLElement|null} */ (root.querySelector("[data-ts-none]"));
  if (!none) throw new Error("trunk shows markup missing");
  const tidy = () => {
    const today = ctx.now().date;
    let left = 0;
    for (const li of root.querySelectorAll("[data-to]")) {
      const done = (/** @type {HTMLElement} */ (li).dataset.to ?? "") < today;
      /** @type {HTMLElement} */ (li).hidden = done;
      if (!done) left++;
    }
    none.hidden = left > 0;
  };
  tidy();
  ctx.everyMinute(tidy);
}
