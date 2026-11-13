// @ts-check
/**
 * Chair-board provider for client sites: reads the shop's published Google
 * Sheet (CSV). Fails closed: any network error, timeout, bad row or stale
 * timestamp returns { ok: false } and the board shows its fallback message.
 */
import { boardFromCsv } from "../../lib/chairs.js";
import { toMinutes, zonedNow } from "../../../../core/lib/hours.js";

const TIMEOUT_MS = 6000;

/** @type {import("./chair-board.js").ChairProvider} */
export const sheetProvider = {
  intervalMs: 60_000,
  async load(ctx) {
    const cfg = ctx.data.chairBoard;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(cfg.csvUrl, { signal: controller.signal, cache: "no-store", credentials: "omit" });
      if (!res.ok) return { ok: false };
      const data = boardFromCsv(await res.text(), Date.now(), cfg.staleAfterMinutes ?? 20, ctx.data.hours.timezone);
      if (!data.ok) return { ok: false };
      return {
        ok: true,
        updatedMinutes: zonedNow(new Date(data.updatedAt), ctx.data.hours.timezone).minutes,
        chairs: data.rows.map((r) => ({ barber: r.barber, status: r.status, freeAtMinutes: r.freeAt ? toMinutes(r.freeAt) : null, updatedAt: r.updatedAt })),
      };
    } catch {
      return { ok: false };
    } finally {
      clearTimeout(timer);
    }
  },
};
