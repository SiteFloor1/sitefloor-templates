// @ts-check
/**
 * The diary for client sites: the trainer's Google Sheet published as CSV, read with a timeout and kept for a minute.
 * Fails closed: a network error, a timeout, a stale or unreadable sheet returns { ok: false }, and no hours are offered.
 */
import { diaryFromCsv } from "../../lib/trainer.js";

const TIMEOUT_MS = 6000;
/** @type {Promise<import("../../lib/trainer.js").Diary>|null} */
let pending = null;
let loadedAt = 0;

/** @type {import("./trainer-diary.js").DiaryProvider} */
export const sheetDiary = {
  load(ctx) {
    if (pending && Date.now() - loadedAt < 55_000) return pending;
    loadedAt = Date.now();
    const cfg = /** @type {any} */ (ctx.data).trainer.diary;
    pending = (async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      try {
        const res = await fetch(cfg.csvUrl, { signal: controller.signal, cache: "no-store", credentials: "omit" });
        if (!res.ok) return { ok: false };
        return diaryFromCsv(await res.text(), Date.now(), ctx.data.hours.timezone, cfg.staleAfterHours);
      } catch {
        return { ok: false };
      } finally {
        clearTimeout(timer);
      }
    })();
    return /** @type {Promise<import("../../lib/trainer.js").Diary>} */ (pending);
  },
};
