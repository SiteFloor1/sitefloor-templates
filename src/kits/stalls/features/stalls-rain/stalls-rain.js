// @ts-check
/**
 * Rain check (sold as an add-on): on the day of the chosen stop (or the next day), the free Open-Meteo hourly
 * forecast for that market, in one line under the next stop. Never cancels anything: only the stall's sheet does.
 */
import { rainWords, addDays } from "../../lib/stalls.js";
import { placeOf } from "../stalls-where/stalls-where.js";

/** @typedef {{ load: (ctx: import("../../../../core/js/core.js").Ctx, place: { lat: number, lon: number }) => Promise<{ time: string, p: number }[]|null> }} RainProvider */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  /** @type {RainProvider|null} */ const provider = ctx.providers.stallsRain;
  const cfg = /** @type {any} */ (ctx.data).stops;
  if (!provider || !cfg) throw new Error("rain provider missing");
  /** @type {Map<string, Promise<{ time: string, p: number }[]|null>>} */ const cache = new Map();
  let ticket = 0;
  const show = async (/** @type {any} */ s) => {
    const mine = ++ticket;
    /** @type {HTMLElement} */ (root).hidden = true;
    if (!s || s.cancelled) return;
    const today = ctx.now().date;
    if (s.date < today || s.date > addDays(today, 1)) return; // only on the day and the day before: forecasts are honest that close
    const p = placeOf(cfg, s.place);
    if (typeof p.lat !== "number") return;
    const key = `${p.lat},${p.lon}`;
    if (!cache.has(key)) cache.set(key, provider.load(ctx, p).catch(() => null));
    const hours = await cache.get(key);
    if (mine !== ticket || !hours) return;
    const words = rainWords(hours, s);
    if (!words) return;
    root.textContent = words;
    /** @type {HTMLElement} */ (root).hidden = false;
  };
  ctx.watch("stalls", (/** @type {{ stops: any[] }} */ w) => show(w.stops.find((s) => !s.cancelled)));
  ctx.watch("stallsChosen", show);
}
