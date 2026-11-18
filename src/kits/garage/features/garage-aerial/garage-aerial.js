// @ts-check
/**
 * The hall from above. A top-down render of a car the chosen size drives in through the gate and turns nose first
 * into the bay that fits; the bay then lights. It plays once when the hall first comes into view, again whenever a
 * car is picked, and never with reduced motion (the car is shown parked). Charging and cameras are layers.
 */
import { CARS, pickBay, route, along, cone, chargerWords } from "../../lib/garage.js";
import { frameMap, NS } from "./map.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const d = /** @type {any} */ (ctx.data);
  const svg = root.querySelector("[data-aerial-ov]"), note = root.querySelector("[data-layer-note]");
  if (!d.hall || !d.aerial || !svg) return;
  const phone = matchMedia("(max-width: 700px)"), still = matchMedia("(prefers-reduced-motion: reduce)");
  /** @type {Record<string, boolean>} */ const shown = {};
  let key = "estate", seen = false, anim = 0;
  /** @type {any} */ let m, car, glow, carImg;
  /** @type {Record<string, any>} */ const layers = {};
  const el = (/** @type {string} */ n, /** @type {Record<string, string|number>} */ a = {}, /** @type {Element} */ p = svg) => {
    const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, String(a[k])); p.append(e); return e;
  };
  const draw = () => {
    m = frameMap(d, phone.matches);
    svg.setAttribute("viewBox", m.viewBox);
    svg.replaceChildren();
    const fs = phone.matches ? 0.6 : 0.42;
    glow = el("g", { class: "ga-glow" });
    layers.charge = el("g", { class: "ga-lay" });
    for (const c of d.chargers) {
      const q = d.rects[c.n], [x, y] = m.map(q.x1 - 0.45, q.north ? d.hall.depth - 0.3 : 0.3);
      el("circle", { cx: x, cy: y, r: 1.5, class: "ga-ch-halo" }, layers.charge);
      el("circle", { cx: x, cy: y, r: 0.14, class: "ga-ch-dot" }, layers.charge);
      const off = phone.matches ? 2 : 1.25, [tx, ty] = m.map(q.cx, q.north ? d.hall.depth - d.hall.bayDepth - off : d.hall.bayDepth + off);
      const t = el("text", { x: tx, y: ty, class: "ga-tag", "text-anchor": "middle", "dominant-baseline": "middle", style: `font-size:${fs * 0.85}px` }, layers.charge);
      t.textContent = `${c.kw} kW`;
    }
    layers.watch = el("g", { class: "ga-lay" });
    for (const c of d.cameras) {
      el("path", { d: "M" + cone(c).map((p) => m.map(p[0], p[1]).join(" ")).join(" L") + "Z", class: "ga-cone" }, layers.watch);
      const [x, y] = m.map(c.x, c.y);
      el("circle", { cx: x, cy: y, r: 0.16, class: "ga-ch-dot" }, layers.watch);
    }
    const [gx, gy] = m.map(0.5, d.hall.gate.y + 1);
    const gt = el("text", { x: gx, y: gy, class: "ga-tag", "text-anchor": phone.matches ? "middle" : "start", style: `font-size:${fs}px` }, layers.watch);
    gt.textContent = "Gate · fob, every hour";
    for (const k in layers) layers[k].classList.toggle("on", !!shown[k]);
    car = el("g", { opacity: 0 });
    carImg = el("image", { x: -2.8, y: -1.3, width: 5.6, height: 2.6, preserveAspectRatio: "none" }, car);
  };
  const place = (/** @type {{ x: number, y: number, dx: number, dy: number }} */ p) => {
    const [px, py] = m.map(p.x, p.y), [qx, qy] = m.map(p.x + p.dx, p.y + p.dy);
    car.setAttribute("transform", `translate(${px} ${py}) rotate(${(Math.atan2(qy - py, qx - px) * 180) / Math.PI})`);
  };
  const light = (/** @type {any} */ b) => {
    glow.replaceChildren(); glow.classList.remove("on");
    if (!b) return;
    const q = d.rects[b.n], a = m.map(q.x0, q.north ? d.hall.depth : d.hall.bayDepth), c = m.map(q.x1, q.north ? d.hall.depth - d.hall.bayDepth : 0);
    el("rect", { x: Math.min(a[0], c[0]), y: Math.min(a[1], c[1]), width: Math.abs(c[0] - a[0]), height: Math.abs(c[1] - a[1]), class: "ga-bay" }, glow);
    requestAnimationFrame(() => glow.classList.add("on"));
  };
  const go = (/** @type {boolean} */ moving) => {
    cancelAnimationFrame(anim);
    const c = CARS[/** @type {keyof typeof CARS} */ (key)] ?? CARS.estate, b = pickBay(d.hall, c);
    light(null);
    if (!b || !d.aerial.cars[key]) { car.setAttribute("opacity", "0"); return; }
    carImg.setAttribute("href", (root.getAttribute("data-img-base") ?? "") + d.aerial.cars[key]);
    const r = route(d.hall, b.n, m.startX), total = r.lengths[r.lengths.length - 1];
    if (!moving || still.matches) { place(along(r, total)); car.setAttribute("opacity", "1"); light(b); return; }
    const t0 = performance.now(), dur = 6200, ease = (/** @type {number} */ t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
    const step = (/** @type {number} */ now) => {
      const t = Math.min(1, (now - t0) / dur);
      place(along(r, ease(t) * total));
      car.setAttribute("opacity", String(Math.min(1, t / 0.08)));
      if (t < 1) anim = requestAnimationFrame(step); else light(b);
    };
    anim = requestAnimationFrame(step);
  };
  draw();
  const NOTES = {
    charge: `${chargerWords(d.hall)} ${d.chargedBy ?? ""}`.trim(),
    watch: d.securityNote ?? "",
  };
  root.querySelectorAll("[data-layer]").forEach((btn) => btn.addEventListener("click", () => {
    const k = btn.getAttribute("data-layer") ?? "", on = btn.getAttribute("aria-pressed") !== "true";
    btn.setAttribute("aria-pressed", String(on)); shown[k] = on; layers[k]?.classList.toggle("on", on);
    if (note) note.textContent = Object.keys(NOTES).filter((n) => shown[n]).map((n) => NOTES[/** @type {keyof typeof NOTES} */ (n)]).join(" ");
  }));
  ctx.watch("garage-car", (k) => { key = k; if (seen) go(true); });
  phone.addEventListener("change", () => { draw(); go(false); });
  if (still.matches || !("IntersectionObserver" in window)) { seen = true; go(false); return; }
  const io = new IntersectionObserver((es) => {
    if (es.some((e) => e.isIntersecting)) { io.disconnect(); seen = true; setTimeout(() => go(true), 500); }
  }, { threshold: 0.4 });
  io.observe(svg);
}
