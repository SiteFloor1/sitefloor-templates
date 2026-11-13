// @ts-check
/** Paint correction on a 3D car: the stage loads on tap; the range moves the strip light along the car. */
import { stage } from "./stage.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const wrap = /** @type {HTMLElement|null} */ (root.querySelector("[data-c3-light]")), range = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-c3-range]"));
  if (!wrap || !range) throw new Error("correction markup missing");
  stage(root, ctx, "correction", (bay) => {
    wrap.hidden = false;
    const move = () => bay.light(Number(range.value) / 100);
    range.addEventListener("input", move);
    move();
  });
}
