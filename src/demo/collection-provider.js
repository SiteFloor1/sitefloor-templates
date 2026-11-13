// @ts-check
/**
 * DEMO ONLY. Example collection rounds for the detailing demo: the districts around Weybridge, the days for each and an
 * example charge, updated two hours ago. Never bundled into client sites.
 */
import { collectionFromCsv } from "../kits/detailing/lib/collection.js";
import { zonedNow, formatTime24 } from "../core/lib/hours.js";

/** @type {import("../kits/detailing/features/collection/collection.js").CollectionProvider} */
export const simulatedCollection = {
  async load(ctx) {
    const tz = ctx.data.hours.timezone, now = zonedNow(new Date(), tz);
    const at = `${now.date} ${formatTime24(Math.max(0, now.minutes - 120))}`;
    const rows = [
      "district,days,fee,updated_at",
      `KT13,mon tue wed thu fri sat,0,${at}`, `KT12,mon wed fri,0,${at}`, `KT15,tue fri,0,${at}`, `KT14,tue thu,20,${at}`,
      `KT11,mon thu,25,${at}`, `KT16,wed,25,${at}`, `GU21,thu,35,${at}`, `TW20,fri,35,${at}`,
    ];
    return collectionFromCsv(rows.join("\n"), Date.now(), tz, 168);
  },
};
