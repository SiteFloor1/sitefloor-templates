// @ts-check
/**
 * The stall's stops for client sites: reads its published Google Sheet (CSV). Fails closed: a network error, a
 * timeout, an unreadable sheet or an old update returns { ok: false }, and the page shows the usual week as "usually".
 */
import { stopsFromCsv } from "../../lib/stalls.js";

const TIMEOUT_MS = 6000;

/** @type {import("./stalls-where.js").StopsProvider} */
export const sheetStops = {
  async load(ctx) {
    const cfg = /** @type {any} */ (ctx.data).stops;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(cfg.csvUrl, { signal: controller.signal, cache: "no-store", credentials: "omit" });
      if (!res.ok) return { ok: false };
      return stopsFromCsv(await res.text(), Date.now(), cfg.staleAfterDays ?? 10);
    } catch {
      return { ok: false };
    } finally {
      clearTimeout(timer);
    }
  },
};
