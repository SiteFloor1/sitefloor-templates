// @ts-check
/**
 * Your car, for client sites: the studio's sheet published as CSV (code, car, work, stage, stage_name, note, photo,
 * handover, updated_at), read with a timeout and kept for a minute. No names or registrations in it. Fails closed.
 */
import { carFromCsv } from "../../lib/progress.js";

const TIMEOUT_MS = 6000;
/** @type {{ at: number, text: Promise<string|null> }|null} */
let cache = null;

/** @type {import("./car-progress.js").ProgressProvider} */
export const sheetProgress = {
  async load(ctx, code) {
    const cfg = /** @type {any} */ (ctx.data).detailing.progress;
    if (!cache || Date.now() - cache.at > 60_000) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      cache = { at: Date.now(), text: fetch(cfg.csvUrl, { signal: controller.signal, cache: "no-store", credentials: "omit" }).then((r) => (r.ok ? r.text() : null), () => null).finally(() => clearTimeout(timer)) };
    }
    const text = await cache.text;
    if (text === null) return { ok: false, reason: "unreadable" };
    return carFromCsv(text, code, Date.now(), ctx.data.hours.timezone, cfg.staleAfterHours, cfg.stages);
  },
};
