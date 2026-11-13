// @ts-check
/**
 * DEMO ONLY. A simulated hire Sheet for Datum Hire: each car has a few spells already taken over the coming weeks (the
 * same every visit on a given day, different per car), about a third of the fleet is out this weekend, and the example
 * deposit reference moves from held to car checked to returned every 20 seconds. Never bundled into client sites.
 */
import { availabilityFromCsv, depositFromCsv, cleanRef } from "../kits/hire/lib/sheet.js";
import { zonedNow, addDays, formatTime24 } from "../core/lib/hours.js";

const opened = Date.now();
const STEP_MS = 20_000;

/** A small stable number from a car id. @param {string} s */
const hash = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

/** @type {import("../kits/hire/features/fleet/sheet-provider.js").FleetProvider} */
export const simulatedFleet = {
  async availability(ctx) {
    const tz = ctx.data.hours.timezone;
    const now = zonedNow(new Date(), tz);
    const cars = /** @type {any} */ (ctx.data).hire.cars ?? [];
    const sat = addDays(now.date, (6 - now.weekday + 7) % 7);
    const rows = ["car,from,to,updated_at"];
    for (const id of cars) {
      const h = hash(id);
      if (h % 3 === 0) rows.push(`${id},${addDays(sat, -1)},${addDays(sat, 1)},${now.date} ${formatTime24(Math.max(0, now.minutes - 40))}`);
      for (let k = 0; k < 3; k++) {
        const start = addDays(now.date, 3 + ((h >>> (k * 4)) % 9) + k * 12);
        rows.push(`${id},${start},${addDays(start, 1 + ((h >>> k) % 4))},${now.date} ${formatTime24(Math.max(0, now.minutes - 90))}`);
      }
    }
    return availabilityFromCsv(rows.join("\n"), Date.now(), tz, /** @type {any} */ (ctx.data).hire.availability.staleAfterHours);
  },
  async deposit(ctx, ref) {
    const cfg = /** @type {any} */ (ctx.data).hire.deposits;
    const tz = ctx.data.hours.timezone;
    const now = zonedNow(new Date(), tz);
    const k = Math.min(2, Math.floor((Date.now() - opened) / STEP_MS));
    const status = ["held", "checked", "returned"][k];
    const rows = ["ref,status,date,updated_at", `${cleanRef(cfg.example)},${status},${now.date},${now.date} ${formatTime24(now.minutes)}`];
    return depositFromCsv(rows.join("\n"), ref, Date.now(), tz, cfg.staleAfterHours);
  },
};
