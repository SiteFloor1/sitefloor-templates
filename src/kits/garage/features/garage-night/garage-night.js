// @ts-check
/**
 * Arrive at night with the aerial hall: the route from the gate to the visitor's bay drawn over the night render. It
 * follows the car picked in the hero (shared as "garage-car"); the last step names the bay.
 */
import { CARS, pickBay, route } from "../../lib/garage.js";
import { frameMap, NS } from "../garage-aerial/map.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const d = /** @type {any} */ (ctx.data);
  const svg = root.querySelector("[data-night-ov]");
  if (!d.hall || !d.aerial || !svg) return;
  const phone = matchMedia("(max-width: 700px)");
  const steps = document.querySelector("[data-night-steps]");
  const last = steps?.lastElementChild, lastText = last?.textContent ?? "";
  let key = "estate";
  const draw = () => {
    const m = frameMap(d, phone.matches);
    svg.setAttribute("viewBox", m.viewBox);
    svg.replaceChildren();
    const car = CARS[/** @type {keyof typeof CARS} */ (key)], b = pickBay(d.hall, car);
    if (last) last.textContent = b ? lastText.replace(/\b(bay) \d+\b/i, (_, w) => `${w} ${b.n}`) : "No free bay for a van tonight: join the waiting list.";
    if (!b) return;
    const r = route(d.hall, b.n, m.startX), pts = r.points.map((p) => m.map(p[0], p[1]).join(" ")).join(" L");
    const el = (/** @type {string} */ n, /** @type {Record<string, string>} */ a) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); svg.append(e); return e; };
    el("path", { d: "M" + pts, class: "gn-glow" });
    el("path", { d: "M" + pts, class: "gn-line" });
    const q = d.rects[b.n], a = m.map(q.x0, q.north ? d.hall.depth : d.hall.bayDepth), c = m.map(q.x1, q.north ? d.hall.depth - d.hall.bayDepth : 0);
    el("rect", { x: String(Math.min(a[0], c[0])), y: String(Math.min(a[1], c[1])), width: String(Math.abs(c[0] - a[0])), height: String(Math.abs(c[1] - a[1])), class: "gn-bay" });
  };
  ctx.watch("garage-car", (k) => { key = k; draw(); });
  phone.addEventListener("change", draw);
  draw();
}
