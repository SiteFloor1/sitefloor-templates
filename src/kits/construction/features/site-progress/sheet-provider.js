// @ts-check
/** Your house, this week, for client sites: reads the builder's published sheet (CSV). Fails closed. */
import { progressFromCsv } from "../../lib/progress.js";

const TIMEOUT_MS = 6000;

export const sheetProgress = {
  /** @param {any} ctx @param {string} code */
  async load(ctx, code) {
    const cfg = ctx.data.build.progress;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(cfg.csvUrl, { signal: controller.signal, cache: "no-store", credentials: "omit" });
      if (!res.ok) return { ok: false, reason: "unreadable" };
      return progressFromCsv(await res.text(), code, cfg.stages, Date.now(), cfg.staleAfterDays ?? 14, ctx.data.hours.timezone);
    } catch {
      return { ok: false, reason: "unreadable" };
    } finally {
      clearTimeout(timer);
    }
  },
};
