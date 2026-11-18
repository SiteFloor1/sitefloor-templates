// @ts-check
/**
 * The hall from above. The render shows every bay with a car under a fitted cover; the bays free today (the live
 * list, or the client's own list) are laid over it from a second render of the same hall with the bays empty, so the
 * picture always matches the list. Pick a car and a line of light runs in through the gate, along the aisle and into
 * the bay that fits, then the bay lights. It plays once when the hall first comes into view and on every pick; with
 * reduced motion the lit bay and its route are shown at once. Charging and cameras are layers.
 */
import { CARS, pickBay, route, along, cone, chargerWords, withFree } from "../../lib/garage.js";
import { frameMap, NS, freePatches } from "./map.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const d = /** @type {any} */ (ctx.data);
  const svg = root.querySelector("[data-aerial-ov]"), note = root.querySelector("[data-layer-note]");
  if (!d.hall || !d.aerial || !svg) return;
  const base = root.getAttribute("data-img-base") ?? "";
  const phone = matchMedia("(max-width: 700px)"), still = matchMedia("(prefers-reduced-motion: reduce)");
  /** @type {Record<string, boolean>} */ const shown = {};
  /** @type {Record<string, any>} */ const layers = {};
  let key = "estate", seen = false, anim = 0, hall = d.hall;
  /** @type {any} */ let m, patches, glow, trail, head;
  const el = (/** @type {string} */ n, /** @type {Record<string, string|number>} */ a = {}, /** @type {Element} */ p = svg) => {
    const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, String(a[k])); p.append(e); return e;
  };
  const draw = () => {
    m = frameMap(d, phone.matches);
    svg.setAttribute("viewBox", m.viewBox);
    svg.replaceChildren();
    patches = el("g", { class: "ga-free" });
    freePatches(patches, hall, d, m, base + (phone.matches ? d.aerial.empty.dayPhone : d.aerial.empty.day));
    const fs = phone.matches ? 0.6 : 0.42;
    layers.charge = el("g", { class: "ga-lay" });
    for (const c of d.chargers) {
      const q = d.rects[c.n], [x, y] = m.map(q.x1 - 0.45, q.north ? hall.depth - 0.3 : 0.3);
      el("circle", { cx: x, cy: y, r: 1.5, class: "ga-ch-halo" }, layers.charge);
      el("circle", { cx: x, cy: y, r: 0.14, class: "ga-ch-dot" }, layers.charge);
      const off = phone.matches ? 2 : 1.25, [tx, ty] = m.map(q.cx, q.north ? hall.depth - hall.bayDepth - off : hall.bayDepth + off);
      el("text", { x: tx, y: ty, class: "ga-tag", "text-anchor": "middle", "dominant-baseline": "middle", style: `font-size:${fs * 0.85}px` }, layers.charge).textContent = `${c.kw} kW`;
    }
    layers.watch = el("g", { class: "ga-lay" });
    for (const c of d.cameras) {
      el("path", { d: "M" + cone(c).map((p) => m.map(p[0], p[1]).join(" ")).join(" L") + "Z", class: "ga-cone" }, layers.watch);
      const [x, y] = m.map(c.x, c.y);
      el("circle", { cx: x, cy: y, r: 0.16, class: "ga-ch-dot" }, layers.watch);
    }
    const [gx, gy] = m.map(0.5, hall.gate.y + 1);
    el("text", { x: gx, y: gy, class: "ga-tag", "text-anchor": phone.matches ? "middle" : "start", style: `font-size:${fs}px` }, layers.watch).textContent = "Gate · fob, every hour";
    for (const k in layers) layers[k].classList.toggle("on", !!shown[k]);
    glow = el("g", { class: "ga-glow" });
    trail = el("path", { class: "ga-trail" });
    head = el("circle", { r: 0.32, class: "ga-head", opacity: 0 });
  };
  const light = (/** @type {any} */ b) => {
    glow.replaceChildren(); glow.classList.remove("on");
    if (!b) return;
    const q = d.rects[b.n], a = m.map(q.x0, q.north ? hall.depth : hall.bayDepth), c = m.map(q.x1, q.north ? hall.depth - hall.bayDepth : 0);
    el("rect", { x: Math.min(a[0], c[0]), y: Math.min(a[1], c[1]), width: Math.abs(c[0] - a[0]), height: Math.abs(c[1] - a[1]), class: "ga-bay" }, glow);
    requestAnimationFrame(() => glow.classList.add("on"));
  };
  const go = (/** @type {boolean} */ moving) => {
    cancelAnimationFrame(anim);
    const b = pickBay(hall, CARS[/** @type {keyof typeof CARS} */ (key)] ?? CARS.estate);
    light(null); head.setAttribute("opacity", "0"); trail.removeAttribute("d");
    if (!b) return;
    const r = route(hall, b.n, m.startX), total = r.lengths[r.lengths.length - 1];
    const path = "M" + r.points.map((p) => m.map(p[0], p[1]).join(" ")).join(" L");
    trail.setAttribute("d", path);
    const len = /** @type {SVGPathElement} */ (trail).getTotalLength?.() ?? total;
    trail.style.strokeDasharray = `${len} ${len}`;
    if (!moving || still.matches) { trail.style.strokeDashoffset = "0"; light(b); return; }
    const t0 = performance.now(), dur = 4600, ease = (/** @type {number} */ t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
    const step = (/** @type {number} */ now) => {
      const t = Math.min(1, (now - t0) / dur), e = ease(t), p = along(r, e * total), [hx, hy] = m.map(p.x, p.y);
      trail.style.strokeDashoffset = String(len * (1 - e));
      head.setAttribute("cx", String(hx)); head.setAttribute("cy", String(hy));
      head.setAttribute("opacity", String(Math.min(1, t / 0.06, (1 - t) / 0.12)));
      if (t < 1) anim = requestAnimationFrame(step); else light(b);
    };
    anim = requestAnimationFrame(step);
  };
  draw();
  const NOTES = { charge: `${chargerWords(d.hall)} ${d.chargedBy ?? ""}`.trim(), watch: d.securityNote ?? "" };
  root.querySelectorAll("[data-layer]").forEach((btn) => btn.addEventListener("click", () => {
    const k = btn.getAttribute("data-layer") ?? "", on = btn.getAttribute("aria-pressed") !== "true";
    btn.setAttribute("aria-pressed", String(on)); shown[k] = on; layers[k]?.classList.toggle("on", on);
    if (note) note.textContent = Object.keys(NOTES).filter((n) => shown[n]).map((n) => NOTES[/** @type {keyof typeof NOTES} */ (n)]).join(" ");
  }));
  ctx.watch("garage-car", (k) => { key = k; if (seen) go(true); });
  ctx.watch("garage-free", (f) => { hall = withFree(d.hall, f); draw(); go(false); });
  phone.addEventListener("change", () => { draw(); go(false); });
  if (still.matches || !("IntersectionObserver" in window)) { seen = true; go(false); return; }
  const io = new IntersectionObserver((es) => {
    if (es.some((e) => e.isIntersecting)) { io.disconnect(); seen = true; setTimeout(() => go(true), 500); }
  }, { threshold: 0.4 });
  io.observe(svg);
}
