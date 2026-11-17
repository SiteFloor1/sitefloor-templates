// @ts-check
/**
 * DEMO ONLY. Simulated places left for the Wrenna demo: the youngest Saturday class full, a few sessions down to one or
 * two places, the rest with room. The same for every visitor. Never bundled into client sites.
 */

/** @type {import("../kits/ballet/features/ballet-places/ballet-places.js").PlacesProvider} */
export const simulatedPlaces = {
  async load() {
    return {
      ok: true,
      updatedAt: Date.now() - 86_400_000,
      places: {
        "grown-up|sat|09:15": 3,
        "little|tue|16:00": 2,
        "little|sat|10:00": "full",
        "one|wed|16:15": 4,
        "one|sat|11:00": 1,
        "two|thu|16:30": 5,
        "boys|sat|12:00": 6,
        "three|mon|17:00": 3,
        "four|tue|17:30": 2,
        "senior|thu|18:00": 4,
      },
    };
  },
};
