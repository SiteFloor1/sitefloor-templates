// @ts-check
/**
 * Places left for client sites: the studio's Google Sheet published as CSV, read with a timeout and kept for a minute.
 * Fails closed: a network error, a timeout or an unreadable sheet returns { ok: false }, and no places show.
 */
import { placesFromCsv } from "../../lib/places.js";

const TIMEOUT_MS = 6000;
/** @type {Promise<import("../../lib/places.js").Places>|null} */
let pending = null;
let loadedAt = 0;

/** @type {import("./spaces-left.js").PlacesProvider} */
export const sheetPlaces = {
  load(ctx) {
    if (pending && Date.now() - loadedAt < 55_000) return pending;
    loadedAt = Date.now();
    const cfg = /** @type {any} */ (ctx.data).pilates.places;
    pending = (async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      try {
        const res = await fetch(cfg.csvUrl, { signal: controller.signal, cache: "no-store", credentials: "omit" });
        if (!res.ok) return { ok: false };
        return placesFromCsv(await res.text(), Date.now(), ctx.data.hours.timezone, cfg.staleAfterMinutes ?? 30, /** @type {any} */ (ctx.data).pilates.reformers || undefined);
      } catch {
        return { ok: false };
      } finally {
        clearTimeout(timer);
      }
    })();
    return /** @type {Promise<import("../../lib/places.js").Places>} */ (pending);
  },
};
