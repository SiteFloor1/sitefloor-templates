// @ts-check
/** In season now: the florist's Sheet can change each stem's word (rows "season,<id>,just-in|plenty|last-week"). */
import { startStudio } from "../../lib/studio.js";

const WORDS = /** @type {Record<string, string>} */ ({ "just-in": "Just in", "plenty": "Plenty", "last-week": "Last week" });

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  startStudio(ctx);
  ctx.watch("studio", (/** @type {any} */ s) => {
    if (!s?.ok) return;
    for (const [id, status] of Object.entries(/** @type {Record<string, string>} */ (s.season ?? {}))) {
      const el = /** @type {HTMLElement|null} */ (root.querySelector(`[data-stem="${CSS.escape(id)}"] [data-status]`));
      const v = status.toLowerCase().replace(/\s+/g, "-");
      if (el && WORDS[v]) { el.dataset.status = v; el.textContent = WORDS[v]; }
    }
  });
}
