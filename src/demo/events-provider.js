// @ts-check
/**
 * DEMO ONLY. The firm's events sheet, simulated: the demo's sample CSV (site.json → events.sample) read exactly as a
 * client's published sheet is, so rows not yet approved by compliance stay off the page. Never bundled into client sites.
 */
import { eventsFromCsv } from "../kits/wealth/lib/events.js";
import { zonedNow } from "../core/lib/hours.js";

export const simulatedEvents = {
  /** @param {any} ctx */
  async load(ctx) {
    return { ok: true, items: eventsFromCsv(ctx.data.events.sample ?? "", zonedNow(new Date(), ctx.data.hours.timezone).date).items };
  },
};
