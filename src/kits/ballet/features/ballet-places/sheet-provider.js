// @ts-check
/**
 * Places left for client sites: reads the school's published Google Sheet (CSV). Fails closed: a network error, a
 * timeout, an unreadable sheet or an old update returns { ok: false }.
 */
import { placesFromCsv } from "../../lib/ballet.js";

const TIMEOUT_MS = 6000;

/** @type {import("./ballet-places.js").PlacesProvider} */
export const sheetPlaces = {
  async load(ctx) {
    const cfg = /** @type {any} */ (ctx.data).places;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(cfg.csvUrl, { signal: controller.signal, cache: "no-store", credentials: "omit" });
      if (!res.ok) return { ok: false };
      return placesFromCsv(await res.text(), Date.now(), cfg.staleAfterDays ?? 7, ctx.data.hours.timezone);
    } catch {
      return { ok: false };
    } finally {
      clearTimeout(timer);
    }
  },
};
