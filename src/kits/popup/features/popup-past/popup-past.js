// @ts-check
/** Past pop-ups: shows the stops whose last day has gone for the visitor's day, latest first. */
import { resolveStops, tourOrder, stopState } from "../../lib/popup.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const data = /** @type {any} */ (ctx.data), today = ctx.now().date;
  const list = root.querySelector("[data-past-list]"), none = /** @type {HTMLElement|null} */ (root.querySelector("[data-past-none]"));
  if (!list) return;
  let shown = 0;
  for (const s of tourOrder(resolveStops(data.popup, today), today)) {
    const li = /** @type {HTMLElement|null} */ (list.querySelector(`[data-past="${s.id}"]`));
    if (!li) continue;
    li.hidden = stopState(s, today).kind !== "ended";
    if (!li.hidden) { shown++; list.append(li); }
  }
  if (none) none.hidden = shown > 0;
}
