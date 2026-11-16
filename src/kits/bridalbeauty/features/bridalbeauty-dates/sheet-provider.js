// @ts-check
/**
 * The artist's diary for client sites: reads the published Google Sheet (CSV). Fails closed: a network error, a
 * timeout, an unreadable sheet or an old update returns { ok: false }, and the cover asks the bride to message.
 */
import { datesFromCsv } from "../../lib/bridalbeauty.js";

const TIMEOUT_MS = 6000;

export const sheetDiary = {
  /** @param {import("../../../../core/js/core.js").Ctx} ctx @returns {Promise<import("../../lib/bridalbeauty.js").DatesResult>} */
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
