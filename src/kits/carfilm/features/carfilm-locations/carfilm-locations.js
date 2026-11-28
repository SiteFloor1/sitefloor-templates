// @ts-check
/** The roads list: each road's golden hour for the visitor's own day; tap one to show it in the viewfinder's readout. */
import { evening, eveningLine } from "../../lib/carfilm.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const roads = /** @type {any} */ (ctx.data).carfilm?.roads ?? [];
  const btns = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll("[data-road-id]")]);
  const paint = () => {
    for (const b of btns) {
      const r = roads.find((/** @type {any} */ x) => x.id === b.dataset.roadId);
      if (!r) continue;
      const l = eveningLine(evening(Date.now(), r.lat, r.lon).light);
      const g = b.querySelector("[data-t-gold]"), s = b.querySelector("[data-t-sunset]");
      if (g) g.textContent = l.gold;
      if (s) s.textContent = l.sunset;
    }
  };
  for (const b of btns) b.addEventListener("click", () => {
    for (const x of btns) x.setAttribute("aria-pressed", String(x === b));
    ctx.share("road", b.dataset.roadId);
    document.querySelector(".cf-mon")?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
  });
  ctx.watch("road", (/** @type {string} */ id) => { for (const x of btns) x.setAttribute("aria-pressed", String(x.dataset.roadId === id)); });
  paint();
  ctx.everyMinute(paint);
}
