// @ts-check
/** From the kitchen today: the newest "kitchen" row from the shop's sheet, with how long ago; quiet after six hours. */
import { ago } from "../../lib/bakes.js";
import { startBakes } from "../bakes/sheet-provider.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const note = /** @type {HTMLElement} */ (root.querySelector("[data-kl-note]"));
  startBakes(ctx);
  ctx.watch("bakes", (/** @type {import("../../lib/bakes.js").Bakes} */ b) => {
    const k = b.ok ? b.kitchen : null;
    note.textContent = k ? `${k.note} · ${ago(Date.now() - k.updatedAt)}` : "";
    root.classList.toggle("is-on", Boolean(k));
  });
  root.dataset.ready = "true";
}
