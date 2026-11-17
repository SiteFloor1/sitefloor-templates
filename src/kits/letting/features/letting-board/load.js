// @ts-check
/**
 * The homes, loaded once per page and shared by every letting feature on it (the list, the lift plate, the 3D
 * building, the residences schedule). A failed or stale sheet comes back as { ok: false }: nothing is shown as free.
 */
import { freeOn } from "../../lib/homes.js";

/** @typedef {{ load: (ctx: import("../../../../core/js/core.js").Ctx) => Promise<import("../../lib/homes.js").Homes> }} HomesProvider */
/** @typedef {{ ok: boolean, reason?: string, homes: import("../../lib/homes.js").Home[], updatedAt: number, buildings: any[] }} HomesState */

/** @type {WeakMap<object, Promise<HomesState>>} */ const loading = new WeakMap();

/** @param {import("../../../../core/js/core.js").Ctx} ctx @returns {Promise<HomesState>} */
export function homesState(ctx) {
  const got = loading.get(ctx);
  if (got) return got;
  const cfg = /** @type {any} */ (ctx.data).homes;
  /** @type {HomesProvider|undefined} */ const provider = ctx.providers.homes;
  const p = (async () => {
    /** @type {import("../../lib/homes.js").Homes} */ let r = { ok: false, reason: "unreadable" };
    try { if (provider) r = await provider.load(ctx); } catch { /* fails closed */ }
    return r.ok ? { ok: true, homes: r.homes, updatedAt: r.updatedAt, buildings: cfg.buildings }
      : { ok: false, reason: r.reason, homes: [], updatedAt: 0, buildings: cfg.buildings };
  })();
  loading.set(ctx, p);
  return p;
}

/** Free homes in a building (or on one of its floors). @param {HomesState} s @param {string} building @param {string|null} [floor] */
export function free(s, building, floor = null) {
  if (!s.ok) return [];
  const b = s.buildings.find((x) => x.id === building);
  if (!b) return [];
  return b.floors.filter((/** @type {any} */ f) => floor === null || f.id === floor).flatMap((/** @type {any} */ f) => freeOn(s.homes, building, f.id));
}

const WORDS = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];
/** "Five homes free now." @param {number} n */
export const countLine = (n) => `${WORDS[n] ?? n} ${n === 1 ? "home" : "homes"} free now.`;
