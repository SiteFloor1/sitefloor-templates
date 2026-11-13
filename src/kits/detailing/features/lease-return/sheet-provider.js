// @ts-check
/**
 * The studio's lease-return prices for client sites: its sheet published as CSV (item, price), read with a timeout
 * and kept for ten minutes. Unreadable means every item says "Ask us".
 */
import { leasePricesFromCsv } from "../../lib/lease.js";

const TIMEOUT_MS = 6000;
/** @type {{ at: number, text: Promise<string|null> }|null} */
let cache = null;

/** @type {import("./lease-return.js").LeaseProvider} */
export const sheetLeasePrices = {
  async load(ctx) {
    const cfg = /** @type {any} */ (ctx.data).detailing.lease;
    if (!cache || Date.now() - cache.at > 600_000) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      cache = { at: Date.now(), text: fetch(cfg.csvUrl, { signal: controller.signal, cache: "no-store", credentials: "omit" }).then((r) => (r.ok ? r.text() : null), () => null).finally(() => clearTimeout(timer)) };
    }
    const text = await cache.text;
    return text === null ? { ok: false } : leasePricesFromCsv(text);
  },
};
