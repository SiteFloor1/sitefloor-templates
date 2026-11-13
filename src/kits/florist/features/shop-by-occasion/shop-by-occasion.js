// @ts-check
/** Shop by occasion: the budget chips hide occasions that start above the chosen price. */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) {
  const none = /** @type {HTMLElement|null} */ (root.querySelector("[data-occ-none]"));
  const items = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-from]")]);
  root.addEventListener("change", (e) => {
    const t = /** @type {HTMLInputElement} */ (e.target);
    if (t.name !== "occ-budget") return;
    const max = Number(t.value);
    let shown = 0;
    for (const li of items) { const ok = !max || Number(li.dataset.from) <= max; li.hidden = !ok; if (ok) shown++; }
    if (none) none.hidden = shown > 0;
  });
}
