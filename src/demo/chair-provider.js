// @ts-check
/** DEMO ONLY. Simulated chair data that moves with the clock. Never bundled into client sites. */
import { simulatedBoard } from "../kits/barber/lib/chairs.js";

/** @type {import("../kits/barber/features/chair-board/chair-board.js").ChairProvider} */
export const simulatedProvider = {
  intervalMs: 60_000,
  async load(ctx) {
    const now = ctx.now();
    return {
      ok: true,
      updatedMinutes: now.minutes,
      // staggered "updated" times so the per-barber line reads like a real shop
      chairs: simulatedBoard(ctx.data.staff, now.minutes).map((c, i) => ({ ...c, updatedAt: Date.now() - (i * 4 + 1) * 60_000 })),
    };
  },
};
