// @ts-check
/**
 * Places left: reads the studio's sheet once per page and every minute after, and shares it as "places" for the
 * timetable (and the class finder) to draw. Shows the key to the marks only while places are known.
 */
/** @typedef {{ load: (ctx: import("../../../../core/js/core.js").Ctx) => Promise<import("../../lib/places.js").Places> }} PlacesProvider */

let started = false;

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  ctx.watch("places", (p) => { root.hidden = !p?.ok || !Object.keys(p.left).length; });
  if (started) return;
  started = true;
  /** @type {PlacesProvider|null} */
  const provider = ctx.providers.places;
  if (!provider) { ctx.share("places", { ok: false }); return; }
  const load = () => provider.load(ctx).then((r) => ctx.share("places", r), () => ctx.share("places", { ok: false }));
  load();
  ctx.everyMinute(() => { if (!document.hidden) load(); });
}
