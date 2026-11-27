// @ts-check
/**
 * DEMO ONLY. A simulated stock sheet for the pop-up demo: written as the brand would write it (so it goes through the
 * same reader as a client's sheet), updated this morning, with one piece sold out, so the demo shows the mark.
 */
import { stockFromCsv } from "../kits/popup/lib/popup.js";
import { zonedNow } from "../core/lib/hours.js";

/** @type {import("../kits/popup/features/popup-only-here/popup-only-here.js").StockProvider} */
export const simulatedStock = {
  async load(ctx) {
    const now = zonedNow(new Date(), ctx.data.hours.timezone);
    const items = /** @type {any} */ (ctx.data).stock?.ids ?? [];
    const rows = ["id,sold_out,updated_at", ...items.map((/** @type {string} */ id, /** @type {number} */ i) => `${id},${i === items.length - 1 ? "yes" : "no"},${now.date} 09:05`)];
    return stockFromCsv(rows.join("\n"), Date.parse(`${now.date}T12:00:00Z`), 3);
  },
};
