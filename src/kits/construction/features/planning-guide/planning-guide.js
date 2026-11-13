// @ts-check
/** The planning guide: follows the visualiser's house and depth, moves the marker and the words, draws the limits. */
import { rearZone } from "../../lib/planning.js";

/** Where the marker sits on the scale: 0–60% is up to the prior-approval depth, the rest is beyond it. @param {number} depth @param {{ pd: number, prior: number }} l */
export const markAt = (depth, l) => Math.round(Math.min(98, depth <= l.prior ? (depth / l.prior) * 66 : 66 + Math.min(1, (depth - l.prior) / l.prior) * 34) * 10) / 10;

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const q = (/** @type {string} */ s) => /** @type {HTMLElement} */ (root.querySelector(s));
  const scale = q("[data-pg-scale]");
  if (!scale) throw new Error("planning guide markup missing");
  /** @type {any} */ let drawnFor = null;
  ctx.watch("extension", (/** @type {{ state: any, model: any }} */ ext) => {
    const z = rearZone(ext.state.house, ext.state.depth);
    scale.dataset.zone = z.zone;
    q("[data-pg-mark]").style.left = `${markAt(ext.state.depth, z.limits)}%`;
    q("[data-pg-pd]").textContent = `up to ${z.limits.pd} m`;
    q("[data-pg-prior]").textContent = `${z.limits.pd} to ${z.limits.prior} m`;
    q("[data-pg-over]").textContent = `over ${z.limits.prior} m`;
    q("[data-pg-now]").textContent = z.words;
    const key = ext.model ? `${ext.state.house}` : null;
    if (ext.model && (drawnFor !== key || !ext.model.limitsDrawn)) { ext.model.setLimits(z.limits); ext.model.limitsDrawn = true; drawnFor = key; }
  });
}
