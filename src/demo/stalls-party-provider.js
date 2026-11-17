// @ts-check
/**
 * DEMO ONLY. The street-food stall's party diary: the next two Saturdays are already promised and the third has one
 * booking, worked out on the day, never a fixed date. Never bundled into client sites.
 */
import { partyDatesFromCsv, addDays, weekdayOf } from "../kits/stalls/lib/stalls.js";
import { zonedNow } from "../core/lib/hours.js";

/** @type {import("../kits/stalls/features/stalls-book/stalls-book.js").PartyProvider} */
export const simulatedPartyDates = {
  async load(ctx) {
    const now = zonedNow(new Date(), ctx.data.hours.timezone);
    const sats = [];
    for (let i = 1; sats.length < 3 && i < 30; i++) { const d = addDays(now.date, i); if (weekdayOf(d) === 6) sats.push(d); }
    const stamp = `${addDays(now.date, -2)} 18:40`;
    const rows = ["date,status,updated_at", `${sats[0]},taken,${stamp}`, `${sats[1]},taken,${stamp}`, `${sats[2]},few,${stamp}`];
    return partyDatesFromCsv(rows.join("\n"), Date.parse(`${now.date}T12:00:00Z`), 21);
  },
};
