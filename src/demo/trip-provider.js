// @ts-check
/**
 * DEMO ONLY. A simulated trip for "Your trip, by code": the example code opens the journey of this month (or the
 * first), starting six weeks from today, two travelling, updated yesterday; any other code is "not found". Never
 * bundled into client sites.
 */
import { cleanCode } from "../kits/tourism/lib/tourism.js";

export const simulatedTrip = {
  /** @param {any} ctx @param {string} code */
  async load(ctx, code) {
    const cfg = ctx.data.tourism;
    if (code !== cleanCode(cfg.trip.example ?? "")) return { ok: false, reason: "unknown" };
    const today = ctx.now().date;
    const d = new Date(`${today}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + 42);
    const month = Number(today.slice(5, 7));
    const journey = cfg.monthly?.[String(month)] ?? cfg.fallback;
    const y = new Date(`${today}T12:00:00Z`); y.setUTCDate(y.getUTCDate() - 1);
    return { ok: true, journey, start: d.toISOString().slice(0, 10), travellers: 2, updated: y.toISOString().slice(0, 10) };
  },
};
