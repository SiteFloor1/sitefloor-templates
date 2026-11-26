// @ts-check
/** Booked stays for client sites: the company's published Google Sheet (CSV). Fails closed on any error or timeout. */
import { staysFromCsv } from "../../lib/calendar.js";

const TIMEOUT_MS = 6000;

export const sheetStays = {
  /** @param {import("../../../../core/js/core.js").Ctx} ctx */
  async load(ctx) {
    const cfg = /** @type {any} */ (ctx.data).calendar;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(cfg.csvUrl, { signal: controller.signal, cache: "no-store", credentials: "omit" });
      if (!res.ok) return { ok: false, stays: [], updated: null };
      return { ok: true, ...staysFromCsv(await res.text()) };
    } catch {
      return { ok: false, stays: [], updated: null };
    } finally {
      clearTimeout(timer);
    }
  },
};
