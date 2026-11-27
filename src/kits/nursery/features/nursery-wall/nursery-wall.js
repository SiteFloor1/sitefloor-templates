// @ts-check
/**
 * The work on the walls: steps through the pieces with the arrows (or the arrow keys when an arrow has focus). Nothing
 * moves by itself: the visitor turns the page.
 */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) {
  const pieces = /** @type {HTMLImageElement[]} */ ([...root.querySelectorAll("[data-nu-piece]")]);
  const caps = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-nu-cap]")]);
  if (pieces.length < 2) return;
  let at = 0;
  const show = (/** @type {number} */ n) => {
    at = (n + pieces.length) % pieces.length;
    pieces.forEach((p, i) => { p.hidden = i !== at; p.classList.toggle("is-on", i === at); if (i === at) p.loading = "eager"; });
    caps.forEach((c, i) => { c.hidden = i !== at; });
  };
  root.querySelector("[data-nu-prev]")?.addEventListener("click", () => show(at - 1));
  root.querySelector("[data-nu-next-piece]")?.addEventListener("click", () => show(at + 1));
  root.addEventListener("keydown", (e) => {
    const k = /** @type {KeyboardEvent} */ (e).key;
    if (!(e.target instanceof HTMLButtonElement)) return;
    if (k === "ArrowLeft") show(at - 1);
    if (k === "ArrowRight") show(at + 1);
  });
}
