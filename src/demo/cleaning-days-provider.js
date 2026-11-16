// @ts-check
/**
 * DEMO ONLY. Simulated free days for the cleaning demo: each district gets a few weekdays in the coming fortnight,
 * worked out on the day, the same district always the same pattern. Never bundled into client sites.
 */
import { freeDaysFromCsv } from "../kits/cleaning/lib/areas.js";
import { addDaysYmd } from "../core/lib/diary.js";

/** A steady number from a string, 0–1. @param {string} s */
const hash = (s) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return ((h >>> 0) % 1000) / 1000; };

export const simulatedCleaningDays = {
  /** @param {import("../core/js/core.js").Ctx} ctx */
  async load(ctx) {
    const today = ctx.now().date, rows = ["district,date,updated_at"];
    for (const d of /** @type {any} */ (ctx.data).cleaning.areas.districts) {
      for (let i = 1; i <= 14; i++) {
        const date = addDaysYmd(today, i), wd = new Date(`${date}T12:00:00Z`).getUTCDay();
        if (wd === 0 || wd === 6) continue;
        if (hash(`${d}-${wd}`) < 0.45 || hash(`${d}-${i}`) < 0.3) rows.push(`${d},${date},${today} 07:45`);
      }
    }
    return freeDaysFromCsv(rows.join("\n"), today, 3);
  },
};
