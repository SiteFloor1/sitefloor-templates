// @ts-check
/** Insights for client sites: the firm's own Google Sheet, published as CSV. Only compliance-approved rows. Fails closed. */
import { insightsFromCsv } from "../../lib/insights.js";
import { zonedNow } from "../../../../core/lib/hours.js";

const TIMEOUT_MS = 6000;
/** @type {Promise<any>|null} */ let once = null;

export const sheetInsights = {
  /** @param {any} ctx */
  load(ctx) {
    once ??= (async () => {
      const cfg = ctx.data.insights;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      try {
        const res = await fetch(cfg.csvUrl, { signal: controller.signal, cache: "no-store", credentials: "omit" });
        if (!res.ok) return { ok: false };
        const read = insightsFromCsv(await res.text(), { today: zonedNow(new Date(), ctx.data.hours.timezone).date, photos: cfg.photos });
        return { ok: true, items: read.items };
      } catch {
        return { ok: false };
      } finally {
        clearTimeout(timer);
      }
    })();
    return once;
  },
};
