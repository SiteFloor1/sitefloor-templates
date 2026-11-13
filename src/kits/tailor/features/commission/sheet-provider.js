// @ts-check
/** Your commission, by code, for client sites: reads the house's published sheet (CSV). Fails closed. */
import { commissionFromCsv } from "../../lib/tailor.js";

const TIMEOUT_MS = 6000;

export const sheetCommission = {
  /** @param {any} ctx @param {string} code */
  async load(ctx, code) {
    const cfg = ctx.data.commission;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(cfg.csvUrl, { signal: controller.signal, cache: "no-store", credentials: "omit" });
      if (!res.ok) return { ok: false, reason: "unreadable" };
      return commissionFromCsv(await res.text(), code, cfg.stages, cfg.cloths, Date.now(), cfg.staleAfterDays, ctx.data.hours.timezone);
    } catch {
      return { ok: false, reason: "unreadable" };
    } finally {
      clearTimeout(timer);
    }
  },
};
