// @ts-check
/**
 * Rain check (sold as an add-on): on the day of the chosen stop (or the next day), MET Norway's hourly forecast for
 * that market, from the shared weather function (src/core/js/weather.js), in one line under the next stop, credited.
 * Never cancels anything: only the stall's sheet does.
 */
import { rainWords, addDays } from "../../lib/stalls.js";
import { placeOf } from "../stalls-where/stalls-where.js";
import { loadWeather, weatherCredit, localHour } from "../../../../core/js/weather.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).stops;
  if (!cfg) throw new Error("stops missing");
  const tz = /** @type {any} */ (ctx.data).hours?.timezone ?? "Europe/London";
  let ticket = 0;
  const show = async (/** @type {any} */ s) => {
    const mine = ++ticket;
    /** @type {HTMLElement} */ (root).hidden = true;
    if (!s || s.cancelled) return;
    const today = ctx.now().date;
    if (s.date < today || s.date > addDays(today, 1)) return; // only on the day and the day before: forecasts are honest that close
    const p = placeOf(cfg, s.place);
    if (typeof p.lat !== "number") return;
    const w = await loadWeather(ctx, p.id);
    if (mine !== ticket || !w) return;
    const hours = w.hours.filter((h) => h.rain !== null).map((h) => ({ time: localHour(h.time, tz), mm: /** @type {number} */ (h.rain) }));
    const words = rainWords(hours, s);
    if (!words) return;
    root.replaceChildren(`${words} `, ...weatherCredit(w, ctx.data.mode === "demo", tz));
    /** @type {HTMLElement} */ (root).hidden = false;
  };
  ctx.watch("stalls", (/** @type {{ stops: any[] }} */ w) => show(w.stops.find((s) => !s.cancelled)));
  ctx.watch("stallsChosen", show);
}
