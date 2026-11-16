// @ts-check
/**
 * The live count: reads the club's door count (or the demo's simulated one) now and every minute, and shares it as
 * "gymCount" for the hero to show. Fails closed: anything stale or unreadable is shared as { ok: false }, and the hero
 * goes back to "usually".
 */
/** @typedef {{ load: (ctx: import("../../../../core/js/core.js").Ctx) => Promise<import("../../lib/gym.js").LiveCount> }} CountProvider */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(_root, ctx) {
  /** @type {CountProvider|null} */
  const provider = ctx.providers.gymCount;
  if (!provider) { ctx.share("gymCount", { ok: false }); return; }
  const load = () => provider.load(ctx).then((r) => ctx.share("gymCount", r), () => ctx.share("gymCount", { ok: false }));
  load();
  ctx.everyMinute(() => { if (!document.hidden) load(); });
}
