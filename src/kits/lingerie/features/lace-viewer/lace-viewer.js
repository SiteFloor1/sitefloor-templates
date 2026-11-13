// @ts-check
/** The lace loupe: follows the pointer or finger over the photograph; arrow keys move it; Escape hides it. */
import { must } from "../dom.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) {
  const stage = /** @type {HTMLElement} */ (must(root, "[data-lace-stage]"));
  const loupe = /** @type {HTMLElement} */ (must(root, "[data-lace-loupe]"));
  const zoom = Number(stage.dataset.zoom) || 2.5;
  let x = 0.5, y = 0.5;
  const place = () => {
    const r = stage.getBoundingClientRect();
    loupe.hidden = false;
    loupe.style.left = `${x * r.width}px`;
    loupe.style.top = `${y * r.height}px`;
    loupe.style.backgroundSize = `${r.width * zoom}px ${r.height * zoom}px`;
    const size = loupe.offsetWidth / 2;
    loupe.style.backgroundPosition = `${-(x * r.width * zoom - size)}px ${-(y * r.height * zoom - size)}px`;
  };
  const at = (/** @type {PointerEvent} */ e) => {
    const r = stage.getBoundingClientRect();
    x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    place();
  };
  stage.addEventListener("pointermove", at);
  stage.addEventListener("pointerdown", at);
  stage.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") loupe.hidden = true; });
  stage.addEventListener("keydown", (e) => {
    const step = 0.05;
    if (e.key === "Escape") { loupe.hidden = true; return; }
    const moves = /** @type {Record<string, [number, number]>} */ ({ ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] });
    const m = moves[e.key];
    if (!m) return;
    e.preventDefault();
    x = Math.min(1, Math.max(0, x + m[0]));
    y = Math.min(1, Math.max(0, y + m[1]));
    place();
  });
  stage.addEventListener("focus", place);
}
