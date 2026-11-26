// @ts-check
/**
 * DEMO ONLY. The Elsden demo's free bays as if its sheet had just been updated: the bays the demo lists as free,
 * updated a few minutes ago, and two let bays the owner expects back (worked out from today). Never bundled into
 * client sites.
 */

/** @type {import("../kits/garage/features/garage-spaces/garage-spaces.js").BaysProvider} */
export const simulatedProvider = {
  intervalMs: 5 * 60_000,
  async load(ctx) {
    const d = /** @type {any} */ (ctx.data);
    const now = Date.now();
    const day = (/** @type {number} */ n) => { const t = new Date(now); t.setUTCHours(9, 0, 0, 0); return t.getTime() + n * 86_400_000; };
    return { ok: true, free: d.liveBays.listed, updatedAt: now - ((Math.floor(now / 60_000) % 11) + 3) * 60_000, soon: [{ n: 12, from: day(17) }, { n: 5, from: day(38) }].filter((x) => d.liveBays.known.includes(x.n) && !d.liveBays.listed.includes(x.n)) };
  },
};
