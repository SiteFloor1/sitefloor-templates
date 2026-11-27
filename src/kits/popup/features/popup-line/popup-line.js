// @ts-check
/** The queue now: reads the brand's sheet (or the demo's simulation) every five minutes; shown only while the pop-up is open and the row is fresh. */
import { resolveStops, currentStop, isOpen, lineWords } from "../../lib/popup.js";

/** @typedef {{ load: (ctx: import("../../../../core/js/core.js").Ctx) => Promise<{ ok: true, minutes: number, at: string } | { ok: false }> }} LineProvider */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const data = /** @type {any} */ (ctx.data);
  /** @type {LineProvider|null} */ const provider = ctx.providers.popupLine;
  if (!provider) throw new Error("queue provider missing");
  const s = currentStop(resolveStops(data.popup, ctx.now().date), ctx.now().date);
  let tick = 0;
  const load = () => provider.load(ctx).then((r) => {
    const open = s && isOpen(data.hours, s, ctx.now());
    /** @type {HTMLElement} */ (root).hidden = !(r.ok && open);
    root.textContent = r.ok && open ? lineWords(r.minutes, r.at) : "";
  }, () => { /** @type {HTMLElement} */ (root).hidden = true; });
  load();
  ctx.everyMinute(() => { if (++tick % 5 === 0) load(); });
}
