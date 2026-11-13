// @ts-check
/** Gentle parallax on the full-width photo. Skipped when the visitor prefers reduced motion. */

const TRAVEL_PX = 60;
const OFFSET_PX = 40;

/** @type {import("../../core/js/core.js").FeatureInit} */
export function init(root) {
  const img = root.querySelector("img");
  if (!img || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  let queued = false;
  const update = () => {
    queued = false;
    const r = root.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    img.style.setProperty("--py", `${(-(r.top / innerHeight) * TRAVEL_PX - OFFSET_PX).toFixed(1)}px`);
  };
  addEventListener("scroll", () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
  update();
}
