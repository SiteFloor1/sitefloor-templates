// @ts-check
/**
 * The studio's diary for client sites: its Google Sheet published as CSV (date, status, updated_at), read with a
 * timeout and kept for a minute. Fails closed: unreadable or stale means no dates are offered.
 */
import { diaryFromCsv } from "../../lib/dates.js";

const TIMEOUT_MS = 6000;
/** @type {{ at: number, text: Promise<string|null> }|null} */
let cache = null;

/** @type {import("./availability.js").DiaryProvider} */
export const sheetDiary = {
  async load(ctx) {
    const cfg = /** @type {any} */ (ctx.data).detailing.diary;
    if (!cache || Date.now() - cache.at > 60_000) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      cache = { at: Date.now(), text: fetch(cfg.csvUrl, { signal: controller.signal, cache: "no-store", credentials: "omit" }).then((r) => (r.ok ? r.text() : null), () => null).finally(() => clearTimeout(timer)) };
    }
    const text = await cache.text;
    if (text === null) return { ok: false, reason: "unreadable" };
    return diaryFromCsv(text, Date.now(), ctx.data.hours.timezone, cfg.staleAfterHours);
  },
};
