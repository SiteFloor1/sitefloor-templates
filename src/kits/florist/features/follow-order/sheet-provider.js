// @ts-check
/**
 * The florist's private pages on client sites: an order (follow your order) and a business client's flowers this
 * week, each read from the florist's own published Google Sheet by reference. Fails closed: a network error, a
 * timeout or an unreadable Sheet returns { ok: false, reason: "unreadable" }.
 */
import { orderFromCsv, accountFromCsv } from "../../lib/track.js";

const TIMEOUT_MS = 6000;

/** @param {string} url */
async function csv(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal, cache: "no-store", credentials: "omit" });
    return res.ok ? await res.text() : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** @typedef {import("../../lib/track.js").Order | import("../../lib/track.js").Account | import("../../lib/track.js").NoResult} Result */
/** @typedef {{ every?: number, order: (ctx: any, ref: string) => Promise<import("../../lib/track.js").Order | import("../../lib/track.js").NoResult>, account: (ctx: any, code: string) => Promise<import("../../lib/track.js").Account | import("../../lib/track.js").NoResult>, drop?: (ctx: any) => Promise<{ left: number|null, updated: number|null }> }} FloristProvider */

/** @type {FloristProvider} */
export const sheetFlorist = {
  async order(ctx, ref) {
    const t = ctx.data.florist.tracker;
    const text = await csv(t.csvUrl);
    return text === null ? { ok: false, reason: "unreadable" } : orderFromCsv(text, ref, t.stages, Date.now(), t.staleAfterHours, ctx.data.florist.timeZone);
  },
  async account(ctx, code) {
    const a = ctx.data.florist.accounts;
    const text = await csv(a.csvUrl);
    return text === null ? { ok: false, reason: "unreadable" } : accountFromCsv(text, code, Date.now(), a.staleAfterDays, ctx.data.florist.timeZone);
  },
};
