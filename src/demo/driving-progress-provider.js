// @ts-check
/**
 * DEMO ONLY. One sample learner for the driving demo, opened with the demo's sample code: eighteen lessons in, the
 * last one two days ago, levels spread as a real card would be. Never bundled into client sites.
 */
import { progressFromCsv } from "../kits/driving/lib/driving.js";
import { zonedNow, formatTime24 } from "../core/lib/hours.js";
import { addDaysYmd } from "../core/lib/diary.js";

/** Levels for the demo's skills, in their order (1 Introduced … 5 Independent, 0 not started). */
const LEVELS = [5, 4, 4, 3, 3, 2, 1, 0];

/** @type {import("../kits/driving/features/driving-progress/driving-progress.js").ProgressProvider} */
export const simulatedProgress = {
  async load(ctx, code) {
    const cfg = /** @type {any} */ (ctx.data).driving.progress, tz = ctx.data.hours.timezone, now = zonedNow(new Date(), tz);
    const skills = /** @type {string[]} */ (cfg.skills);
    const last = addDaysYmd(now.date, -2);
    const cells = skills.map((_, i) => String(LEVELS[i] ?? 0));
    const q = (/** @type {string} */ s) => `"${s.replace(/"/g, '""')}"`;
    const csv = [
      ["code", "lessons", "last_lesson", "covered", "practise", ...skills.map(q), "updated_at"].join(","),
      [cfg.example, "18", last, q("Roundabouts on the A13 and a first go at parallel parking."), q("Mirror checks before you signal; ten minutes of parallel parking with family."), ...cells, `${last} ${formatTime24(19 * 60 + 40)}`].join(","),
    ].join("\n");
    return progressFromCsv(csv, code, Date.now(), tz, cfg.staleAfterHours, skills);
  },
};
