// @ts-check
/** Bouquet builder: the florist's own photograph for the chosen palette and size (or the nearest in that palette). */
import { nearestBouquet, orderMessage } from "../../lib/orders.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const B = /** @type {any} */ (ctx.data).florist?.builder;
  const img = /** @type {HTMLImageElement|null} */ (root.querySelector("[data-bb-img]"));
  const note = root.querySelector("[data-bb-note]");
  const send = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-bb-send]"));
  const form = root.querySelector("[data-bb-form]");
  if (!B || !img || !note || !send || !form) throw new Error("bouquet builder: markup or data missing");
  const base = img.getAttribute("src")?.replace(/img\/.*$/, "") ?? "";
  const pick = (/** @type {string} */ n) => /** @type {HTMLInputElement} */ (form.querySelector(`input[name="${n}"]:checked`)).value;
  const refresh = () => {
    const palette = pick("bb-palette"), sizeId = pick("bb-size");
    const b = /** @type {any} */ (nearestBouquet(B.bouquets, palette, sizeId));
    const size = B.sizes.find((/** @type {any} */ s) => s.id === sizeId);
    const pal = B.palettes.find((/** @type {any} */ p) => p.id === palette);
    if (b && !img.src.endsWith(b.photo.src)) { img.src = base + b.photo.src; img.alt = b.photo.alt; img.width = b.photo.width; img.height = b.photo.height; }
    const sizeShown = B.sizes.find((/** @type {any} */ s) => s.id === b?.size);
    note.textContent = b && b.size !== sizeId ? `Shown in ${sizeShown?.label.toLowerCase()}; yours will be ${size.label.toLowerCase()}, in the same flowers.` : "";
    send.href = ctx.waHref(orderMessage({ lead: B.message, item: `${pal.label} bouquet`, size: { label: size.label, price: size.price } }));
  };
  form.addEventListener("change", refresh);
  send.addEventListener("click", refresh);
  refresh();
}
