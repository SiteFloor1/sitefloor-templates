// @ts-check
/**
 * DEMO ONLY. Simulated next free days for the hair demo's stylists: each a different open day in the coming fortnight,
 * the stylist level (later for directors) setting how far ahead. Never bundled into client sites.
 */
import { addDays, rangesFor } from "../core/lib/hours.js";

/** @type {import("../kits/hair/features/stylists/stylists.js").FreeDaysProvider} */
export const simulatedFreeDays = {
  async load(ctx) {
    const cfg = /** @type {any} */ (ctx.data).stylists;
    const open = (/** @type {string} */ d) => rangesFor(ctx.data.hours, d).ranges.length > 0;
    /** @param {number} n open days after today */
    const nth = (n) => { let d = ctx.now().date; for (let i = 0; i < 40 && n > 0; i++) { d = addDays(d, 1); if (open(d)) n--; } return d; };
    const ahead = { stylist: [1, 2], senior: [2, 4, 5], director: [6, 8, 9] };
    /** @type {Record<string, number>} */ const used = {};
    /** @type {Record<string, string>} */ const days = {};
    for (const s of cfg.items) {
      const list = /** @type {Record<string, number[]>} */ (ahead)[s.level] ?? [3];
      const k = used[s.level] = (used[s.level] ?? -1) + 1;
      days[s.id] = nth(list[k % list.length]);
    }
    return { ok: true, days };
  },
};
