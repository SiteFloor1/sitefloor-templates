// @ts-check
/**
 * DEMO ONLY. A simulated stops sheet for the street-food stall demo: the usual week laid out from today, written as the
 * stall would write it (so it goes through the same reader as a client's sheet), with the second Sunday cancelled for a
 * fair, so the demo shows a cancelled stop. Never bundled into client sites.
 */
import { stopsFromCsv, weekFromPattern, addDays } from "../kits/stalls/lib/stalls.js";
import { zonedNow } from "../core/lib/hours.js";

/** @type {import("../kits/stalls/features/stalls-where/stalls-where.js").StopsProvider} */
export const simulatedStops = {
  async load(ctx) {
    const cfg = /** @type {any} */ (ctx.data).stops;
    const now = zonedNow(new Date(), ctx.data.hours.timezone);
    const stops = weekFromPattern(cfg.pattern, now.date, 15);
    const sundays = stops.filter((s) => new Date(`${s.date}T12:00:00Z`).getUTCDay() === 0);
    const off = sundays.length > 1 ? sundays[1].date : "";
    const updated = `${addDays(now.date, -1)} 09:12`;
    const rows = ["date,place,open,close,status,note,updated_at",
      ...stops.map((s) => `${s.date},${s.place},${s.open},${s.close},${s.date === off ? "cancelled" : "on"},${s.date === off ? "Market closed for the fair" : ""},${updated}`)];
    return stopsFromCsv(rows.join("\n"), Date.parse(`${now.date}T12:00:00Z`), cfg.staleAfterDays);
  },
};
