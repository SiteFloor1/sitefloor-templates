// @ts-check
/** Speak to a partner: show only the card for the chosen practice area. */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) {
  const pick = /** @type {HTMLSelectElement|null} */ (root.querySelector("#enq-area"));
  const cards = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-area]")]);
  if (!pick || !cards.length) throw new Error("enquiry markup missing");
  const show = () => { for (const c of cards) c.classList.toggle("is-on", c.dataset.area === pick.value); };
  pick.addEventListener("change", show);
  show();
  root.setAttribute("data-ready", "");
}
