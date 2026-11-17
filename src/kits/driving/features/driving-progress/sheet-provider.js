// @ts-check
/**
 * Learner progress for client sites: the instructor's Google Sheet published as CSV, read with a timeout when a code
 * is entered. Fails closed: any error returns { ok: false, reason: "sheet" }.
 */
import { progressFromCsv } from "../../lib/driving.js";

const TIMEOUT_MS = 6000;

/** @type {import("./driving-progress.js").ProgressProvider} */
export const sheetProgress = {
  async load(ctx, code) {
    const cfg = /** @type {any} */ (ctx.data).driving.progress;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(cfg.csvUrl, { signal: controller.signal, cache: "no-store", credentials: "omit" });
      if (!res.ok) return { ok: false, reason: "sheet" };
      return progressFromCsv(await res.text(), code, Date.now(), ctx.data.hours.timezone, cfg.staleAfterHours, cfg.skills);
    } catch {
      return { ok: false, reason: "sheet" };
    } finally {
      clearTimeout(timer);
    }
  },
};
