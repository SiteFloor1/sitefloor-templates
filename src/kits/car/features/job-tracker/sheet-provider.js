// @ts-check
/**
 * Your car, live, for client sites: reads the studio's published Google Sheet (CSV). Fails closed: a network error,
 * a timeout or an unreadable sheet returns { ok: false, reason: "unreadable" }.
 */
import { jobFromCsv } from "../../lib/tracker.js";

const TIMEOUT_MS = 6000;

/** @type {import("./job-tracker.js").TrackerProvider} */
export const sheetTracker = {
  async load(ctx, code) {
    const cfg = /** @type {any} */ (ctx.data).jobTracker;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(cfg.csvUrl, { signal: controller.signal, cache: "no-store", credentials: "omit" });
      if (!res.ok) return { ok: false, reason: "unreadable" };
      return jobFromCsv(await res.text(), code, cfg.stages.map((/** @type {any} */ s) => s.id), Date.now(), cfg.staleAfterHours ?? 24, ctx.data.hours.timezone);
    } catch {
      return { ok: false, reason: "unreadable" };
    } finally {
      clearTimeout(timer);
    }
  },
};
