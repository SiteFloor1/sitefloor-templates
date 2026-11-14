// @ts-check
/**
 * DEMO ONLY. An example diary for the wedding-film demo: a few summer Saturdays booked or held, updated forty minutes
 * ago. Never bundled into client sites.
 */
import { diaryFromCsv } from "../kits/weddingfilm/lib/dates.js";
import { zonedNow, formatTime24 } from "../core/lib/hours.js";

/** @type {import("../kits/weddingfilm/features/date-check/date-check.js").DatesProvider} */
export const simulatedWeddingDates = {
  async load(ctx) {
    const tz = ctx.data.hours.timezone, now = zonedNow(new Date(), tz), at = `${now.date} ${formatTime24(Math.max(0, now.minutes - 40))}`;
    // Next summer's Saturdays (this year's until mid-September is past), worked out on the day so they never expire.
    const year = Number(now.date.slice(0, 4)) + (now.date.slice(5) > "09-14" ? 1 : 0);
    const saturday = (/** @type {number} */ month, /** @type {number} */ nth) => {
      const first = new Date(Date.UTC(year, month - 1, 1)), toSat = (6 - first.getUTCDay() + 7) % 7;
      return new Date(Date.UTC(year, month - 1, 1 + toSat + 7 * (nth - 1))).toISOString().slice(0, 10);
    };
    const diary = /** @type {[number, number, string][]} */ ([[6, 2, "booked"], [6, 4, "held"], [7, 1, "booked"], [7, 3, "booked"], [8, 1, "booked"], [9, 1, "held"], [9, 3, "booked"]]);
    const rows = ["date,status,updated_at", ...diary.map(([m, n, st]) => `${saturday(m, n)},${st},${at}`)];
    return diaryFromCsv(rows.join("\n"), Date.now(), tz, 48);
  },
};
