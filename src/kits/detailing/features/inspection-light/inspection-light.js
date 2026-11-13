// @ts-check
/**
 * The inspection light: drag anywhere on the photograph (or use the arrow keys on the grip) to move the beam; the
 * studio's after photograph shows inside it. One slow pass on load shows it's a light, unless motion is turned down.
 */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) {
  const handle = /** @type {HTMLElement|null} */ (root.querySelector("[data-il-handle]"));
  if (!handle) throw new Error("inspection light markup missing");
  let x = 58, drag = false;
  const set = (/** @type {number} */ v) => { x = Math.max(0, Math.min(100, v)); root.style.setProperty("--x", `${x}%`); handle.setAttribute("aria-valuenow", String(Math.round(x))); };
  const at = (/** @type {PointerEvent} */ e) => { const r = root.getBoundingClientRect(); set(((e.clientX - r.left) / r.width) * 100); };
  root.addEventListener("pointerdown", (e) => { drag = true; root.setPointerCapture(e.pointerId); at(e); });
  root.addEventListener("pointermove", (e) => { if (drag) at(e); });
  root.addEventListener("pointerup", () => { drag = false; });
  root.addEventListener("pointercancel", () => { drag = false; });
  handle.addEventListener("keydown", (e) => {
    const step = e.shiftKey ? 10 : 3, k = e.key;
    if (k === "ArrowLeft" || k === "ArrowDown") set(x - step);
    else if (k === "ArrowRight" || k === "ArrowUp") set(x + step);
    else if (k === "Home") set(0);
    else if (k === "End") set(100);
    else return;
    e.preventDefault();
  });
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const from = 24, to = 58, ms = 2200;
  /** @type {number|null} */ let t0 = null;
  const step = (/** @type {number} */ t) => {
    if (drag) return;
    t0 ??= t;
    const p = Math.min(1, (t - t0) / ms), ease = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    set(from + (to - from) * ease);
    if (p < 1) requestAnimationFrame(step);
  };
  set(from);
  requestAnimationFrame(step);
}
