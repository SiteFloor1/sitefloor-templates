// @ts-check
/**
 * The studio's diary for client sites: its Google Sheet published as CSV (date,left,updated_at), read once with a
 * timeout. Fails closed: a network error, a timeout, an unreadable or stale sheet gives { ok: false }, and the date
 * check says "ask us" instead of "free".
 */
import { datesFromCsv } from "../../lib/cakes.js";

const TIMEOUT_MS = 6000;
/** @type {Promise<import("../../lib/cakes.js").Dates>|null} */
let pending = null;

/** @type {import("./cake-date-check.js").DatesProvider} */
export const sheetDates = {
  load(ctx) {
    if (pending) return pending;
    const cfg = /** @type {any} */ (ctx.data).cakes.dates;
    pending = (async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      try {
        const res = await fetch(cfg.csvUrl, { signal: controller.signal, cache: "no-store", credentials: "omit" });
        if (!res.ok) return { ok: false };
        return datesFromCsv(await res.text(), ctx.now().date, cfg.staleAfterDays);
      } catch {
        return { ok: false };
      } finally {
        clearTimeout(timer);
      }
    })();
    return /** @type {Promise<import("../../lib/cakes.js").Dates>} */ (pending);
  },
};
