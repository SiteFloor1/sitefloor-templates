// @ts-check
/**
 * Arrive at night. The line for the visitor's bay is built from the bay and the car (the charger is named only if
 * the bay has one), and follows the car picked on the home page (shared as "garage-car") or carried to the night
 * page in its link (?car=suv). With the aerial hall, the route from the gate to that bay is drawn over the night
 * render, with the bays free today shown empty.
 */
import { CARS, pickBay, route, nightBayLine, withFree } from "../../lib/garage.js";
import { frameMap, NS, freePatches } from "../garage-aerial/map.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const d = /** @type {any} */ (ctx.data);
  if (!d.hall) return;
  const svg = root.querySelector("[data-night-ov]");
  const phone = matchMedia("(max-width: 700px)");
  const fromLink = new URLSearchParams(location.search).get("car") ?? "";
  let key = fromLink in CARS ? fromLink : "estate", hall = d.hall;
  const base = root.querySelector("[data-img-base]")?.getAttribute("data-img-base") ?? "";
  const draw = () => {
    const car = CARS[/** @type {keyof typeof CARS} */ (key)], b = pickBay(hall, car);
    root.querySelectorAll("[data-night-bay]").forEach((el) => { el.textContent = nightBayLine(car, b); });
    const forLine = root.querySelector("[data-night-for]");
    if (forLine?.firstChild) forLine.firstChild.textContent = `For a ${car.name}. `;
    root.querySelectorAll("[data-night-link]").forEach((a) => { const u = new URL(/** @type {HTMLAnchorElement} */ (a).href); u.searchParams.set("car", key); /** @type {HTMLAnchorElement} */ (a).href = u.href; });
    if (!svg || !d.aerial) return;
    const m = frameMap(d, phone.matches);
    svg.setAttribute("viewBox", m.viewBox);
    svg.replaceChildren();
    const g = document.createElementNS(NS, "g"); svg.append(g);
    freePatches(g, hall, d, m, base + (phone.matches ? d.aerial.empty.nightPhone : d.aerial.empty.night));
    if (!b) return;
    const pts = route(hall, b.n, m.startX).points.map((p) => m.map(p[0], p[1]).join(" ")).join(" L");
    const el = (/** @type {string} */ n, /** @type {Record<string, string>} */ a) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); svg.append(e); return e; };
    el("path", { d: "M" + pts, class: "gn-glow" });
    el("path", { d: "M" + pts, class: "gn-line" });
    const q = d.rects[b.n], a = m.map(q.x0, q.north ? hall.depth : hall.bayDepth), c = m.map(q.x1, q.north ? hall.depth - hall.bayDepth : 0);
    el("rect", { x: String(Math.min(a[0], c[0])), y: String(Math.min(a[1], c[1])), width: String(Math.abs(c[0] - a[0])), height: String(Math.abs(c[1] - a[1])), class: "gn-bay" });
  };
  ctx.watch("garage-car", (k) => { if (k in CARS) { key = k; draw(); } });
  ctx.watch("garage-free", (f) => { hall = withFree(d.hall, f); draw(); });
  phone.addEventListener("change", draw);
  draw();
}
