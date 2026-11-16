// @ts-check
/**
 * DEMO ONLY. A simulated diary for a busy bridal hair and makeup artist, the same for every visitor on a given day:
 * the next five weekends gone; May to September Saturdays mostly taken, one in three on hold or open; summer Fridays
 * and Sundays filling; December Saturdays on hold. Everything else is open. Never bundled into client sites.
 */
import { addDaysYmd } from "../core/lib/diary.js";

export const simulatedDiary = {
  /** @param {import("../core/js/core.js").Ctx} ctx @returns {Promise<import("../kits/bridalbeauty/lib/bridalbeauty.js").DatesResult>} */
  async load(ctx) {
    const today = ctx.now().date;
    /** @type {Record<string, "held"|"taken">} */
    const days = {};
    for (let i = 0; i < 730; i++) {
      const d = addDaysYmd(today, i);
      const t = new Date(`${d}T12:00:00Z`);
      const dow = t.getUTCDay(), month = t.getUTCMonth() + 1, week = Math.floor(t.getTime() / 604_800_000);
      if (i < 35 && (dow === 5 || dow === 6 || dow === 0)) days[d] = "taken";
      else if (dow === 6 && month >= 5 && month <= 9) { if (week % 3 === 1) days[d] = "held"; else if (week % 3 === 2) days[d] = "taken"; else if (i < 300) days[d] = "taken"; }
      else if ((dow === 5 || dow === 0) && month >= 6 && month <= 8 && week % 2 === 0) days[d] = "taken";
      else if (dow === 6 && month === 12) days[d] = "held";
    }
    return { ok: true, days, updatedAt: Date.now() - 2 * 86_400_000 };
  },
};
