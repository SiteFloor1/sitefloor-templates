// @ts-check
/** HOL-2: choosing a region shows its rules. Every panel is in the page already; this only shows one. */
/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) {
  const btns = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll("[data-st-region]")]);
  const panels = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-st-panel]")]);
  for (const b of btns) b.addEventListener("click", () => {
    for (const x of btns) x.setAttribute("aria-pressed", String(x === b));
    for (const p of panels) p.hidden = p.dataset.stPanel !== b.dataset.stRegion;
  });
}
