// @ts-check
/**
 * Launch mode: the page checks the house's date on the day (UK time) and switches itself from "before launch" to
 * the shop. On a demo only, a quiet control shows either state.
 */
import { launchState } from "../../lib/fragrance.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const L = /** @type {any} */ (ctx.data).launch;
  if (!L) return;
  const today = ctx.now().date;
  const set = (/** @type {boolean} */ before) => {
    for (const el of document.querySelectorAll("[data-launch-scope]")) el.classList.toggle("is-before", before);
    for (const b of root.querySelectorAll("[data-launch-show]")) b.setAttribute("aria-pressed", String((b.getAttribute("data-launch-show") === "before") === before));
  };
  const real = launchState(L, today).state === "before";
  // A demo opens as the shop; its control shows the page as it would be before launch.
  set(L.demo ? false : real);
  for (const b of root.querySelectorAll("[data-launch-show]")) b.addEventListener("click", () => set(b.getAttribute("data-launch-show") === "before"));
}
