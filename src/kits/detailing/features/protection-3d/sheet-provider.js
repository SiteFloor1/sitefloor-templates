// @ts-check
/**
 * The studio's film prices for client sites: its price sheet published as CSV (package, body, price, days), read
 * with a timeout and kept for ten minutes. Unreadable means no prices are shown ("Ask us").
 */
import { filmPricesFromCsv } from "../../lib/packages.js";

const TIMEOUT_MS = 6000;
/** @type {{ at: number, text: Promise<string|null> }|null} */
let cache = null;

/** @type {import("./protection-3d.js").FilmPriceProvider} */
export const sheetFilmPrices = {
  async load(ctx) {
    const cfg = /** @type {any} */ (ctx.data).detailing.film;
    if (!cache || Date.now() - cache.at > 600_000) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      cache = { at: Date.now(), text: fetch(cfg.csvUrl, { signal: controller.signal, cache: "no-store", credentials: "omit" }).then((r) => (r.ok ? r.text() : null), () => null).finally(() => clearTimeout(timer)) };
    }
    const text = await cache.text;
    return text === null ? { ok: false } : filmPricesFromCsv(text, cfg.packages, Object.keys(cfg.bodies));
  },
};
