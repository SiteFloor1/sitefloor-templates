// @ts-check
/** Homes for client sites: the agent's published Google Sheet (CSV). Fails closed on any error or timeout. */
import { homesFromCsv } from "../../lib/homes.js";

const TIMEOUT_MS = 6000;

/** @type {import("./load.js").HomesProvider} */
export const sheetHomes = {
  async load(ctx) {
    const cfg = /** @type {any} */ (ctx.data).homes;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(cfg.csvUrl, { signal: controller.signal, cache: "no-store", credentials: "omit" });
      if (!res.ok) return { ok: false, reason: "unreadable" };
      return homesFromCsv(await res.text(), Date.now(), ctx.data.hours.timezone, cfg);
    } catch {
      return { ok: false, reason: "unreadable" };
    } finally {
      clearTimeout(timer);
    }
  },
};
