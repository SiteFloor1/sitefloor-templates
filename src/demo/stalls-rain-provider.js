// @ts-check
/**
 * DEMO ONLY. A forecast for the street-food stall demo: dry today, rain likely from 15:00 tomorrow, so both lines show.
 * Never bundled into client sites (they use Open-Meteo).
 */
import { addDays } from "../kits/stalls/lib/stalls.js";
import { zonedNow } from "../core/lib/hours.js";

/** @type {import("../kits/stalls/features/stalls-rain/stalls-rain.js").RainProvider} */
export const simulatedRain = {
  async load(ctx) {
    const today = zonedNow(new Date(), ctx.data.hours.timezone).date, tomorrow = addDays(today, 1);
    const hours = [];
    for (const d of [today, tomorrow]) for (let h = 0; h < 24; h++) hours.push({ time: `${d}T${String(h).padStart(2, "0")}:00`, p: d === tomorrow && h >= 15 ? 70 : 10 });
    return hours;
  },
};
