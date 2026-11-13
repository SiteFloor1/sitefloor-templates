// @ts-check
/**
 * The flavour vote's count for client sites: the shop's Form responses sheet, published as CSV. Fails closed: a
 * network error, timeout or unreadable sheet gives { ok: false } and the page shows no numbers.
 */
import { votesFromCsv, voteWindow } from "../../lib/vote.js";

/** @typedef {{ load: (ctx: import("../../../../core/js/core.js").Ctx) => Promise<import("../../lib/vote.js").Votes> }} VoteProvider */

/** @type {VoteProvider} */
export const sheetVotes = {
  async load(ctx) {
    const v = /** @type {any} */ (ctx.data).vote, tz = ctx.data.hours.timezone;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    try {
      const res = await fetch(v.csvUrl, { signal: controller.signal, cache: "no-store", credentials: "omit" });
      if (!res.ok) return { ok: false };
      return votesFromCsv(await res.text(), v.candidates, voteWindow(v.closes, tz), tz);
    } catch {
      return { ok: false };
    } finally {
      clearTimeout(timer);
    }
  },
};
