// @ts-check
/**
 * Tonight's sheet for client sites: reads the shop's published Google Sheet (CSV) once and shares it between the
 * counter, the menu, the late-night band, the dessert box and the cake date. Refreshed after two minutes. Fails closed:
 * a network error, timeout or unreadable sheet returns { ok: false }.
 */
import { bakesFromCsv } from "../../lib/bakes.js";

const TIMEOUT_MS = 6000;

/** @typedef {{ load: (ctx: import("../../../../core/js/core.js").Ctx) => Promise<import("../../lib/bakes.js").Bakes> }} BakesProvider */

/** @type {Promise<import("../../lib/bakes.js").Bakes>|null} */
let pending = null;
let loadedAt = 0;

/** @type {BakesProvider} */
export const sheetBakes = {
  load(ctx) {
    if (pending && Date.now() - loadedAt < 120_000) return pending;
    loadedAt = Date.now();
    const cfg = /** @type {any} */ (ctx.data).bakes;
    pending = (async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      try {
        const res = await fetch(cfg.csvUrl, { signal: controller.signal, cache: "no-store", credentials: "omit" });
        if (!res.ok) return { ok: false };
        return bakesFromCsv(await res.text(), Date.now(), ctx.data.hours.timezone, cfg.staleAfterMinutes ?? 45);
      } catch {
        return { ok: false };
      } finally {
        clearTimeout(timer);
      }
    })();
    return /** @type {Promise<import("../../lib/bakes.js").Bakes>} */ (pending);
  },
};

/**
 * Starts the shared sheet once per page for every feature that needs it, and keeps it fresh each minute.
 * The result is shared as "bakes" (ctx.watch("bakes", …)).
 * @param {import("../../../../core/js/core.js").Ctx} ctx
 */
export function startBakes(ctx) {
  const w = /** @type {any} */ (window);
  if (w.__sfBakes) return;
  w.__sfBakes = true;
  /** @type {BakesProvider|null} */
  const provider = ctx.providers.bakes;
  if (!provider) { ctx.share("bakes", { ok: false }); return; }
  const load = () => provider.load(ctx).then((r) => ctx.share("bakes", r), () => ctx.share("bakes", { ok: false }));
  load();
  ctx.everyMinute(() => { if (!document.hidden) load(); });
}
