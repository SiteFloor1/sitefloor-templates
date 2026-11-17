// @ts-check
/**
 * Places left: reads the club's sheet once per page and every minute after, and shares it as "gymPlaces" for the
 * classes and the heat-and-cold slots to write beside each session. Only fresh rows count; anything else shares
 * { ok: false } and every session shows "Book in the app" alone.
 */
/** @typedef {{ load: (ctx: import("../../../../core/js/core.js").Ctx) => Promise<import("../../lib/gym.js").Places> }} PlacesProvider */

let started = false;

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(_root, ctx) {
  if (started) return;
  started = true;
  /** @type {PlacesProvider|null} */
  const provider = ctx.providers.gymPlaces;
  if (!provider) { ctx.share("gymPlaces", { ok: false }); return; }
  const load = () => provider.load(ctx).then((r) => ctx.share("gymPlaces", r), () => ctx.share("gymPlaces", { ok: false }));
  load();
  ctx.everyMinute(() => { if (!document.hidden) load(); });
}
