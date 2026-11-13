// @ts-check
/** Gardens by kind: the choice above the list shows only gardens of that kind. Also used on the gardens page. */

/** @param {HTMLElement} root */
export function styleFilter(root) {
  const row = /** @type {HTMLElement|null} */ (root.querySelector("[data-gs-filter]"));
  if (!row) return;
  const cards = /** @type {HTMLElement[]} */ ([...root.querySelectorAll(".gd-gc")]);
  const none = /** @type {HTMLElement|null} */ (root.querySelector("[data-gs-none]"));
  row.removeAttribute("data-wait");
  row.addEventListener("click", (e) => {
    const b = /** @type {HTMLElement} */ (e.target).closest("button");
    if (!b) return;
    const style = b.dataset.style ?? "";
    row.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    let shown = 0;
    for (const c of cards) { c.hidden = !!style && c.dataset.style !== style; if (!c.hidden) shown++; }
    if (none) none.hidden = shown > 0;
  });
}

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) { styleFilter(root); }
