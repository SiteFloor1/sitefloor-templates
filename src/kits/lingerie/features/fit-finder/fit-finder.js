// @ts-check
/** Fit finder: one problem at a time, chosen by its chip. */
/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) {
  const chips = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll("[data-ff]")]);
  const show = (/** @type {string} */ id) => {
    for (const c of chips) c.setAttribute("aria-pressed", String(c.dataset.ff === id));
    for (const a of root.querySelectorAll("[data-ff-ans]")) a.classList.toggle("on", /** @type {HTMLElement} */ (a).dataset.ffAns === id);
  };
  root.addEventListener("click", (e) => { const c = /** @type {HTMLElement|null} */ (/** @type {Element} */ (e.target).closest("[data-ff]")); if (c) show(c.dataset.ff ?? ""); });
  show(chips[0]?.dataset.ff ?? "");
}
