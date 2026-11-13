// @ts-check
/**
 * DEMO ONLY. A simulated book: the next half hour at least ninety minutes away (and at least an hour after
 * today's opening) while the salon is open today, otherwise an hour after the next opening. Never bundled into
 * client sites.
 */
import { addDays, rangesFor, toMinutes } from "../core/lib/hours.js";

/** @param {number} m */
const hm = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

/** @type {import("../kits/nails/features/next-slot/next-slot.js").SlotProvider} */
export const simulatedSlot = {
  async load(ctx) {
    const now = ctx.now();
    const today = rangesFor(ctx.data.hours, now.date).ranges;
    const soon = Math.max(Math.ceil((now.minutes + 90) / 30) * 30, today.length ? toMinutes(today[0][0]) + 60 : 0);
    const close = today.length ? toMinutes(today[today.length - 1][1]) : 0;
    if (today.length && soon <= close - 60) return { ok: true, at: `${now.date} ${hm(soon)}`, updatedAt: Date.now() - 17 * 60_000 };
    let date = addDays(now.date, 1);
    for (let i = 0; i < 7 && !rangesFor(ctx.data.hours, date).ranges.length; i++) date = addDays(date, 1);
    const open = rangesFor(ctx.data.hours, date).ranges[0];
    if (!open) return { ok: false };
    return { ok: true, at: `${date} ${hm(toMinutes(open[0]) + 60)}`, updatedAt: Date.now() - 17 * 60_000 };
  },
};
