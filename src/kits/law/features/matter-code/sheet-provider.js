// @ts-check
/** Your matter, by code, for client sites: reads the firm's published sheet (CSV). Fails closed. */
import { matterFromCsv } from "../../lib/matter.js";

const TIMEOUT_MS = 6000;

export const sheetMatter = {
  /** @param {any} ctx @param {string} code */
  async load(ctx, code) {
    const cfg = ctx.data.matterCode;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(cfg.csvUrl, { signal: controller.signal, cache: "no-store", credentials: "omit" });
      if (!res.ok) return { ok: false, reason: "unreadable" };
      return matterFromCsv(await res.text(), code, cfg.stages.map((/** @type {any} */ s) => s.id), Date.now(), cfg.staleAfterDays ?? 14, ctx.data.hours.timezone);
    } catch {
      return { ok: false, reason: "unreadable" };
    } finally {
      clearTimeout(timer);
    }
  },
};
