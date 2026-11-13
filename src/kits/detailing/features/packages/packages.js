// @ts-check
/**
 * Packages by size: the size switch swaps each package's "from" price (every size's price is already in the markup).
 * The chosen size is shared, so the builder and the coverages show the same car.
 */
import { gbp } from "../../../../core/lib/text.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const show = (/** @type {string} */ size) => {
    for (const b of /** @type {NodeListOf<HTMLElement>} */ (document.querySelectorAll("[data-size-price]"))) {
      const p = JSON.parse(b.dataset.sizePrice ?? "{}")[size];
      b.textContent = Number.isInteger(p) ? gbp(p) : "Ask us";
    }
    for (const r of /** @type {NodeListOf<HTMLInputElement>} */ (document.querySelectorAll("[data-size-pick]"))) r.checked = r.value === size;
  };
  root.addEventListener("change", (e) => {
    const t = /** @type {HTMLInputElement} */ (e.target);
    if (t.matches("[data-size-pick]")) ctx.share("detailSize", t.value);
  });
  ctx.watch("detailSize", (size) => show(size));
}
