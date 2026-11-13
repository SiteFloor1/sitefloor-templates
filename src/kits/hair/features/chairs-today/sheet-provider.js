// @ts-check
/**
 * Chairs free today for client sites: reads the salon's published Google Sheet (CSV: service, time, stylist, updated).
 * Fails closed: a network error, a timeout or nothing usable returns { ok: false }.
 */
import { chairsFromCsv, minutesOf } from "../../lib/hair.js";
import { rangesFor } from "../../../../core/lib/hours.js";

const TIMEOUT_MS = 6000;

/** @type {import("./chairs-today.js").ChairsProvider} */
export const sheetChairs = {
  async load(ctx) {
    const data = /** @type {any} */ (ctx.data), cfg = data.chairs, now = ctx.now();
    const open = rangesFor(data.hours, now.date).ranges.map((/** @type {string[]} */ [a, b]) => /** @type {[number, number]} */ ([minutesOf(a), minutesOf(b)]));
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(cfg.csvUrl, { signal: controller.signal, cache: "no-store", credentials: "omit" });
      if (!res.ok) return { ok: false };
      return chairsFromCsv(await res.text(), now, { services: cfg.services.map((/** @type {any} */ s) => s.id), stylists: data.stylists.items.map((/** @type {any} */ s) => s.id), open });
    } catch {
      return { ok: false };
    } finally {
      clearTimeout(timer);
    }
  },
};
