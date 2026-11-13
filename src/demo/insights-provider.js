// @ts-check
/**
 * DEMO ONLY. The firm's insights sheet, simulated: the demo's sample CSV (site.json → insights.sample) read exactly as a
 * client's published sheet is, so the rows waiting for compliance approval stay off the page. Never bundled into client sites.
 */
import { insightsFromCsv } from "../kits/wealth/lib/insights.js";
import { zonedNow } from "../core/lib/hours.js";

export const simulatedInsights = {
  /** @param {any} ctx */
  async load(ctx) {
    const cfg = ctx.data.insights;
    const read = insightsFromCsv(cfg.sample ?? "", { today: zonedNow(new Date(), ctx.data.hours.timezone).date, photos: cfg.photos });
    return { ok: true, items: read.items };
  },
};
