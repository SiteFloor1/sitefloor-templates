// @ts-check
/**
 * Tonight's light in the readout, for the visitor's own day and the road chosen: golden hour, sunset and blue hour,
 * calculated (lib/carfilm.js), tomorrow's once tonight's has gone, checked again every minute. Other features choose
 * a road by ctx.share("road", id) (the location guide).
 */
import { evening, eveningLine, shortDay } from "../../lib/carfilm.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const d = /** @type {any} */ (ctx.data).carfilm;
  const sel = /** @type {HTMLSelectElement|null} */ (root.querySelector("[data-road]"));
  const out = (/** @type {string} */ k) => /** @type {HTMLElement} */ (root.querySelector(`[data-${k}]`));
  if (!d?.roads || !out("gold")) throw new Error("readout markup missing");
  let id = d.road;
  const paint = () => {
    const r = d.roads.find((/** @type {any} */ x) => x.id === id) ?? d.roads[0];
    const e = evening(Date.now(), r.lat, r.lon), l = eveningLine(e.light);
    out("when").textContent = e.when === "tonight" ? "Tonight" : "Tomorrow";
    out("day").textContent = shortDay(e.light.ymd);
    out("gold-k").textContent = l.low ? "Low sun all day" : "Golden hour";
    out("gold").textContent = l.gold; out("sunset").textContent = l.sunset; out("blue").textContent = l.blue;
  };
  sel?.addEventListener("change", () => { id = sel.value; paint(); });
  ctx.watch("road", (/** @type {string} */ v) => { id = v; if (sel) sel.value = v; paint(); });
  paint();
  ctx.everyMinute(paint);
}
