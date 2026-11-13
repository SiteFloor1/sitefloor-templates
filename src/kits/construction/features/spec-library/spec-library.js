// @ts-check
/** The specification library's filter: show one kind of material, or all. */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) {
  const buttons = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll("[data-spec-cat]")]);
  const items = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-cat]")]);
  for (const b of buttons) b.addEventListener("click", () => {
    const cat = b.dataset.specCat ?? "";
    for (const x of buttons) x.setAttribute("aria-pressed", String(x === b));
    for (const it of items) it.hidden = !!cat && it.dataset.cat !== cat;
  });
}
