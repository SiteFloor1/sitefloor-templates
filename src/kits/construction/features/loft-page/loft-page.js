// @ts-check
/**
 * Your loft in 3D. The choices (house, conversion, dormer width, what the roof already has) update the volume, the
 * meter and the words straight away; one tap loads the same 3D house as the extension visualiser, in its roof view.
 * Without WebGL the photograph stays and the guide still works.
 */
import { HOUSES } from "../../lib/extension.js";
import { LOFTS, loftsFor, loftStart, loftVolume, dormerRange, meterAt } from "../../lib/loft.js";
import { loftZone } from "../../lib/planning.js";

/** @param {HTMLCanvasElement} c */
function webgl(c) {
  try { return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch { return false; }
}

/** The message sent on WhatsApp: the builder's opening line, then the loft as chosen. @param {string} opening @param {any} s @param {number} total */
export function loftMessage(opening, s, total) {
  const house = HOUSES[/** @type {keyof typeof HOUSES} */ (s.house)]?.said ?? "house";
  const kind = LOFTS[/** @type {keyof typeof LOFTS} */ (s.loft)]?.said ?? "a loft conversion";
  const lines = [opening, `· A ${house}`, `· ${kind[0].toUpperCase()}${kind.slice(1)}${s.loft === "hip" ? "" : `, the dormer ${s.width.toFixed(1)} m wide`}`];
  if (s.before > 0) lines.push(`· ${s.before} m³ already added to the roof`);
  lines.push(`· About ${Math.round(total)} m³ in all, on your model`);
  return lines.join("\n");
}

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const q = (/** @type {string} */ s) => /** @type {HTMLElement|null} */ (root.querySelector(s));
  const form = /** @type {HTMLFormElement|null} */ (q("[data-lf-controls]"));
  const width = /** @type {HTMLInputElement|null} */ (q("[data-lf-width]"));
  const before = /** @type {HTMLInputElement|null} */ (q("[data-lf-before]"));
  const canvas = /** @type {HTMLCanvasElement|null} */ (q("[data-lf-canvas]"));
  const tryBtn = /** @type {HTMLButtonElement|null} */ (q("[data-lf-try]"));
  const status = q("[data-lf-status]");
  if (!form || !width || !before || !canvas || !tryBtn || !status) throw new Error("loft page markup missing");
  const opening = q("[data-lf-send]")?.dataset.waText ?? "";
  const pressed = /** @type {HTMLButtonElement|null} */ (q('[data-lf-set="house"][aria-pressed="true"]'));
  const state = { ...loftStart(pressed?.dataset.v ?? "terrace"), before: 0 };
  /** @type {any} */ let model = null;
  const say = (/** @type {string} */ t) => { status.hidden = !t; status.textContent = t; };
  const modelState = () => ({ house: /** @type {any} */ (state.house), show: /** @type {"before"|"after"} */ (state.show), loft: { loft: state.loft, width: state.width } });

  const update = () => {
    const can = loftsFor(state.house), range = dormerRange(state.house, state.loft);
    const v = loftVolume(state.house, state.loft, state.width);
    state.width = v.width || state.width;
    const total = v.total + state.before, z = loftZone(state.house, total);
    for (const b of /** @type {NodeListOf<HTMLButtonElement>} */ (root.querySelectorAll("[data-lf-set]"))) {
      const k = b.dataset.lfSet ?? "";
      b.setAttribute("aria-pressed", String(/** @type {any} */ (state)[k] === b.dataset.v));
      if (k === "loft") b.disabled = !can.includes(/** @type {any} */ (b.dataset.v));
    }
    const row = q("[data-lf-width-row]");
    if (row) row.hidden = !range;
    if (range) { width.min = String(range.min); width.max = String(range.max); width.value = String(state.width); width.setAttribute("aria-valuetext", `${state.width.toFixed(1)} metres`); }
    const out = q("[data-lf-width-out]"); if (out) out.textContent = `${state.width.toFixed(1)} m`;
    const meter = q("[data-lf-meter]"); if (meter) meter.dataset.zone = z.zone;
    const fill = q("[data-lf-fill]"); if (fill) fill.style.width = `${meterAt(total, z.allowance)}%`;
    const allow = q("[data-lf-allow]"); if (allow) allow.textContent = `${z.allowance} m³`;
    const now = q("[data-lf-now]");
    if (now) now.textContent = state.before > 0 ? `${z.words} That counts the ${state.before} m³ already added.` : z.words;
    const send = /** @type {HTMLAnchorElement|null} */ (q("[data-lf-send]"));
    if (send && opening) { const t = loftMessage(opening, state, total); send.href = ctx.waHref(t); send.dataset.waText = t; }
    root.dataset.show = state.show;
    model?.set(modelState());
  };

  form.addEventListener("submit", (e) => e.preventDefault());
  form.addEventListener("click", (e) => {
    const b = /** @type {HTMLButtonElement|null} */ (/** @type {HTMLElement} */ (e.target).closest("[data-lf-set]"));
    if (!b || b.disabled) return;
    const k = b.dataset.lfSet, v = b.dataset.v ?? "";
    if (k === "house" && Object.hasOwn(HOUSES, v)) Object.assign(state, loftStart(v), { before: state.before, show: state.show });
    else if (k === "loft" && Object.hasOwn(LOFTS, v)) {
      state.loft = /** @type {any} */ (v);
      const r = dormerRange(state.house, v);
      if (r) state.width = Math.min(r.max, Math.max(r.min, state.width || r.max * 0.75));
    } else if (k === "show" && (v === "before" || v === "after")) state.show = v;
    else return;
    update();
  });
  width.addEventListener("input", () => { state.width = Math.round(Number(width.value) * 10) / 10; update(); });
  before.addEventListener("input", () => {
    const n = Math.round(Number(before.value));
    state.before = Number.isFinite(n) ? Math.min(60, Math.max(0, n)) : 0;
    update();
  });

  tryBtn.addEventListener("click", async () => {
    tryBtn.disabled = true;
    if (!webgl(canvas)) { say("3D isn't available on this device or browser. The guide beside it still works."); return; }
    say("Loading the model…");
    try {
      const { createHouse } = await import("../visualiser/house-3d.js");
      canvas.hidden = false;
      model = createHouse(canvas, { ...modelState(), depth: 3, roof: "lantern", phase: "finish" }, { view: "loft", reduceMotion: matchMedia("(prefers-reduced-motion: reduce)").matches });
      tryBtn.hidden = true; say("");
      root.dataset.live = "";
      /** @type {any} */ (canvas).sfModel = model;
    } catch (err) {
      console.error("[sitefloor] the 3D model didn't load", err);
      canvas.hidden = true; tryBtn.disabled = false;
      say("The 3D model didn't load. Check the connection and tap again.");
    }
  });

  update();
}
