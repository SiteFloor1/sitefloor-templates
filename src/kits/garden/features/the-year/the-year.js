// @ts-check
/** The year in twelve plants: open the visitor's month, open any other on tap or with the arrow keys, and share it. */
import { monthOf } from "../../lib/garden.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const strips = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll("[data-month]")]);
  if (strips.length !== 12) throw new Error("the-year markup missing");
  /** @param {number} m 1–12 @param {boolean} [focus] */
  const open = (m, focus = false) => {
    strips.forEach((b, i) => {
      const on = i + 1 === m;
      b.setAttribute("aria-pressed", String(on));
      b.dataset.pos = String((i + 1 - m + 14) % 12); // phones show the open month and two either side
      const img = /** @type {HTMLImageElement} */ (b.querySelector("img"));
      if (on && img.dataset.full && !img.src.endsWith(img.dataset.full)) { img.removeAttribute("width"); img.removeAttribute("height"); img.src = img.dataset.full; }
    });
    if (focus) strips[m - 1].focus();
    ctx.share("gardenMonth", m);
  };
  // load the next strip's photograph before it is opened, so it is sharp when it widens
  const warm = (/** @type {HTMLButtonElement} */ b) => { const src = b.querySelector("img")?.dataset.full; if (src) new Image().src = src; };
  strips.forEach((b, i) => {
    b.addEventListener("click", () => open(i + 1));
    b.addEventListener("pointerenter", () => warm(b), { once: true });
    b.addEventListener("focus", () => warm(b), { once: true });
  });
  root.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const i = strips.findIndex((b) => b.getAttribute("aria-pressed") === "true");
    open(((i + (e.key === "ArrowRight" ? 1 : 11)) % 12) + 1, true);
  });
  open(monthOf(ctx.now().date));
}
