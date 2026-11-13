// @ts-check
/** Events for client sites: the firm's own Google Sheet, published as CSV. Only compliance-approved, upcoming rows. Fails closed. */
import { eventsFromCsv } from "../../lib/events.js";
import { zonedNow } from "../../../../core/lib/hours.js";

const TIMEOUT_MS = 6000;

export const sheetEvents = {
  /** @param {any} ctx */
  async load(ctx) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(ctx.data.events.csvUrl, { signal: controller.signal, cache: "no-store", credentials: "omit" });
      if (!res.ok) return { ok: false };
      return { ok: true, items: eventsFromCsv(await res.text(), zonedNow(new Date(), ctx.data.hours.timezone).date).items };
    } catch {
      return { ok: false };
    } finally {
      clearTimeout(timer);
    }
  },
};
