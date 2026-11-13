// @ts-check
/**
 * DEMO ONLY. A simulated sheet for the restaurant kit's demos. With rows in the site's `tonight.demo` (the café
 * demo: trays coming out at set times, a sold-out bake, staff's word on the queue, the regulars' board), those
 * rows, each dated "at" a time today or "ago" minutes before now; rows timed later than now don't show yet, as
 * on a real sheet. Without them, Saffron & Ash's: two specials and one sold-out dish updated this morning, and
 * walk-in tables that change through the evening. Never bundled into client sites.
 */
import { tonightFromCsv } from "../kits/restaurant/lib/tonight.js";
import { zonedNow, formatTime24 } from "../core/lib/hours.js";

/** @type {import("../kits/restaurant/features/specials/sheet-provider.js").TonightProvider} */
export const simulatedTonight = {
  async load(ctx) {
    const tz = ctx.data.hours.timezone;
    const now = zonedNow(new Date(), tz);
    /** @type {{ kind: string, name: string, price?: number, note?: string, at?: string, ago?: number }[]|undefined} */
    const rows = /** @type {any} */ (ctx.data).tonight?.demo;
    if (rows) {
      const q = (/** @type {string} */ v) => `"${v.replace(/"/g, '""')}"`;
      const stamp = (/** @type {typeof rows[number]} */ r) => {
        if (r.at !== undefined) return `${now.date} ${r.at}`;
        const t = zonedNow(new Date(Date.now() - (r.ago ?? 0) * 60_000), tz);
        return `${t.date} ${formatTime24(t.minutes)}`;
      };
      const csv = ["kind,name,price,note,updated_at", ...rows.map((r) => [r.kind, q(r.name), r.price ?? "", q(r.note ?? ""), stamp(r)].join(","))].join("\n");
      return tonightFromCsv(csv, Date.now(), tz, /** @type {any} */ (ctx.data).tonight?.staleAfterMinutes ?? 45);
    }
    const at = (/** @type {number} */ minsAgo) => `${now.date} ${formatTime24(Math.max(0, now.minutes - minsAgo))}`;
    // Busier as the evening goes on: free early, a few at 7, bar seats only at the 8pm peak.
    const state = now.minutes < 18 * 60 + 30 ? "free" : now.minutes < 19 * 60 + 30 ? "few" : now.minutes < 21 * 60 ? "bar" : "few";
    const morning = Math.min(now.minutes, Math.max(5, now.minutes - 11 * 60));
    const csv = [
      "kind,name,price,note,updated_at",
      `tables,${state},,${state === "bar" ? "Tables free again from about 9pm" : ""},${at(6)}`,
      `special,Lamb neck shawarma,19,"Slow over the coals since 8am, until it's gone",${at(morning)}`,
      `special,Burnt Basque cheesecake,8,With sour cherries,${at(morning)}`,
      `soldout,whole-bream,,,${at(Math.min(now.minutes, 40))}`,
    ].join("\n");
    return tonightFromCsv(csv, Date.now(), tz, /** @type {any} */ (ctx.data).tonight?.staleAfterMinutes ?? 45);
  },
};
