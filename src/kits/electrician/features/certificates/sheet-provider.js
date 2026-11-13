// @ts-check
/** Certificates for client sites: the client's published Google Sheet (CSV). Fails closed on any error or timeout. */
import { certsFromCsv } from "../../lib/certificates.js";

const TIMEOUT_MS = 6000;

/** @type {import("./certificates.js").CertProvider} */
export const sheetCerts = {
  async load(ctx, code) {
    const cfg = /** @type {any} */ (ctx.data).certificates;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(cfg.csvUrl, { signal: controller.signal, cache: "no-store", credentials: "omit" });
      if (!res.ok) return { ok: false, reason: "unreadable" };
      return certsFromCsv(await res.text(), code);
    } catch {
      return { ok: false, reason: "unreadable" };
    } finally {
      clearTimeout(timer);
    }
  },
};
