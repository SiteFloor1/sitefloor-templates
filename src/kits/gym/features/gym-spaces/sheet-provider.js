// @ts-check
/**
 * Places left for client sites: the club's Google Sheet published as CSV (`date,time,class,left,updated_at`), read with
 * a timeout and kept for a minute. Fails closed: { ok: false } on any error, and only fresh rows count.
 */
import { placesFromCsv } from "../../lib/gym.js";

const TIMEOUT_MS = 6000;
/** @type {Promise<import("../../lib/gym.js").Places>|null} */
let pending = null;
let loadedAt = 0;

/** The most places each class or slot can have. @param {any} g */
export function sizesOf(g) {
  /** @type {Record<string, number>} */
  const sizes = {};
  for (const [id, c] of Object.entries(g.classes)) sizes[id] = /** @type {any} */ (c).size ?? 200;
  for (const s of g.recovery ?? []) sizes[s.id] = s.size;
  return sizes;
}

/** @type {import("./gym-spaces.js").PlacesProvider} */
export const sheetGymPlaces = {
  load(ctx) {
    if (pending && Date.now() - loadedAt < 55_000) return pending;
    loadedAt = Date.now();
    const g = /** @type {any} */ (ctx.data).gym;
    pending = (async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      try {
        const res = await fetch(g.spaces.csvUrl, { signal: controller.signal, cache: "no-store", credentials: "omit" });
        if (!res.ok) return { ok: false };
        return placesFromCsv(await res.text(), Date.now(), ctx.data.hours.timezone, g.spaces.staleAfterMinutes, sizesOf(g));
      } catch {
        return { ok: false };
      } finally {
        clearTimeout(timer);
      }
    })();
    return /** @type {Promise<import("../../lib/gym.js").Places>} */ (pending);
  },
};
