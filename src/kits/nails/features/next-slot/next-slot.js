// @ts-check
/**
 * The next free appointment under the shade card: asks the provider (the salon's sheet on client sites, a simulation
 * on demos) and words it ("Tomorrow, 10:00"). Anything uncertain says "message us" instead of a time.
 */
import { slotWords } from "../../lib/slot.js";

/** @typedef {{ load: (ctx: import("../../../../core/js/core.js").Ctx) => Promise<{ ok: true, at: string, updatedAt: number } | { ok: false }> }} SlotProvider */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  /** @type {SlotProvider|null} */
  const provider = ctx.providers.slot;
  const when = root.querySelector("[data-ns-when]"), off = /** @type {HTMLElement|null} */ (root.querySelector("[data-ns-off]")), on = /** @type {HTMLElement|null} */ (root.querySelector("[data-ns-on]"));
  if (!provider || !when || !off || !on) throw new Error("next slot markup or provider missing");
  const fail = () => { on.hidden = true; off.hidden = false; };
  provider.load(ctx).then((r) => {
    if (!r.ok) { fail(); return; }
    when.textContent = slotWords(r.at, ctx.now().date);
    off.hidden = true; on.hidden = false;
    ctx.share("nextSlot", r.at);
  }, fail);
}
