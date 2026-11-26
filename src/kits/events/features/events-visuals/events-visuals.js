// @ts-check
/** See your room before the day: switches between the views of one set; the label stays on every view. */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) {
  const views = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-ev-view]")]);
  const buttons = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll("[data-ev-show]")]);
  if (!views.length || !root.querySelector(".ev-label")) throw new Error("design visuals markup missing");
  root.addEventListener("click", (e) => {
    const b = /** @type {HTMLElement} */ (e.target).closest("[data-ev-show]");
    if (!b) return;
    const k = /** @type {HTMLElement} */ (b).dataset.evShow;
    for (const v of views) v.hidden = v.dataset.evView !== k;
    for (const x of buttons) x.setAttribute("aria-pressed", String(x === b));
  });
}
