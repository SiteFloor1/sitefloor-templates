// @ts-check
/** The pieces carousel: arrows that move one piece at a time, and the stock words from the brand's sheet. */
import { paintStock } from "../../browser/stock.js";

/** @param {HTMLElement} root @param {import("../../../../core/js/core.js").Ctx} ctx */
export function init(root, ctx) {
  const track = /** @type {HTMLElement|null} */ (root.querySelector("[data-track]"));
  const arrows = /** @type {HTMLElement|null} */ (root.querySelector(".wr-arrows"));
  if (track && arrows) {
    arrows.hidden = false;
    for (const b of /** @type {NodeListOf<HTMLButtonElement>} */ (arrows.querySelectorAll("button"))) {
      b.addEventListener("click", () => {
        const step = /** @type {HTMLElement|null} */ (track.firstElementChild)?.offsetWidth ?? 300;
        track.scrollBy({ left: Number(b.dataset.dir) * (step + 16), behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      });
    }
  }
  paintStock(root);
  ctx.everyMinute(() => paintStock(root));
}
