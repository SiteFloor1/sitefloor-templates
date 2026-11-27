// @ts-check
/**
 * DEMO ONLY. A simulated queue for the pop-up demo: a wait set by "staff" ten minutes ago, longer in the evening and at
 * weekends, through the same reader as a client's sheet. Never bundled into client sites.
 */
import { lineFromCsv } from "../kits/popup/lib/popup.js";
import { zonedNow } from "../core/lib/hours.js";

/** @type {import("../kits/popup/features/popup-line/popup-line.js").LineProvider} */
export const simulatedLine = {
  async load(ctx) {
    const now = zonedNow(new Date(), ctx.data.hours.timezone);
    const at = Math.max(0, now.minutes - 10);
    const busy = now.weekday === 0 || now.weekday === 6 || now.minutes >= 17 * 60;
    const hhmm = `${String(Math.floor(at / 60)).padStart(2, "0")}:${String(at % 60).padStart(2, "0")}`;
    const nowMs = Date.parse(`${now.date}T${String(Math.floor(now.minutes / 60)).padStart(2, "0")}:${String(now.minutes % 60).padStart(2, "0")}:00Z`);
    return lineFromCsv(`minutes,updated_at\n${busy ? 20 : 5},${now.date} ${hhmm}`, nowMs, 30);
  },
};
