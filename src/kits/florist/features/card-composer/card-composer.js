// @ts-check
/** The card: live preview on the florist's card, held to their own length and lines. The order button reads the text. */
import { cardText } from "../../lib/orders.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const C = /** @type {any} */ (ctx.data).florist?.card;
  const input = /** @type {HTMLTextAreaElement|null} */ (root.querySelector("[data-card-input]"));
  const preview = root.querySelector("[data-card-preview]");
  const left = root.querySelector("[data-card-left]");
  if (!C || !input || !preview || !left) throw new Error("card composer markup missing");
  const paint = () => {
    const c = cardText(input.value, C.max, C.lines);
    if (c.text !== input.value) input.value = c.text;
    preview.textContent = c.text;
    left.textContent = String(Math.max(0, C.max - c.text.length));
  };
  input.addEventListener("input", paint);
  for (const b of root.querySelectorAll("[data-card-start]")) b.addEventListener("click", () => { input.value = b.textContent ?? ""; paint(); input.focus(); input.dispatchEvent(new Event("input", { bubbles: true })); });
  paint();
}
