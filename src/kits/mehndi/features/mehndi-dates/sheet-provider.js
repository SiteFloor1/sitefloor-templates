// @ts-check
/**
 * The artist's diary for client sites: reads the published Google Sheet (CSV). Fails closed: a network error, a
 * timeout, an unreadable sheet or an old update returns { ok: false }.
 */
import { datesFromCsv } from "../../lib/mehndi.js";

const TIMEOUT_MS = 6000;

/** @type {import("./mehndi-dates.js").DatesProvider} */
export const sheetDates = {
  async load(ctx) {
    const cfg = /** @type {any} */ (ctx.data).dateCheck;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(cfg.csvUrl, { signal: controller.signal, cache: "no-store", credentials: "omit" });
      if (!res.ok) return { ok: false };
      return datesFromCsv(await res.text(), Date.now(), cfg.staleAfterDays ?? 21, ctx.data.hours.timezone);
    } catch {
      return { ok: false };
    } finally {
      clearTimeout(timer);
    }
  },
};
