// @ts-check
/**
 * Free bays for client sites: the client's published Google Sheet (CSV), one row per bay. Fails closed: a network
 * error, a timeout, an unknown bay or a list older than staleHours returns { ok: false }, and the page says when its
 * list was last published instead of guessing.
 */
import { baysFromCsv } from "../../lib/garage.js";
import { parseSheetTime } from "../../../../core/lib/sheet.js";

const TIMEOUT_MS = 6000;

/** @type {import("./garage-spaces.js").BaysProvider} */
export const sheetProvider = {
  intervalMs: 5 * 60_000,
  async load(ctx) {
    const d = /** @type {any} */ (ctx.data), cfg = d.liveBays;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(cfg.csvUrl, { signal: controller.signal, cache: "no-store", credentials: "omit" });
      if (!res.ok) return { ok: false };
      return baysFromCsv(await res.text(), cfg.known, Date.now(), cfg.staleHours, (t) => parseSheetTime(t, d.hours.timezone));
    } catch {
      return { ok: false };
    } finally {
      clearTimeout(timer);
    }
  },
};
