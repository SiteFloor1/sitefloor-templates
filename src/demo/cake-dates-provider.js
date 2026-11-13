// @ts-check
/**
 * DEMO ONLY. A simulated diary for the cakes demo: most summer Saturdays are taken, a few have one place left, and the
 * rest of the year is open. The same date always gets the same answer. Never bundled into client sites.
 */
import { datesFromCsv, addDays } from "../kits/cakes/lib/cakes.js";

/** A steady number from a string, 0–1. @param {string} s */
const hash = (s) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return ((h >>> 0) % 1000) / 1000; };

/** @type {import("../kits/cakes/features/cake-date-check/cake-date-check.js").DatesProvider} */
export const simulatedDates = {
  async load(ctx) {
    const today = ctx.now().date;
    const rows = ["date,left,updated_at"];
    for (let i = 0; i < 540; i++) {
      const d = addDays(today, i);
      const day = new Date(`${d}T12:00:00Z`).getUTCDay(), month = Number(d.slice(5, 7));
      if (day !== 6 && day !== 5) continue;
      const h = hash(d), summer = month >= 5 && month <= 9;
      const left = day === 6 ? (summer ? (h < 0.7 ? 0 : 1) : h < 0.25 ? 0 : h < 0.5 ? 1 : 2) : h < 0.3 ? 1 : 2;
      rows.push(`${d},${left},${today} 08:10`);
    }
    return datesFromCsv(rows.join("\n"), today, 7);
  },
};
