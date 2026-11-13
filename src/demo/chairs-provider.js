// @ts-check
/**
 * DEMO ONLY. Simulated chairs free today for the hair demo: three slots after now, on the half hour, inside today's
 * opening hours, rotating the salon's services and stylists. Nothing when the salon is closed. Never bundled into
 * client sites.
 */
import { rangesFor } from "../core/lib/hours.js";
import { minutesOf } from "../kits/hair/lib/hair.js";

/** @type {import("../kits/hair/features/chairs-today/chairs-today.js").ChairsProvider} */
export const simulatedChairs = {
  async load(ctx) {
    const data = /** @type {any} */ (ctx.data), now = ctx.now();
    const open = rangesFor(data.hours, now.date).ranges.map((/** @type {string[]} */ [a, b]) => [minutesOf(a), minutesOf(b)]);
    const services = data.chairs.services.map((/** @type {any} */ s) => s.id), people = data.stylists.items.map((/** @type {any} */ s) => s.id);
    const start = Math.ceil((now.minutes + 45) / 30) * 30;
    const slots = [];
    for (const [i, gap] of [0, 90, 240].entries()) {
      const t = start + gap;
      if (!open.some(([a, b]) => t >= a && t < b - 30)) continue;
      const hh = String(Math.floor(t / 60)).padStart(2, "0"), mm = String(t % 60).padStart(2, "0");
      slots.push({ service: services[i % services.length], time: `${hh}:${mm}`, stylist: people[(i * 2 + 1) % people.length] });
    }
    return slots.length ? { ok: true, slots } : { ok: false };
  },
};
