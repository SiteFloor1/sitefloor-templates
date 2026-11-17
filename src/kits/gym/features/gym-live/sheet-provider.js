// @ts-check
/**
 * The door count for client sites: the club's Google Sheet published as CSV (`updated_at,count`), read with a timeout.
 * Fails closed: a network error, a timeout, an unreadable sheet or a count older than staleAfterMinutes returns
 * { ok: false }.
 */
import { countFromCsv } from "../../lib/gym.js";

const TIMEOUT_MS = 6000;

/** @type {import("./gym-live.js").CountProvider} */
export const sheetCount = {
  async load(ctx) {
    const g = /** @type {any} */ (ctx.data).gym;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(g.live.csvUrl, { signal: controller.signal, cache: "no-store", credentials: "omit" });
      if (!res.ok) return { ok: false };
      return countFromCsv(await res.text(), Date.now(), ctx.data.hours.timezone, g.live.staleAfterMinutes, g.busy.capacity);
    } catch {
      return { ok: false };
    } finally {
      clearTimeout(timer);
    }
  },
};
