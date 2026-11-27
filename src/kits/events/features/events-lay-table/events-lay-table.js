// @ts-check
/** Lay the table: three dressings of one table from one camera; choosing one shows it in place. */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) {
  const views = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-el-view]")]);
  const buttons = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll("[data-el-show]")]);
  if (views.length !== 3 || buttons.length !== 3 || !root.querySelector(".ev-label")) throw new Error("lay the table markup missing");
  root.addEventListener("click", (e) => {
    const b = /** @type {HTMLElement} */ (e.target).closest("[data-el-show]");
    if (!b) return;
    const k = /** @type {HTMLElement} */ (b).dataset.elShow;
    for (const v of views) v.hidden = v.dataset.elView !== k;
    for (const x of buttons) x.setAttribute("aria-pressed", String(x === b));
  });
}
