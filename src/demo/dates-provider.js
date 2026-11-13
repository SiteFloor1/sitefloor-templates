// @ts-check
/**
 * DEMO ONLY. A simulated diary for a busy bridal mehndi artist, the same for every visitor on a given day: summer
 * Saturdays mostly taken or down to a few hours, summer Sundays and December Saturdays filling, the next month's
 * weekends gone. Everything else is free so far. Never bundled into client sites.
 */
import { addDaysYmd } from "../core/lib/diary.js";

/** @type {import("../kits/mehndi/features/mehndi-dates/mehndi-dates.js").DatesProvider} */
export const simulatedDates = {
  async load(ctx) {
    const today = ctx.now().date;
    /** @type {Record<string, "few"|"taken">} */
    const days = {};
    for (let i = 0; i < 730; i++) {
      const d = addDaysYmd(today, i);
      const t = new Date(`${d}T12:00:00Z`);
      const dow = t.getUTCDay(), month = t.getUTCMonth() + 1, week = Math.floor(t.getTime() / 604_800_000);
      if (i < 35 && (dow === 5 || dow === 6 || dow === 0)) days[d] = "taken";
      else if (dow === 6 && month >= 5 && month <= 9) days[d] = week % 3 === 0 ? "few" : "taken";
      else if (dow === 0 && month >= 6 && month <= 8 && week % 2 === 0) days[d] = "few";
      else if (dow === 6 && month === 12) days[d] = "few";
    }
    return { ok: true, days, updatedAt: Date.now() - 2 * 86_400_000 };
  },
};
