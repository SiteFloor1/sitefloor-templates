// @ts-check
/**
 * DEMO ONLY. Today's line for the Alnwood demo: on weekdays a sample notice, so the feature can be seen; nothing at
 * weekends. Never bundled into client sites.
 */
import { dayKey } from "../kits/nursery/lib/nursery.js";

/** @type {import("../kits/nursery/features/nursery-today/nursery-today.js").TodayProvider} */
export const simulatedNurseryToday = {
  async load(ctx, today) {
    return ["sat", "sun"].includes(dayKey(today)) ? "" : "Wellies on: the garden is muddy and we're out all morning. (Sample notice)";
  },
};
