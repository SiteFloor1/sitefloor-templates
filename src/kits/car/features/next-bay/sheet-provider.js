// @ts-check
/**
 * Next free bay for client sites: reads the studio's published Google Sheet (CSV). Fails closed: a network
 * error, timeout, unreadable sheet, past date or old update returns { ok: false }.
 */
import { bayFromCsv } from "../../lib/bay.js";

const TIMEOUT_MS = 6000;

/** @type {import("./next-bay.js").BayProvider} */
export const sheetBay = {
  async load(ctx) {
    const cfg = /** @type {any} */ (ctx.data).bay;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(cfg.csvUrl, { signal: controller.signal, cache: "no-store", credentials: "omit" });
      if (!res.ok) return { ok: false };
      return bayFromCsv(await res.text(), Date.now(), cfg.staleAfterHours ?? 48, ctx.data.hours.timezone, ctx.now().date);
    } catch {
      return { ok: false };
    } finally {
      clearTimeout(timer);
    }
  },
};
