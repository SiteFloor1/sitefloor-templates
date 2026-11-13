// @ts-check
/**
 * The studio's collection rounds for client sites: its sheet published as CSV (district, days, fee, updated_at), read
 * with a timeout and kept for ten minutes. Fails closed: unreadable or stale means "ask us".
 */
import { collectionFromCsv } from "../../lib/collection.js";

const TIMEOUT_MS = 6000;
/** @type {{ at: number, text: Promise<string|null> }|null} */
let cache = null;

/** @type {import("./collection.js").CollectionProvider} */
export const sheetCollection = {
  async load(ctx) {
    const cfg = /** @type {any} */ (ctx.data).detailing.collection;
    if (!cache || Date.now() - cache.at > 600_000) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      cache = { at: Date.now(), text: fetch(cfg.csvUrl, { signal: controller.signal, cache: "no-store", credentials: "omit" }).then((r) => (r.ok ? r.text() : null), () => null).finally(() => clearTimeout(timer)) };
    }
    const text = await cache.text;
    if (text === null) return { ok: false, reason: "unreadable" };
    return collectionFromCsv(text, Date.now(), ctx.data.hours.timezone, cfg.staleAfterHours);
  },
};
