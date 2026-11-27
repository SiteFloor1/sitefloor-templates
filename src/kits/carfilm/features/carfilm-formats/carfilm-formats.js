// @ts-check
/**
 * The format switch: the frame snaps to each delivered shape (lib/carfilm.js frameBox), and can be dragged or moved
 * with the arrow keys to reframe. Until a format is pressed, the CSS keeps the frame centred at the first shape.
 */
import { frameBox } from "../../lib/carfilm.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) {
  const mon = root.closest(".cf-mon");
  const stage = /** @type {HTMLElement|null} */ (mon?.querySelector("[data-stage]") ?? null);
  const frame = /** @type {HTMLElement|null} */ (mon?.querySelector("[data-frame]") ?? null);
  const btns = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll("[data-fmt]")]);
  if (!stage || !frame || !btns.length) throw new Error("format switch markup missing");
  let r = Number(btns[0].dataset.r), cx = 0.5, cy = 0.5, live = false;
  const place = () => {
    const b = frameBox(r, stage.clientWidth, stage.clientHeight, cx, cy);
    Object.assign(frame.style, { left: `${b.left}px`, top: `${b.top}px`, width: `${b.width}px`, height: `${b.height}px` });
    frame.classList.add("cf-placed");
  };
  const clamp = () => {
    const w = frame.offsetWidth / stage.clientWidth / 2, h = frame.offsetHeight / stage.clientHeight / 2;
    cx = Math.min(Math.max(cx, w), 1 - w); cy = Math.min(Math.max(cy, h), 1 - h);
  };
  for (const b of btns) b.addEventListener("click", () => {
    for (const x of btns) x.setAttribute("aria-pressed", String(x === b));
    r = Number(b.dataset.r); cx = 0.5; cy = 0.5; live = true; place();
  });
  /** @type {{ x: number, y: number, cx: number, cy: number }|null} */ let drag = null;
  frame.addEventListener("pointerdown", (e) => { if (!live) { place(); live = true; } drag = { x: e.clientX, y: e.clientY, cx, cy }; frame.classList.add("cf-drag"); frame.setPointerCapture(e.pointerId); });
  frame.addEventListener("pointermove", (e) => { if (!drag) return; cx = drag.cx + (e.clientX - drag.x) / stage.clientWidth; cy = drag.cy + (e.clientY - drag.y) / stage.clientHeight; clamp(); place(); });
  const end = () => { drag = null; frame.classList.remove("cf-drag"); };
  frame.addEventListener("pointerup", end); frame.addEventListener("pointercancel", end);
  frame.addEventListener("keydown", (e) => {
    const step = { ArrowLeft: [-0.02, 0], ArrowRight: [0.02, 0], ArrowUp: [0, -0.02], ArrowDown: [0, 0.02] }[e.key];
    if (!step) return;
    e.preventDefault(); if (!live) { place(); live = true; } cx += step[0]; cy += step[1]; clamp(); place();
  });
  new ResizeObserver(() => { if (live) place(); }).observe(stage);
}
