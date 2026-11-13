// @ts-check
/**
 * DEMO ONLY. A simulated sheet for the chocolatier demo: the counter thins out through the day (the cocoa truffles run
 * low after 6, the blackberry layer sells out at 8, the raspberry sorbet is off today and back tomorrow), seats fill
 * from 7, the kitchen line changes through the day, and two Saturdays are already full for cakes. Never bundled into client sites.
 */
import { bakesFromCsv } from "../kits/bakery/lib/bakes.js";
import { zonedNow, formatTime24, addDays } from "../core/lib/hours.js";

/** @type {import("../kits/bakery/features/bakes/sheet-provider.js").BakesProvider} */
export const simulatedBakes = {
  async load(ctx) {
    const tz = ctx.data.hours.timezone;
    const now = zonedNow(new Date(), tz);
    const at = (/** @type {number} */ minsAgo) => `${now.date} ${formatTime24(Math.max(0, now.minutes - minsAgo))}`;
    const m = now.minutes;
    const seats = m < 19 * 60 ? "plenty" : m < 21 * 60 ? "filling" : m < 22 * 60 + 30 ? "queue" : "filling";
    // Two Saturdays in the next month that are already full for cakes.
    const sat = (/** @type {number} */ n) => { let d = now.date; let k = 0; for (let i = 1; i < 60; i++) { d = addDays(now.date, i); if (new Date(`${d}T12:00:00Z`).getUTCDay() === 6 && ++k === n) return d; } return d; };
    const rows = [
      "kind,item,status,note,updated_at,left",
      `seats,,${seats},${seats === "queue" ? "About ten minutes for a table" : ""},${at(4)}`,
      `dessert,cocoa-truffle,${m >= 18 * 60 ? "low" : "available"},,${at(9)},${m >= 18 * 60 ? 3 : ""}`,
      `dessert,gold-squares,available,,${at(12)}`,
      `dessert,blackberry-layer,${m >= 20 * 60 ? "sold out" : m >= 18 * 60 ? "low" : "available"},${m >= 20 * 60 ? "Back tomorrow from 2" : ""},${at(14)}`,
      `dessert,gianduja-layer,available,,${at(15)},${m >= 21 * 60 ? 2 : 6}`,
      `dessert,passion-fruit,${m >= 21 * 60 ? "sold out" : "available"},,${at(20)}`,
      `gelato,raspberry-sorbet,sold out,,${at(30)}`,
      `gelato,pistachio,${m >= 21 * 60 ? "low" : "available"},,${at(18)}`,
      `kitchen,,,"${m < 16 * 60 ? "Tempering raspberry, out at 4" : m < 20 * 60 ? "Pistachio bombs setting, out at 8" : "Tomorrow's gianduja cooling"}",${at(35)}`,
      `cakes,${sat(1)},full,,${at(600)}`,
      `cakes,${sat(3)},full,,${at(600)}`,
    ];
    return bakesFromCsv(rows.join("\n"), Date.now(), tz, /** @type {any} */ (ctx.data).bakes?.staleAfterMinutes ?? 45);
  },
};
