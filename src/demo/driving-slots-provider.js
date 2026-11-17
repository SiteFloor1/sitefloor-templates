// @ts-check
/**
 * DEMO ONLY. Free lessons for the driving demo: four over the coming week (a weekday after school, a Saturday morning
 * in the automatic, an evening, an early start), worked out from today so they never show the past. Updated a little
 * earlier today, as an instructor's sheet would be. Never bundled into client sites.
 */
import { slotsFromCsv, nextWeekdays } from "../kits/driving/lib/driving.js";
import { zonedNow, formatTime24 } from "../core/lib/hours.js";

/** [weekday (0 = Sunday), start, hours, gearbox] */
const FREE = [[4, "16:00", 2, "manual"], [6, "09:00", 2, "automatic"], [1, "18:00", 2, "manual"], [3, "07:00", 1, "manual"]];

/** @type {import("../kits/driving/features/driving-slots/driving-slots.js").SlotsProvider} */
export const simulatedSlots = {
  async load(ctx) {
    const tz = ctx.data.hours.timezone, now = zonedNow(new Date(), tz);
    const dates = nextWeekdays(now.date, FREE.map((f) => /** @type {number} */ (f[0])));
    const byDay = new Map(FREE.map((f) => [f[0], f]));
    const rows = ["date,time,hours,gearbox,updated_at", ...dates.map((d) => {
      const dow = new Date(`${d}T12:00:00Z`).getUTCDay(), f = /** @type {any[]} */ (byDay.get(dow));
      return `${d},${f[1]},${f[2]},${f[3]},${now.date} ${formatTime24(Math.max(0, now.minutes - 35))}`;
    })];
    return slotsFromCsv(rows.join("\n"), Date.now(), tz, 48);
  },
};
