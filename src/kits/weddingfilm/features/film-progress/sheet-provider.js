// @ts-check
/** The couples' sheet for client sites: published as CSV, read with a timeout, kept for a minute. Codes, never names. Fails closed. */
import { progressFromCsv } from "../../lib/couples.js";

const TIMEOUT_MS = 6000;
/** @type {{ at: number, text: Promise<string|null> }|null} */
let cache = null;

/** @type {import("./film-progress.js").ProgressProvider} */
export const sheetProgress = {
  async load(ctx, code) {
    const cfg = /** @type {any} */ (ctx.data).weddingfilm.progress;
    if (!cache || Date.now() - cache.at > 60_000) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      cache = { at: Date.now(), text: fetch(cfg.csvUrl, { signal: controller.signal, cache: "no-store", credentials: "omit" }).then((r) => (r.ok ? r.text() : null), () => null).finally(() => clearTimeout(timer)) };
    }
    const text = await cache.text;
    if (text === null) return { ok: false, reason: "unreadable" };
    return progressFromCsv(text, code, Date.now(), ctx.data.hours.timezone, cfg.staleAfterHours ?? 72);
  },
};
