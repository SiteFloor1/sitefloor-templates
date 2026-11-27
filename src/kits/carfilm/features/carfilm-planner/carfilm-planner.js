// @ts-check
/**
 * The planner: road and date → golden hour, sunset, blue hour (lib/carfilm.js) and the day as a band of light. Shares
 * the plan ("plan": { road, light }) for the forecast and the share card; the Hold button sends it on WhatsApp.
 */
import { dayLight, eveningLine, shortDay, ukYmd, ukMidnight, fill, LIGHT } from "../../lib/carfilm.js";
import { solarAngles } from "../../../../core/lib/sun.js";

/** @param {string} ymd */
const nextDay = (ymd) => new Date(Date.parse(`${ymd}T12:00:00Z`) + 86_400_000).toISOString().slice(0, 10);

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const d = /** @type {any} */ (ctx.data).carfilm;
  const q = (/** @type {string} */ k) => /** @type {any} */ (root.querySelector(`[data-pl-${k}]`));
  const road = q("road"), date = q("date"), band = /** @type {HTMLCanvasElement} */ (q("band"));
  if (!d?.roads || !road || !date || !band) throw new Error("planner markup missing");
  date.value = ukYmd(Date.now()); date.min = date.value;
  // The band's colours are the look's tokens: night, blue hour, golden hour (the accent), low sun, day.
  const css = getComputedStyle(root), tok = (/** @type {string} */ n) => css.getPropertyValue(n).trim();
  const [night, blue, gold, low, day] = ["--cf-night", "--cf-blue", "--accent", "--cf-low", "--cf-day"].map(tok);
  const colour = (/** @type {number} */ e) => e < LIGHT.blueBottom ? night : e < LIGHT.goldBottom ? blue : e < LIGHT.goldTop ? gold : e < 15 ? low : day;
  const paint = () => {
    if (!/^\d{4}-\d\d-\d\d$/.test(date.value)) return;
    const r = d.roads.find((/** @type {any} */ x) => x.id === road.value) ?? d.roads[0];
    const light = dayLight(date.value, r.lat, r.lon), l = eveningLine(light);
    q("k").textContent = l.low ? "Low sun all day" : "Golden hour";
    q("gold").textContent = l.gold; q("day").textContent = shortDay(date.value); q("sunset").textContent = l.sunset; q("blue").textContent = l.blue;
    const g = band.getContext("2d"), base = ukMidnight(date.value), len = ukMidnight(nextDay(date.value)) - base;
    if (g) for (let x = 0; x < band.width; x++) { g.fillStyle = colour(solarAngles(base + (x / band.width) * len, r.lat, r.lon).elevation); g.fillRect(x, 0, 1, band.height); }
    q("hold").href = ctx.bookHref(fill(d.planner, { road: r.name, date: shortDay(date.value), gold: l.gold, sunset: l.sunset }));
    ctx.share("plan", { road: r, ymd: date.value, light, line: l });
  };
  road.addEventListener("change", paint); date.addEventListener("change", paint); date.addEventListener("input", paint);
  paint();
}
