// @ts-check
/**
 * Next free days for client sites: reads the salon's published Google Sheet (CSV: stylist, next free, updated).
 * Fails closed: a network error, a timeout, an unreadable or old sheet returns { ok: false }.
 */
import { freeDaysFromCsv } from "../../lib/hair.js";

const TIMEOUT_MS = 6000;

/** @type {import("./stylists.js").FreeDaysProvider} */
export const sheetFreeDays = {
  async load(ctx) {
    const cfg = /** @type {any} */ (ctx.data).stylists;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(cfg.csvUrl, { signal: controller.signal, cache: "no-store", credentials: "omit" });
      if (!res.ok) return { ok: false };
      return freeDaysFromCsv(await res.text(), ctx.now().date, cfg.staleAfterDays ?? 2);
    } catch {
      return { ok: false };
    } finally {
      clearTimeout(timer);
    }
  },
};
