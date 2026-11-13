// @ts-check
/** DEMO ONLY. A simulated queue that follows the demo's usual-busyness chart. Never bundled into client sites. */
import { busyHours } from "../core/lib/queue.js";
import { DAY_KEYS } from "../core/lib/hours.js";

/** @type {import("../features/walk-in-queue/walk-in-queue.js").QueueProvider} */
export const simulatedQueue = {
  intervalMs: 60_000,
  async load(ctx) {
    const now = ctx.now();
    const level = busyHours(ctx.data.queue.busyness, ctx.data.hours, DAY_KEYS[now.weekday]).find((h) => h.hour === Math.floor(now.minutes / 60))?.level ?? 0;
    const drift = Math.round(Math.sin(now.minutes / 7) * 1.5); // moves a little every few minutes
    return { ok: true, waiting: Math.max(0, level * 2 + drift), updatedAt: Date.now() - ((now.minutes % 4) + 1) * 60_000 };
  },
};
