// @ts-check
/**
 * DEMO ONLY. Simulated places for the Pilates demo: early and evening classes fill first, today's fill as the day
 * goes, and two classes this week are already full (so the waitlist shows). The same class always gets the same
 * count on a given day. Never bundled into client sites.
 */
import { placesFromCsv } from "../kits/pilates/lib/places.js";
import { weekFrom } from "../kits/pilates/lib/classes.js";
import { zonedNow, formatTime24, toMinutes } from "../core/lib/hours.js";

/** A steady number from a string, 0–1. @param {string} s */
const hash = (s) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return ((h >>> 0) % 1000) / 1000; };

/** @type {import("../kits/pilates/features/spaces-left/spaces-left.js").PlacesProvider} */
export const simulatedPlaces = {
  async load(ctx) {
    const data = /** @type {any} */ (ctx.data), pl = data.pilates, tz = data.hours.timezone;
    const now = zonedNow(new Date(), tz);
    const stamp = `${now.date} ${formatTime24(Math.max(0, now.minutes - 7))}`;
    const rows = ["date,time,left,updated_at"];
    let liveToday = 0;
    weekFrom(pl, data.hours, now.date).forEach((d, dayIndex) => d.classes.forEach((s, i) => {
      const t = toMinutes(s.time);
      const popular = t < 9 * 60 || t >= 17 * 60 ? 2 : 0;
      const soon = dayIndex === 0 ? Math.max(0, 3 - Math.floor((t - now.minutes) / 120)) : dayIndex === 1 ? 1 : 0;
      let left = Math.max(1, Math.round(pl.reformers - popular - soon - hash(s.key) * 2));
      if (dayIndex === 0 && t > now.minutes && ++liveToday === 2) left = 0;
      if (dayIndex === 2 && i === d.classes.length - 1) left = 0;
      rows.push(`${s.date},${s.time},${left},${stamp}`);
    }));
    return placesFromCsv(rows.join("\n"), Date.now(), tz, 60, pl.reformers);
  },
};
