// @ts-check
/** Notes on the bottle: tap a note to read, under its clause, which other scents in the house have it. */
import { alsoInLine } from "../../lib/fragrance.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const items = /** @type {any} */ (ctx.data).fragrances, id = root.dataset.fragrance ?? "";
  const notes = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll(".fr-note")]);
  const show = (/** @type {HTMLButtonElement|null} */ b) => {
    for (const n of notes) n.setAttribute("aria-pressed", String(n === b));
    for (const a of root.querySelectorAll(".fr-also")) a.textContent = "";
    if (!b) return;
    const also = b.closest(".fr-clause-t")?.querySelector(".fr-also");
    if (also) also.textContent = alsoInLine(items, b.textContent ?? "", id);
  };
  for (const b of notes) b.addEventListener("click", () => show(b.getAttribute("aria-pressed") === "true" ? null : b));
}
