// @ts-check
/** DEMO ONLY. A simulated diary: the next open day at least two days away, updated a little while ago. Never bundled into client sites. */
import { addDays, rangesFor } from "../core/lib/hours.js";

/** @type {import("../kits/car/features/next-bay/next-bay.js").BayProvider} */
export const simulatedBay = {
  async load(ctx) {
    let date = addDays(ctx.now().date, 2);
    for (let i = 0; i < 7 && !rangesFor(ctx.data.hours, date).ranges.length; i++) date = addDays(date, 1);
    return { ok: true, date, updatedAt: Date.now() - 52 * 60_000 };
  },
};
