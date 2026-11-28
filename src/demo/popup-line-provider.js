// @ts-check
/**
 * DEMO ONLY. A simulated queue for the pop-up demo: a wait set by "staff" ten minutes ago, longer in the evening and at
 * weekends, written as a Google Form writes it (UK time) and read through the same reader as a client's sheet. Never
 * bundled into client sites.
 */
import { lineFromCsv } from "../kits/popup/lib/popup.js";
import { zonedNow } from "../core/lib/hours.js";

/** @type {import("../kits/popup/features/popup-line/popup-line.js").LineProvider} */
export const simulatedLine = {
  async load(ctx) {
    const tz = ctx.data.hours.timezone, nowMs = Date.now();
    const then = zonedNow(new Date(nowMs - 10 * 6e4), tz), now = zonedNow(new Date(nowMs), tz);
    const busy = now.weekday === 0 || now.weekday === 6 || now.minutes >= 17 * 60;
    const hhmm = `${String(Math.floor(then.minutes / 60)).padStart(2, "0")}:${String(then.minutes % 60).padStart(2, "0")}`;
    return lineFromCsv(`minutes,updated_at\n${busy ? 20 : 5},${then.date} ${hhmm}`, nowMs, 30, tz);
  },
};
