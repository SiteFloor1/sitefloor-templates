// @ts-check
/**
 * Tonight's sheet for client sites (specials, sold-out dishes, walk-in tables): reads the restaurant's
 * published Google Sheet (CSV) once per page and shares the result. Fails closed: a network error,
 * timeout or unreadable sheet returns { ok: false }.
 */
import { tonightFromCsv } from "../../lib/tonight.js";

const TIMEOUT_MS = 6000;

/** @typedef {{ load: (ctx: import("../../../../core/js/core.js").Ctx) => Promise<import("../../lib/tonight.js").Tonight> }} TonightProvider */

/** @type {Promise<import("../../lib/tonight.js").Tonight>|null} */
let pending = null;
let loadedAt = 0;

/** @type {TonightProvider} */
export const sheetTonight = {
  load(ctx) {
    // Specials and the live board share one request; it's refreshed after two minutes.
    if (pending && Date.now() - loadedAt < 120_000) return pending;
    loadedAt = Date.now();
    const cfg = /** @type {any} */ (ctx.data).tonight;
    pending = (async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      try {
        const res = await fetch(cfg.csvUrl, { signal: controller.signal, cache: "no-store", credentials: "omit" });
        if (!res.ok) return { ok: false };
        return tonightFromCsv(await res.text(), Date.now(), ctx.data.hours.timezone, cfg.staleAfterMinutes ?? 45);
      } catch {
        return { ok: false };
      } finally {
        clearTimeout(timer);
      }
    })();
    return pending;
  },
};
