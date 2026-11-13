// @ts-check
/** The light study: computes the sun for the chosen month, time and place, words it, and moves the model's sun. */
import { sunPosition, momentFor, lightWords, whenWords, FACINGS } from "../../lib/sun.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).build?.lightStudy;
  const q = (/** @type {string} */ s) => /** @type {any} */ (root.querySelector(s));
  const month = q("[data-ls-month]"), time = q("[data-ls-time]"), now = q("[data-ls-now]");
  if (!cfg || !month || !time || !now) throw new Error("light study markup or config missing");
  const st = { face: /** @type {keyof typeof FACINGS} */ (cfg.facing ?? "S"), place: 0 };
  /** @type {any} */ let ext = null;
  const show = () => {
    const p = cfg.places[st.place];
    const m = Number(month.value), mins = Number(time.value);
    const sun = sunPosition(momentFor(new Date().getFullYear(), m, mins, ctx.data.hours.timezone), p.lat, p.lng);
    const facing = FACINGS[st.face];
    const w = lightWords(sun, facing, (ext?.state?.roof ?? "lantern") === "lantern");
    q("[data-ls-time-out]").textContent = whenWords(m, mins).split(", ")[1];
    now.textContent = `${whenWords(m, mins)} in ${p.code}, garden facing ${st.face}. ${w.words}`;
    root.dataset.lit = w.glass ? "glass" : w.lit ? "sky" : "dark";
    ext?.model?.setSun({ ...sun, facing });
    drawDial(sun, facing);
  };
  // A small dial on the model: north up, the garden's direction, the sun at its bearing (nearer the middle when higher).
  const NS = "http://www.w3.org/2000/svg";
  /** @type {SVGSVGElement|null} */ let dial = null;
  /** @param {{ elevation: number, azimuth: number }} sun @param {number} facing */
  const drawDial = (sun, facing) => {
    if (!dial) return;
    const at = (/** @type {number} */ deg, /** @type {number} */ r) => [50 + Math.sin(deg * Math.PI / 180) * r, 50 - Math.cos(deg * Math.PI / 180) * r];
    const [gx, gy] = at(facing, 30), [sx, sy] = at(sun.azimuth, 40 - Math.max(0, Math.min(90, sun.elevation)) / 90 * 34);
    const g = /** @type {SVGLineElement} */ (dial.querySelector(".garden")); g.setAttribute("x2", String(gx)); g.setAttribute("y2", String(gy));
    const d = /** @type {SVGCircleElement} */ (dial.querySelector(".sun")); d.setAttribute("cx", String(sx)); d.setAttribute("cy", String(sy));
    dial.dataset.up = String(sun.elevation > 0);
  };
  /** @param {string} tag @param {Record<string, string>} attrs */
  const el = (tag, attrs) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); return e; };
  const mountDial = () => {
    const stage = document.querySelector(".bd-vz-page [data-vz-stage]");
    if (!stage || dial) return;
    dial = /** @type {SVGSVGElement} */ (el("svg", { viewBox: "0 0 100 100", class: "bd-ls-dial", role: "img", "aria-label": "Compass: the garden's direction and the sun" }));
    dial.append(el("circle", { cx: "50", cy: "50", r: "44", class: "ring" }), el("text", { x: "50", y: "16", class: "n" }),
      el("line", { x1: "50", y1: "50", x2: "50", y2: "20", class: "garden" }), el("circle", { cx: "50", cy: "50", r: "5", class: "sun" }));
    /** @type {SVGTextElement} */ (dial.querySelector(".n")).textContent = "N";
    stage.append(dial);
  };
  for (const b of /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll("[data-ls-face]")])) b.addEventListener("click", () => {
    st.face = /** @type {any} */ (b.dataset.lsFace);
    for (const x of root.querySelectorAll("[data-ls-face]")) x.setAttribute("aria-pressed", String(x === b));
    show();
  });
  month.addEventListener("change", show); time.addEventListener("input", show);
  q("[data-ls-place]")?.addEventListener("change", (/** @type {Event} */ e) => { st.place = Number(/** @type {HTMLSelectElement} */ (e.target).value); show(); });
  ctx.watch("extension", (/** @type {any} */ e) => {
    const first = !ext?.model && e.model;
    ext = e;
    if (e.model) { const h = q("[data-ls-hint]"); if (h) h.hidden = true; mountDial(); }
    if (first) show();
  });
  show();
}
