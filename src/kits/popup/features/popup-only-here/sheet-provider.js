// @ts-check
/** Stock for client sites: the brand's published Google Sheet (CSV: id, sold_out, updated_at). Fails closed. */
import { stockFromCsv } from "../../lib/popup.js";

/** @type {import("./popup-only-here.js").StockProvider} */
export const sheetStock = {
  async load(ctx) {
    const cfg = /** @type {any} */ (ctx.data).stock;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    try {
      const res = await fetch(cfg.csvUrl, { signal: controller.signal, cache: "no-store", credentials: "omit" });
      if (!res.ok) return { ok: false };
      return stockFromCsv(await res.text(), Date.now(), cfg.ids, cfg.staleAfterDays ?? 3, /** @type {any} */ (ctx.data).hours.timezone);
    } catch {
      return { ok: false };
    } finally {
      clearTimeout(timer);
    }
  },
};
