// @ts-check
/** Treatments by concern and by time: one list shows at a time; every list is already in the page. */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) {
  const by = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll("[data-by]")]);
  const views = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-view]")]);
  if (!by.length || !views.length) throw new Error("menu markup missing");
  by.forEach((b) => b.addEventListener("click", () => {
    by.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    views.forEach((v) => { v.hidden = v.dataset.view !== b.dataset.by; });
  }));
}
