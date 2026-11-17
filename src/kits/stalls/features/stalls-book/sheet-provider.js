// @ts-check
/** Party dates for client sites: the stall's own sheet (date, status taken/few/open, updated_at). Fails closed. */
import { partyDatesFromCsv } from "../../lib/stalls.js";

const TIMEOUT_MS = 6000;

/** @type {import("./stalls-book.js").PartyProvider} */
export const sheetPartyDates = {
  async load(ctx) {
    const cfg = /** @type {any} */ (ctx.data).party;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(cfg.csvUrl, { signal: controller.signal, cache: "no-store", credentials: "omit" });
      if (!res.ok) return { ok: false };
      return partyDatesFromCsv(await res.text(), Date.now(), cfg.staleAfterDays ?? 21);
    } catch {
      return { ok: false };
    } finally {
      clearTimeout(timer);
    }
  },
};
