// @ts-check
/**
 * DEMO ONLY. A simulated diary for the trainer demo: a week that is mostly spoken for, with five open hours spread
 * across it (an early morning, two evenings, a Wednesday breakfast hour and a Saturday morning), worked out from
 * today so the diary never shows a past week. Hours that have gone by the time a visitor looks drop off, as they
 * would on the trainer's own sheet. Never bundled into client sites.
 */
import { diaryFromCsv, weekStart } from "../kits/trainer/lib/trainer.js";
import { addDaysYmd } from "../core/lib/diary.js";
import { zonedNow, formatTime24 } from "../core/lib/hours.js";

/** Open hours by weekday (Monday = 0). */
const OPEN = [[0, "06:00"], [1, "18:00"], [2, "07:00"], [3, "19:00"], [5, "08:00"]];

/** @type {import("../kits/trainer/features/trainer-diary/trainer-diary.js").DiaryProvider} */
export const simulatedDiary = {
  async load(ctx) {
    const data = /** @type {any} */ (ctx.data), cfg = data.trainer.diary, tz = data.hours.timezone;
    const now = zonedNow(new Date(), tz);
    const monday = weekStart(now.date, cfg.days);
    const stamp = `${now.date} ${formatTime24(Math.max(0, now.minutes - 12))}`;
    const rows = ["date,time,updated_at", ...OPEN.map(([d, t]) => `${addDaysYmd(monday, /** @type {number} */ (d))},${t},${stamp}`)];
    return diaryFromCsv(rows.join("\n"), Date.now(), tz, 36);
  },
};
