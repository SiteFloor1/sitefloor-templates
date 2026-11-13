// @ts-check
/** Before/after slider: drag, tap or use the arrow keys (it's a native range input under the photos). */

/** @type {import("../../core/js/core.js").FeatureInit} */
export function init(root) {
  for (const fig of root.querySelectorAll("[data-ba]")) {
    const range = /** @type {HTMLInputElement|null} */ (fig.querySelector("[data-ba-range]"));
    const frame = /** @type {HTMLElement|null} */ (fig.querySelector(".ba-frame"));
    if (!range || !frame) continue;
    const set = () => frame.style.setProperty("--ba", `${range.value}%`);
    range.addEventListener("input", set);
    set();
    /** @type {HTMLElement} */ (fig).dataset.baReady = "";
  }
  // a nudge so people see it moves, once, when it first comes into view
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
  const first = /** @type {HTMLElement|null} */ (root.querySelector("[data-ba] .ba-frame"));
  const range = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-ba-range]"));
  if (!first || !range) return;
  const io = new IntersectionObserver((e) => {
    if (!e.some((x) => x.isIntersecting)) return;
    io.disconnect();
    const t0 = performance.now();
    const step = (/** @type {number} */ t) => {
      if (document.activeElement === range) return;
      const k = Math.min(1, (t - t0) / 1400);
      range.value = String(Math.round(50 + Math.sin(k * Math.PI * 2) * 22));
      first.style.setProperty("--ba", `${range.value}%`);
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, { threshold: 0.6 });
  io.observe(first);
}
