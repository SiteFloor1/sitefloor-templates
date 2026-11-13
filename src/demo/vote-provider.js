// @ts-check
/**
 * DEMO ONLY. A simulated week of votes for the dessert shop demo: the count grows through the week, pistachio a little
 * ahead. Never bundled into client sites.
 */
import { zonedNow } from "../core/lib/hours.js";

/** @type {import("../kits/bakery/features/flavour-vote/sheet-provider.js").VoteProvider} */
export const simulatedVotes = {
  async load(ctx) {
    const v = /** @type {any} */ (ctx.data).vote;
    const now = zonedNow(new Date(), ctx.data.hours.timezone);
    const day = new Date(`${now.date}T12:00:00Z`).getUTCDay(); // 0 Sunday
    const grow = 30 + ((day + 6) % 7) * 22 + Math.floor(now.minutes / 60);
    const weights = [0.34, 0.27, 0.22, 0.17];
    /** @type {Record<string, number>} */ const counts = {};
    v.candidates.forEach((/** @type {any} */ c, /** @type {number} */ i) => { counts[c.id] = Math.round(grow * (weights[i] ?? 0.1)); });
    return { ok: true, counts, total: Object.values(counts).reduce((s, n) => s + n, 0) };
  },
};
