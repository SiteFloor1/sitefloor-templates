// @ts-check
/**
 * The class passport for client sites: the studio's sheet published as CSV, read with a timeout and kept for a minute.
 * The sheet holds codes, never names. Fails closed.
 */
import { passportFromCsv } from "../../lib/members.js";

const TIMEOUT_MS = 6000;
/** @type {{ at: number, text: Promise<string|null> }|null} */
let cache = null;

/** @type {import("./class-passport.js").PassportProvider} */
export const sheetPassport = {
  async load(ctx, code) {
    const cfg = /** @type {any} */ (ctx.data).pilates.passport;
    if (!cache || Date.now() - cache.at > 60_000) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      cache = { at: Date.now(), text: fetch(cfg.csvUrl, { signal: controller.signal, cache: "no-store", credentials: "omit" }).then((r) => (r.ok ? r.text() : null), () => null).finally(() => clearTimeout(timer)) };
    }
    const text = await cache.text;
    if (text === null) return { ok: false, reason: "unreadable" };
    return passportFromCsv(text, code, Date.now(), ctx.data.hours.timezone, cfg.staleAfterHours ?? 48);
  },
};
