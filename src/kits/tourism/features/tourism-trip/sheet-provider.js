// @ts-check
/** Your trip, by code, for client sites: reads the operator's published sheet (CSV). Fails closed. */
import { tripFromCsv } from "../../lib/tourism.js";

const TIMEOUT_MS = 6000;

export const sheetTrip = {
  /** @param {any} ctx @param {string} code */
  async load(ctx, code) {
    const cfg = ctx.data.tourism;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(cfg.trip.csvUrl, { signal: controller.signal, cache: "no-store", credentials: "omit" });
      if (!res.ok) return { ok: false, reason: "unreadable" };
      return tripFromCsv(await res.text(), code, cfg.journeys.map((/** @type {any} */ j) => j.id), ctx.now().date, cfg.trip.staleAfterDays);
    } catch {
      return { ok: false, reason: "unreadable" };
    } finally {
      clearTimeout(timer);
    }
  },
};
