// @ts-check
/**
 * DEMO ONLY. A simulated diary for the detailing demo: the next three weeks of working days, mostly booked with a few
 * free runs, so each package shows a believable next start. Updated an hour ago. Never bundled into client sites.
 */
import { diaryFromCsv, weekdayOf } from "../kits/detailing/lib/dates.js";
import { zonedNow, addDays, formatTime24 } from "../core/lib/hours.js";

/** @type {import("../kits/detailing/features/availability/availability.js").DiaryProvider} */
export const simulatedDiary = {
  async load(ctx) {
    const tz = ctx.data.hours.timezone, now = zonedNow(new Date(), tz);
    const work = /** @type {any} */ (ctx.data).detailing.diary.workdays;
    const at = `${now.date} ${formatTime24(Math.max(0, now.minutes - 60))}`;
    // Working day n from tomorrow is free when it falls in one of these runs.
    const freeRuns = [[3, 3], [9, 1], [11, 5], [19, 6]];
    const rows = ["date,status,updated_at"];
    for (let d = 1, n = 0; n < 30; d++) {
      const date = addDays(now.date, d);
      if (!work.includes(weekdayOf(date))) continue;
      rows.push(`${date},${freeRuns.some(([s, len]) => n >= s && n < s + len) ? "free" : "booked"},${at}`);
      n++;
    }
    return diaryFromCsv(rows.join("\n"), Date.now(), tz, 48);
  },
};
