// @ts-check
/** The queue for client sites: the brand's published Google Sheet (CSV: minutes, updated_at). Fails closed: any error or an old row hides the line. */
import { lineFromCsv } from "../../lib/popup.js";

/** @type {import("./popup-line.js").LineProvider} */
export const sheetLine = {
  async load(ctx) {
    const cfg = /** @type {any} */ (ctx.data).line;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    try {
      const res = await fetch(cfg.csvUrl, { signal: controller.signal, cache: "no-store", credentials: "omit" });
      if (!res.ok) return { ok: false };
      return lineFromCsv(await res.text(), Date.now(), cfg.staleAfterMinutes ?? 30, /** @type {any} */ (ctx.data).hours.timezone);
    } catch {
      return { ok: false };
    } finally {
      clearTimeout(timer);
    }
  },
};
