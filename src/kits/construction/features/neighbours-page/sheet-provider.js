// @ts-check
/** For our neighbours, on client sites: this week at the site, from the builder's published sheet (CSV). Fails closed. */
import { siteWeekFromCsv } from "../../lib/neighbours.js";

const TIMEOUT_MS = 6000;

export const sheetNeighbours = {
  /** @param {any} ctx @param {string} site */
  async load(ctx, site) {
    const cfg = ctx.data.build.neighbours;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(cfg.csvUrl, { signal: controller.signal, cache: "no-store", credentials: "omit" });
      if (!res.ok) return { ok: false, reason: "unreadable" };
      return siteWeekFromCsv(await res.text(), site, Date.now(), cfg.staleAfterDays ?? 10, ctx.data.hours.timezone);
    } catch {
      return { ok: false, reason: "unreadable" };
    } finally {
      clearTimeout(timer);
    }
  },
};
