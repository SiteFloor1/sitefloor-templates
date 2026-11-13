// @ts-check
/**
 * Walk-in queue for client sites: reads the shop's published Google Sheet (CSV).
 * Fails closed: a network error, timeout, unreadable sheet or stale number returns
 * { ok: false } and the live part shows its fallback (the usual-busyness chart stays).
 */
import { queueFromCsv } from "../../core/lib/queue.js";

const TIMEOUT_MS = 6000;

/** @type {import("./walk-in-queue.js").QueueProvider} */
export const sheetQueue = {
  intervalMs: 60_000,
  async load(ctx) {
    const cfg = ctx.data.queue;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(cfg.csvUrl, { signal: controller.signal, cache: "no-store", credentials: "omit" });
      if (!res.ok) return { ok: false };
      const q = queueFromCsv(await res.text(), Date.now(), cfg.staleAfterMinutes ?? 15, ctx.data.hours.timezone);
      return q.ok ? { ok: true, waiting: q.waiting, updatedAt: q.updatedAt } : { ok: false };
    } catch {
      return { ok: false };
    } finally {
      clearTimeout(timer);
    }
  },
};
