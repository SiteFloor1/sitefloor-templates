// @ts-check
/**
 * The company's free days for client sites: its Google Sheet published as CSV (district,date,updated_at), read once
 * with a timeout. Fails closed: a network error, a timeout, an unreadable or stale sheet gives { ok: false }, and the
 * postcode check says "ask us for the next free day" instead of a date.
 */
import { freeDaysFromCsv } from "../../lib/areas.js";

const TIMEOUT_MS = 6000;
/** @type {Promise<import("../../lib/areas.js").FreeDays>|null} */
let pending = null;

export const sheetCleaningDays = {
  /** @param {import("../../../../core/js/core.js").Ctx} ctx @returns {Promise<import("../../lib/areas.js").FreeDays>} */
  load(ctx) {
    if (pending) return pending;
    const cfg = /** @type {any} */ (ctx.data).cleaning.days;
    pending = (async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      try {
        const res = await fetch(cfg.csvUrl, { signal: controller.signal, cache: "no-store", credentials: "omit" });
        if (!res.ok) return { ok: /** @type {const} */ (false) };
        return freeDaysFromCsv(await res.text(), ctx.now().date, cfg.staleAfterDays);
      } catch {
        return { ok: /** @type {const} */ (false) };
      } finally {
        clearTimeout(timer);
      }
    })();
    return pending;
  },
};
