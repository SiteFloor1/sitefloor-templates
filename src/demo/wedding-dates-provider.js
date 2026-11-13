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
    const rows = ["date,status,updated_at", ...[["2027-06-12", "booked"], ["2027-06-26", "held"], ["2027-07-03", "booked"], ["2027-07-17", "booked"], ["2027-08-07", "booked"], ["2027-09-04", "held"], ["2027-09-18", "booked"]].map(([d, s]) => `${d},${s},${at}`)];
    return diaryFromCsv(rows.join("\n"), Date.now(), tz, 48);
  },
};
