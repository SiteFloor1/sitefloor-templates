// @ts-check
/**
 * DEMO ONLY. Simulated places for the Alnwood demo, worked out from today so they never go stale: the baby room full
 * for two months then one place, the twos with a place now, pre-school full until spring. The same for every visitor.
 * Never bundled into client sites.
 */
import { monthsAhead, placeKey, ymdIn } from "../kits/nursery/lib/nursery.js";

const PATTERN = { garden: [0, 0, 1, 1, 2, 1], workshop: [1, 0, 0, 2, 2, 3], orchard: [0, 0, 0, 0, 3, 4] };

/** @type {import("../kits/nursery/features/nursery-places/nursery-places.js").PlacesProvider} */
export const simulatedNurseryPlaces = {
  async load(ctx) {
    const months = monthsAhead(ymdIn(Date.now(), ctx.data.hours.timezone), 6);
    /** @type {Record<string, number>} */
    const places = {};
    for (const [room, list] of Object.entries(PATTERN)) months.forEach((ym, i) => { places[placeKey(room, ym)] = list[i]; });
    return { ok: true, places, updatedAt: Date.now() - 86_400_000 };
  },
};
