// @ts-check
/**
 * DEMO ONLY. Simulated places for the gym demo: evening classes fill first, today's fill as the day goes, one class
 * today is full. Built as the club's sheet would be and read by the same parser (fresh rows only). Never bundled into
 * client sites.
 */
import { placesFromCsv, weekOf } from "../kits/gym/lib/gym.js";
import { sizesOf } from "../kits/gym/features/gym-spaces/sheet-provider.js";
import { zonedNow, formatTime24, toMinutes, DAY_KEYS } from "../core/lib/hours.js";
import { addDaysYmd } from "../core/lib/diary.js";

/** A steady number from a string, 0–1. @param {string} s */
const hash = (s) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return ((h >>> 0) % 1000) / 1000; };

/** @type {import("../kits/gym/features/gym-spaces/gym-spaces.js").PlacesProvider} */
export const simulatedGymPlaces = {
  async load(ctx) {
    const g = /** @type {any} */ (ctx.data).gym, tz = ctx.data.hours.timezone;
    const now = zonedNow(new Date(), tz), sizes = sizesOf(g);
    const stamp = `${now.date} ${formatTime24(Math.max(0, now.minutes - 3))}`;
    const rows = ["date,time,class,left,updated_at"];
    let fullDone = false;
    const add = (/** @type {string} */ date, /** @type {string} */ time, /** @type {string} */ id, /** @type {number} */ dayIndex) => {
      const size = sizes[id] ?? 20, t = toMinutes(time);
      const evening = t >= 17 * 60 ? 0.45 : 0.15;
      let left = Math.max(1, Math.round(size * (1 - evening - hash(`${date}${time}${id}`) * 0.35 - (dayIndex === 0 ? 0.1 : 0))));
      if (dayIndex === 0 && t > now.minutes && t >= 19 * 60 && !fullDone) { left = 0; fullDone = true; }
      rows.push(`${date},${time},${id},${Math.min(left, size)},${stamp}`);
    };
    /** @type {{ date: string, sessions: { time: string, class: string }[] }[]} */
    const days = weekOf(g.weekly, ctx.data.hours, now.date, 2);
    days.forEach((d, i) => d.sessions.forEach((s) => add(d.date, s.time, s.class, i)));
    for (let i = 0; i < 2; i++) {
      const date = addDaysYmd(now.date, i), day = DAY_KEYS[(now.weekday + i) % 7];
      (g.recovery ?? []).filter((/** @type {any} */ s) => s.days.includes(day)).forEach((/** @type {any} */ s) => s.times.forEach((/** @type {string} */ t) => add(date, t, s.id, i + 5)));
    }
    return placesFromCsv(rows.join("\n"), Date.now(), tz, g.spaces.staleAfterMinutes, sizes);
  },
};
