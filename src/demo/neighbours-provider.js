// @ts-check
/**
 * DEMO ONLY. A simulated week at each of the demo's live sites, updated this morning. Never bundled into client sites.
 */
const WEEKS = /** @type {Record<string, { week: string, noisy: string, deliveries: string }>} */ ({
  "n5-rear": { week: "Bricklayers are building the new walls at the back.", noisy: "Cutting blocks on Tuesday and Wednesday mornings.", deliveries: "Steel beams on Thursday, before 9 am, by the side gate." },
  "nw3-loft": { week: "The scaffold is up and the roofers are opening the back of the roof.", noisy: "Most of Monday, while the old roof comes off.", deliveries: "Timber on Wednesday; the lorry stays no longer than half an hour." },
});

export const simulatedNeighbours = {
  /** @param {any} _ctx @param {string} site */
  async load(_ctx, site) {
    const w = WEEKS[site];
    if (!w) return { ok: false, reason: "unknown" };
    const now = new Date(); now.setHours(8, 15, 0, 0);
    return { ok: true, updatedAt: Math.min(Date.now() - 60_000, now.getTime()), ...w };
  },
};
