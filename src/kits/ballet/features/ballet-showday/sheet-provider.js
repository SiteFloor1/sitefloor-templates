// @ts-check
/**
 * Show day for client sites: reads the school's published Google Sheet (CSV). Fails closed: a network error, a timeout,
 * an unreadable sheet or an old update returns { ok: false }.
 */
import { showDayFromCsv } from "../../lib/ballet.js";

const TIMEOUT_MS = 6000;

/** @type {import("./ballet-showday.js").ShowDayProvider} */
export const sheetShowDay = {
  async load(ctx) {
    const cfg = /** @type {any} */ (ctx.data).showDay;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(cfg.csvUrl, { signal: controller.signal, cache: "no-store", credentials: "omit" });
      if (!res.ok) return { ok: false };
      return showDayFromCsv(await res.text(), Date.now(), cfg.staleAfterDays ?? 14, ctx.data.hours.timezone);
    } catch {
      return { ok: false };
    } finally {
      clearTimeout(timer);
    }
  },
};
