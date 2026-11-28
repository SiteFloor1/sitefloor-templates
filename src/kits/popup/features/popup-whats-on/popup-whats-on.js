// @ts-check
/** What's on: hides events whose day has gone, for the visitor's day (a page built days ago never shows a past event). */
import { addDays } from "../../lib/popup.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).programme;
  const today = ctx.now().date;
  let shown = 0;
  for (const e of cfg?.items ?? []) {
    const ymd = typeof e.date === "number" ? addDays(today, e.date) : e.date;
    const li = /** @type {HTMLElement|null} */ (root.querySelector(`[data-wo="${e.id}"]`));
    if (!li) continue;
    li.hidden = ymd < today;
    if (!li.hidden) shown++;
  }
  const empty = /** @type {HTMLElement|null} */ (root.querySelector("[data-wo-empty]"));
  if (empty) empty.hidden = shown > 0;
}
