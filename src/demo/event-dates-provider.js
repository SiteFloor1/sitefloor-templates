// @ts-check
/**
 * DEMO ONLY. A believable diary for the date check, worked out from today so it never goes out of date: about half the
 * summer Saturdays (May to September) and a third of the others booked, some held, a few Fridays taken, updated
 * yesterday. Never bundled into client sites.
 */
import { addDays, weekday } from "../kits/events/lib/events.js";

/** @type {Promise<any>|null} */ let once = null;

export const simulatedEventDates = {
  /** @param {any} ctx */
  load(ctx) {
    once ??= Promise.resolve().then(() => {
      const today = ctx.now().date;
      /** @type {Record<string, "held"|"booked">} */ const taken = {};
      for (let i = 0; i < 540; i++) {
        const d = addDays(today, i), w = weekday(d), m = Number(d.slice(5, 7)), day = Number(d.slice(8, 10));
        const h = (day * 7 + m * 13 + Number(d.slice(2, 4))) % 10;
        const summer = m >= 5 && m <= 9;
        if (w === "sat") { if (i < 21) taken[d] = "booked"; else if (h < (summer ? 5 : 3)) taken[d] = "booked"; else if (h < (summer ? 7 : 4)) taken[d] = "held"; }
        else if (w === "fri" && h < 2) taken[d] = h === 0 ? "held" : "booked";
        else if (w === "thu" && h === 0) taken[d] = "booked";
      }
      return { ok: true, taken, updated: addDays(today, -1) };
    });
    return once;
  },
};
