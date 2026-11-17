// @ts-check
/**
 * DEMO ONLY. Sold out today on the street-food stall demo: on a day the stall trades, the Biscoff crunch sells out
 * once it has been open a couple of hours (at the time it happened, not before). Other days, nothing. Never bundled
 * into client sites.
 */
import { soldOutFromCsv, weekFromPattern, minutesOf } from "../kits/stalls/lib/stalls.js";
import { zonedNow } from "../core/lib/hours.js";

/** @type {import("../kits/stalls/features/stalls-sold-out/stalls-sold-out.js").SoldOutProvider} */
export const simulatedSoldOut = {
  async load(ctx) {
    const cfg = /** @type {any} */ (ctx.data).stops;
    const now = zonedNow(new Date(), ctx.data.hours.timezone);
    const today = weekFromPattern(cfg?.pattern ?? [], now.date, 1)[0];
    const rows = ["date,item,time"];
    if (today) {
      const at = minutesOf(today.open) + 130;
      if (now.minutes >= at) rows.push(`${now.date},Biscoff crunch,${String(Math.floor(at / 60)).padStart(2, "0")}:${String(at % 60).padStart(2, "0")}`);
    }
    return soldOutFromCsv(rows.join("\n"), now.date);
  },
};
