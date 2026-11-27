// @ts-check
/** The work by car: one group at a time, or all. */
/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) {
  const btns = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll("[data-group]")]);
  const items = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-in]")]);
  for (const b of btns) b.addEventListener("click", () => {
    for (const x of btns) x.setAttribute("aria-pressed", String(x === b));
    for (const i of items) i.hidden = !!b.dataset.group && i.dataset.in !== b.dataset.group;
  });
}
