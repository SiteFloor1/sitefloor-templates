// @ts-check
/**
 * DEMO ONLY. A simulated commission for "Your commission, by code": the example code is at the third stage with the
 * next fitting on the coming Thursday at 11:00 and the first cloth in the book, updated yesterday; any other code is
 * "not found". Never bundled into client sites.
 */
import { cleanCode } from "../kits/tailor/lib/tailor.js";
import { wallTimeToUtc } from "../core/lib/hours.js";

export const simulatedCommission = {
  /** @param {any} ctx @param {string} code */
  async load(ctx, code) {
    const cfg = ctx.data.commission;
    if (code !== cleanCode(cfg.example ?? "")) return { ok: false, reason: "unknown" };
    const today = ctx.now().date;
    const d = new Date(`${today}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + (((4 - d.getUTCDay() + 7) % 7) || 7)); // the coming Thursday
    const next = wallTimeToUtc({ year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate(), hour: 11, minute: 0, second: 0 }, ctx.data.hours.timezone);
    return { ok: true, stage: Math.min(2, cfg.stages.length - 1), next, cloth: cfg.cloths[0] ?? "", updatedAt: Date.now() - 26 * 3_600_000 };
  },
};
