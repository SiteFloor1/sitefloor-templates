// @ts-check
/** Sold out today for client sites: the stall's Form responses, published as CSV. Fails closed: nothing is struck. */
import { soldOutFromCsv } from "../../lib/stalls.js";

const TIMEOUT_MS = 6000;

/** @type {import("./stalls-sold-out.js").SoldOutProvider} */
export const sheetSoldOut = {
  async load(ctx) {
    const cfg = /** @type {any} */ (ctx.data).soldOut;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(cfg.csvUrl, { signal: controller.signal, cache: "no-store", credentials: "omit" });
      if (!res.ok) return { ok: false };
      return soldOutFromCsv(await res.text(), ctx.now().date);
    } catch {
      return { ok: false };
    } finally {
      clearTimeout(timer);
    }
  },
};
