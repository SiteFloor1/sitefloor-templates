// @ts-check
/** Today's line for client sites, from the nursery's published Google Sheet (date,message). Fails closed: "". */
import { todayFromCsv } from "../../lib/nursery.js";

const TIMEOUT_MS = 6000;

/** @type {import("./nursery-today.js").TodayProvider} */
export const sheetNurseryToday = {
  async load(ctx, today) {
    const cfg = /** @type {any} */ (ctx.data).nursery.today;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(cfg.csvUrl, { signal: controller.signal, cache: "no-store", credentials: "omit" });
      return res.ok ? todayFromCsv(await res.text(), today) : "";
    } catch {
      return "";
    } finally {
      clearTimeout(timer);
    }
  },
};
