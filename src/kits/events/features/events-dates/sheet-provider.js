// @ts-check
/** The date check for client sites: reads the agency's published sheet (CSV) once a page. Fails closed. */
import { datesFromCsv } from "../../lib/events.js";

const TIMEOUT_MS = 6000;
/** @type {Promise<any>|null} */ let once = null;

export const sheetEventDates = {
  /** @param {any} ctx */
  load(ctx) {
    once ??= (async () => {
      const cfg = ctx.data.events.dates;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      try {
        const res = await fetch(cfg.csvUrl, { signal: controller.signal, cache: "no-store", credentials: "omit" });
        if (!res.ok) return { ok: false, reason: "unreadable" };
        return datesFromCsv(await res.text(), ctx.now().date, cfg.staleAfterDays);
      } catch {
        return { ok: false, reason: "unreadable" };
      } finally {
        clearTimeout(timer);
      }
    })();
    return once;
  },
};
