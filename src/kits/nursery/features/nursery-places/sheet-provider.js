// @ts-check
/**
 * Places for client sites: reads the nursery's published Google Sheet (CSV). Fails closed: a network error, a timeout,
 * an unreadable sheet or old rows return { ok: false } (or leave those months out).
 */
import { placesFromCsv } from "../../lib/nursery.js";

const TIMEOUT_MS = 6000;

/** @type {import("./nursery-places.js").PlacesProvider} */
export const sheetNurseryPlaces = {
  async load(ctx) {
    const cfg = /** @type {any} */ (ctx.data).nursery.places;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(cfg.csvUrl, { signal: controller.signal, cache: "no-store", credentials: "omit" });
      if (!res.ok) return { ok: false };
      return placesFromCsv(await res.text(), Date.now(), cfg.staleAfterDays, ctx.data.hours.timezone, cfg.rooms.map((/** @type {any} */ r) => r.id));
    } catch {
      return { ok: false };
    } finally {
      clearTimeout(timer);
    }
  },
};
