// @ts-check
/** Under the dress: one dress at a time, chosen by its chip. */
/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) {
  const chips = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll("[data-ud]")]);
  const show = (/** @type {string} */ id) => {
    for (const c of chips) c.setAttribute("aria-pressed", String(c.dataset.ud === id));
    for (const a of root.querySelectorAll("[data-ud-ans]")) a.classList.toggle("on", /** @type {HTMLElement} */ (a).dataset.udAns === id);
  };
  root.addEventListener("click", (e) => { const c = /** @type {HTMLElement|null} */ (/** @type {Element} */ (e.target).closest("[data-ud]")); if (c) show(c.dataset.ud ?? ""); });
  show(chips[0]?.dataset.ud ?? "");
}
