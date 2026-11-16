// @ts-check
/** Prices: the duo switch shows the trainer's own prices for two, per person. */
/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) {
  const sw = /** @type {HTMLButtonElement|null} */ (root.querySelector("[data-tpp-duo]"));
  if (!sw) return;
  sw.addEventListener("click", () => {
    const two = sw.getAttribute("aria-pressed") !== "true";
    sw.setAttribute("aria-pressed", String(two));
    root.querySelectorAll("tbody tr").forEach((tr) => {
      const has = !!tr.querySelector("[data-two]");
      tr.querySelectorAll("[data-one]").forEach((el) => { /** @type {HTMLElement} */ (el).hidden = two && has; });
      tr.querySelectorAll("[data-two]").forEach((el) => { /** @type {HTMLElement} */ (el).hidden = !two; });
      tr.classList.toggle("tpp-solo", two && !has);
    });
  });
}
