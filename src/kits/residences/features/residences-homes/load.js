// @ts-check
/**
 * The homes, loaded once per page and shared by every residences feature on it (the list, the stay bar, the
 * residences page, the quote). A failed or stale sheet comes back as { ok: false }: nothing is shown as free.
 */
/** @typedef {{ ok: boolean, reason?: string, homes: import("../../lib/homes.js").Home[], updatedAt: number }} HomesState */
/** @type {WeakMap<object, Promise<HomesState>>} */ const loading = new WeakMap();

/** @param {import("../../../../core/js/core.js").Ctx} ctx @returns {Promise<HomesState>} */
export function homesState(ctx) {
  const got = loading.get(ctx);
  if (got) return got;
  const provider = ctx.providers.residences;
  const p = (async () => {
    /** @type {import("../../lib/homes.js").Homes} */ let r = { ok: false, reason: "unreadable" };
    try { if (provider) r = await provider.load(ctx); } catch { /* fails closed */ }
    return r.ok ? { ok: true, homes: r.homes, updatedAt: r.updatedAt } : { ok: false, reason: r.reason, homes: [], updatedAt: 0 };
  })();
  loading.set(ctx, p);
  return p;
}

const WORDS = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve"];
/** "Four homes, " for the section heading. @param {number} n */
export const countWords = (n) => `${WORDS[n] ?? n} ${n === 1 ? "home" : "homes"}, `;
