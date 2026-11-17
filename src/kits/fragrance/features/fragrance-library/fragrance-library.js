// @ts-check
/**
 * Sizes and buying: choosing a size changes Buy to that size's price and link (the house's Stripe Payment Link, or
 * the order on WhatsApp in the house's words). Works on every [data-scent] inside the feature.
 */
import { pounds, fill } from "../../lib/fragrance.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const data = /** @type {any} */ (ctx.data);
  for (const el of root.querySelectorAll("[data-scent]")) {
    const box = /** @type {HTMLElement} */ (el);
    const x = data.fragrances.find((/** @type {any} */ f) => f.id === box.dataset.scent);
    const buy = /** @type {HTMLAnchorElement|null} */ (box.querySelector("[data-buy]"));
    if (!x || !buy) continue;
    const render = () => {
      const picked = /** @type {HTMLInputElement|null} */ (box.querySelector("input[type=radio]:checked"));
      const s = x.sizes.find((/** @type {any} */ z) => String(z.ml) === picked?.value) ?? x.sizes[0];
      buy.textContent = box.closest(".is-before") ? buy.textContent : `Buy, ${pounds(s.price)}`;
      buy.href = s.payLink || ctx.bookHref(fill(data.message, { name: data.name, fragrance: x.name, ml: s.ml, price: pounds(s.price) }));
      box.dispatchEvent(new CustomEvent("fr-size", { bubbles: true, detail: { id: x.id, size: s } }));
    };
    box.addEventListener("change", render);
    render();
  }
}
