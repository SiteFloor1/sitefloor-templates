// @ts-check
/**
 * DEMO ONLY. The Elsden demo's free bays as if its sheet had just been updated: the bays the demo lists as free,
 * updated a few minutes ago. Never bundled into client sites.
 */

/** @type {import("../kits/garage/features/garage-spaces/garage-spaces.js").BaysProvider} */
export const simulatedProvider = {
  intervalMs: 5 * 60_000,
  async load(ctx) {
    const d = /** @type {any} */ (ctx.data);
    const now = Date.now();
    return { ok: true, free: d.liveBays.listed, updatedAt: now - ((Math.floor(now / 60_000) % 11) + 3) * 60_000 };
  },
};
