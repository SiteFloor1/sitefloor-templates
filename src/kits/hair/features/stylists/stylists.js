// @ts-check
/**
 * Next free days under each stylist, from the salon's published sheet (or the demo's simulation). Fails closed: an old
 * or unreadable sheet leaves the lines empty. Shares the days with the stylist match.
 */
import { freeWords } from "../../lib/hair.js";

/** @typedef {{ load: (ctx: import("../../../../core/js/core.js").Ctx) => Promise<{ ok: true, days: Record<string, string> } | { ok: false }> }} FreeDaysProvider */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const provider = /** @type {FreeDaysProvider|undefined} */ (ctx.providers.freeDays);
  const lines = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-st-free]")]);
  if (!lines.length) throw new Error("stylists markup missing");
  if (!provider) return;
  const show = async () => {
    /** @type {{ ok: true, days: Record<string, string> } | { ok: false }} */ let r;
    try { r = await provider.load(ctx); } catch { r = { ok: false }; }
    const today = ctx.now().date;
    for (const el of lines) {
      const day = r.ok ? r.days[el.dataset.stFree ?? ""] : undefined;
      el.textContent = day ? `Next free ${freeWords(day, today)}` : " ";
      el.toggleAttribute("data-on", Boolean(day));
    }
    ctx.share("freeDays", r.ok ? r.days : {});
  };
  show();
  ctx.everyMinute(() => { if (new Date().getMinutes() % 15 === 0) show(); });
}
