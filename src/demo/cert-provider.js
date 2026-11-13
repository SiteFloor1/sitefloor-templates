// @ts-check
/**
 * DEMO ONLY. Example certificates for "Your home's certificates": the example code shows an EICR, a Part P notice,
 * a charger record and a warranty, dated from the day the page is opened so the reminder is always in the future.
 * Any other code is "not found". Never bundled into client sites.
 */
import { cleanCode } from "../kits/electrician/lib/certificates.js";

/** @param {Date} d @param {number} years @param {number} [days] */
const shift = (d, years, days = 0) => {
  const x = new Date(Date.UTC(d.getUTCFullYear() + years, d.getUTCMonth(), d.getUTCDate() + days));
  return x.toISOString().slice(0, 10);
};

/** @type {import("../kits/electrician/features/certificates/certificates.js").CertProvider} */
export const simulatedCerts = {
  async load(ctx, code) {
    const cfg = /** @type {any} */ (ctx.data).certificates;
    if (code !== cleanCode(cfg.example ?? "")) return { ok: false, reason: "unknown" };
    const now = new Date();
    return {
      ok: true,
      certs: [
        { kind: "ev", issued: shift(now, 0, -40), nextDue: "", note: "7 kW charger on the garage wall, load managed with the heat pump." },
        { kind: "warranty", issued: shift(now, -1, -12), nextDue: shift(now, 4, -12), note: "Five years on our workmanship for the rewire and lighting." },
        { kind: "part-p", issued: shift(now, -1, -14), nextDue: "", note: "Rewire and kitchen circuits, notified to building control." },
        { kind: "eicr", issued: shift(now, -1, -16), nextDue: shift(now, 4, -16), note: "Satisfactory. Two C3 observations, explained on page 3 of the report." },
      ],
    };
  },
};
