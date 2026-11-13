// @ts-check
/** Insights on the home page: when the firm publishes from its sheet, show the three newest approved rows. */
import { card } from "./render.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const provider = ctx.providers.insights;
  if (!provider) return; // written into site.json: the build already drew them
  const listEl = /** @type {HTMLElement|null} */ (root.querySelector("[data-ins-list]"));
  const off = /** @type {HTMLElement|null} */ (root.querySelector("[data-ins-off]"));
  if (!listEl || !off) throw new Error("insights markup missing");
  const max = Number(listEl.dataset.insMax ?? 3);
  provider.load(ctx).then((/** @type {any} */ r) => {
    if (!r.ok) { if (!listEl.children.length) off.hidden = false; return; }
    listEl.replaceChildren(...r.items.slice(0, max).map((/** @type {any} */ x) => card(root, x, root.dataset.insPage)));
    off.hidden = r.items.length > 0;
  });
}
