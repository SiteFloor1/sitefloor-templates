// @ts-check
/**
 * Next free appointment for client sites: reads the salon's published Google Sheet (CSV). Fails closed: a network
 * error, a timeout, an unreadable sheet, a slot already gone or an old update returns { ok: false }.
 */
import { slotFromCsv } from "../../lib/slot.js";

const TIMEOUT_MS = 6000;

/** @type {import("./next-slot.js").SlotProvider} */
export const sheetSlot = {
  async load(ctx) {
    const cfg = /** @type {any} */ (ctx.data).nextSlot;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(cfg.csvUrl, { signal: controller.signal, cache: "no-store", credentials: "omit" });
      if (!res.ok) return { ok: false };
      const now = ctx.now();
      const hh = String(Math.floor(now.minutes / 60)).padStart(2, "0"), mm = String(now.minutes % 60).padStart(2, "0");
      return slotFromCsv(await res.text(), Date.now(), cfg.staleAfterMinutes ?? 240, ctx.data.hours.timezone, `${now.date} ${hh}:${mm}`);
    } catch {
      return { ok: false };
    } finally {
      clearTimeout(timer);
    }
  },
};
