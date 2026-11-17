// @ts-check
/**
 * DEMO ONLY. A simulated door count for the gym demo: the club's usual count for this hour, nudged by a steady amount for
 * the day and hour so it reads quieter or busier than usual, counted a few minutes ago. Built as the club's sheet would
 * be and read by the same parser, so it obeys the same rules. Never bundled into client sites.
 */
import { countFromCsv, usualAt } from "../kits/gym/lib/gym.js";
import { zonedNow, formatTime24 } from "../core/lib/hours.js";

/** A steady number from a string, 0–1. @param {string} s */
const hash = (s) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return ((h >>> 0) % 1000) / 1000; };

/** @type {import("../kits/gym/features/gym-live/gym-live.js").CountProvider} */
export const simulatedCount = {
  async load(ctx) {
    const g = /** @type {any} */ (ctx.data).gym, tz = ctx.data.hours.timezone;
    const now = zonedNow(new Date(), tz), h = Math.floor(now.minutes / 60);
    const usual = usualAt(g.busy, now.weekday, h);
    if (usual === null) return { ok: false };
    const mood = 0.62 + hash(`${now.date} ${h}`) * 0.7; // 0.62 to 1.32 of usual
    const count = Math.min(g.busy.capacity, Math.round(usual * mood));
    const ago = 1 + Math.floor(hash(`${now.date} ${now.minutes}`) * 4);
    const csv = `updated_at,count\n${now.date} ${formatTime24(Math.max(0, now.minutes - ago))},${count}`;
    return countFromCsv(csv, Date.now(), tz, g.live.staleAfterMinutes, g.busy.capacity);
  },
};
