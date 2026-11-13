// @ts-check
/** A garden through the year: the month scale moves between photographs of the same view; it opens on the photograph
 * nearest the visitor's month. */
import { monthOf } from "../../lib/garden.js";

/** The photographed month closest to `m`, going back first (last month's photograph is truer than next month's).
 * @param {number[]} have @param {number} m */
export function nearest(have, m) {
  for (let back = 0; back < 12; back++) { const x = ((m - 1 - back + 12) % 12) + 1; if (have.includes(x)) return x; }
  return have[0];
}

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const shots = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-ty-shot]")]);
  const scale = /** @type {HTMLElement|null} */ (root.querySelector("[data-ty-scale]"));
  const ticks = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll("[data-ty-tick]")]);
  if (!shots.length || !scale || !ticks.length) throw new Error("through-the-year markup missing");
  const have = ticks.map((t) => Number(t.dataset.tyTick));
  root.classList.add("gd-ty-js");
  scale.removeAttribute("data-ty-wait");
  const show = (/** @type {number} */ m, focus = false) => {
    shots.forEach((s) => s.toggleAttribute("data-ty-on", Number(s.dataset.tyShot) === m));
    ticks.forEach((t) => { const on = Number(t.dataset.tyTick) === m; t.setAttribute("aria-pressed", String(on)); if (on && focus) t.focus(); });
  };
  scale.addEventListener("click", (e) => { const t = /** @type {HTMLElement} */ (e.target).closest("[data-ty-tick]"); if (t) show(Number(/** @type {HTMLElement} */ (t).dataset.tyTick)); });
  scale.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const i = ticks.findIndex((t) => t.getAttribute("aria-pressed") === "true");
    show(have[(i + (e.key === "ArrowRight" ? 1 : have.length - 1)) % have.length], true);
  });
  // the first photograph stays where it was before the script; once the stacked layout has settled, crossfade to the
  // visitor's month (a fade, not a move, so nothing shifts)
  show(have[0]);
  const target = nearest(have, monthOf(ctx.now().date));
  if (target !== have[0]) requestAnimationFrame(() => requestAnimationFrame(() => show(target)));
}
