// @ts-check
/**
 * The extension visualiser: the photograph first; one tap loads the 3D house (house-3d.js, its own chunk) and shows
 * the controls. Every choice redraws the model and the read-out; the price line appears only when the builder has
 * given their own rates (and the visualiser page is on). Without WebGL the photograph stays and says why.
 */
import { HOUSES, ROOFS, extensionSize, readout, clampDepth, priceRange, priceWords, designMessage } from "../../lib/extension.js";

/** @param {HTMLCanvasElement} c */
function webgl(c) {
  try { return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch { return false; }
}

/**
 * @param {HTMLElement} root @param {import("../../../../core/js/core.js").Ctx} ctx
 */
export function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).build?.visualiser;
  const stage = root.querySelector("[data-vz-stage]");
  const tryBtn = /** @type {HTMLButtonElement|null} */ (root.querySelector("[data-vz-try]"));
  const canvas = /** @type {HTMLCanvasElement|null} */ (root.querySelector("[data-vz-canvas]"));
  const controls = /** @type {HTMLElement|null} */ (root.querySelector("[data-vz-controls]"));
  const status = /** @type {HTMLElement|null} */ (root.querySelector("[data-vz-status]"));
  const depth = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-vz-depth]"));
  if (!cfg || !stage || !tryBtn || !canvas || !controls || !status || !depth) throw new Error("visualiser markup or config missing");
  const state = { ...cfg.start };
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  /** @type {any} */ let model = null;

  const say = (/** @type {string} */ t) => { status.hidden = !t; status.textContent = t; };
  const update = () => {
    const s = extensionSize(state.house, state.depth), w = readout(s);
    for (const el of root.querySelectorAll("[data-vz-size]")) el.textContent = w.size;
    for (const el of root.querySelectorAll("[data-vz-room]")) el.textContent = w.room;
    depth.value = String(state.depth);
    depth.setAttribute("aria-valuetext", `${state.depth.toFixed(1)} metres`);
    const out = root.querySelector("[data-vz-depth-out]");
    if (out) out.textContent = `${state.depth.toFixed(1)} m`;
    for (const b of /** @type {NodeListOf<HTMLButtonElement>} */ (root.querySelectorAll("[data-vz-set]"))) {
      b.setAttribute("aria-pressed", String(/** @type {any} */ (state)[b.dataset.vzSet ?? ""] === b.dataset.v));
    }
    const price = root.querySelector("[data-vz-price]");
    if (price && cfg.rates) {
      const r = priceRange(cfg.rates, state.roof, s.area);
      price.textContent = r ? `${priceWords(r, cfg.rates.vat)}, from our own rates for an extension like this. A range, not a quote.` : "";
    }
    const send = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-vz-send]"));
    if (send) {
      const text = designMessage(cfg.message, state);
      send.href = ctx.waHref(text); send.dataset.waText = text;
    }
    root.dataset.show = state.show;
    // The planning guide and the light study (when on) follow the same choices and the same model.
    ctx.share("extension", { state: { ...state }, model });
  };

  controls.addEventListener("click", (e) => {
    const b = /** @type {HTMLElement|null} */ (/** @type {HTMLElement} */ (e.target).closest("[data-vz-set]"));
    if (!b) return;
    const k = b.dataset.vzSet, v = b.dataset.v;
    if (k === "house" && v && Object.hasOwn(HOUSES, v)) state.house = /** @type {any} */ (v);
    else if (k === "roof" && v && Object.hasOwn(ROOFS, v)) state.roof = /** @type {any} */ (v);
    else if (k === "show" && (v === "before" || v === "after")) state.show = v;
    else return;
    update(); model?.set({ house: state.house, roof: state.roof, show: state.show });
  });
  depth.addEventListener("input", () => {
    state.depth = clampDepth(Number(depth.value), cfg.depth);
    update(); model?.set({ depth: state.depth });
  });

  tryBtn.addEventListener("click", async () => {
    if (!webgl(canvas)) {
      tryBtn.disabled = true;
      say("3D isn't available on this device or browser. The photograph shows a finished extension.");
      return;
    }
    tryBtn.disabled = true;
    say("Loading the model…");
    try {
      const { createHouse } = await import("./house-3d.js");
      canvas.hidden = false;
      model = createHouse(canvas, { house: state.house, depth: state.depth, roof: state.roof, show: state.show, phase: "finish" }, {
        reduceMotion: reduce,
        onTurn: () => { const hint = root.querySelector("[data-vz-hint]"); if (hint) /** @type {HTMLElement} */ (hint).hidden = true; },
      });
      root.dataset.live = "";
      controls.hidden = false;
      tryBtn.hidden = true;
      say("");
      const hint = /** @type {HTMLElement|null} */ (root.querySelector("[data-vz-hint]"));
      if (hint) hint.hidden = false;
      update();
      // Tests and the page can read where the model is; nothing else listens.
      /** @type {any} */ (canvas).sfModel = model;
    } catch (err) {
      console.error("[sitefloor] the 3D model didn't load", err);
      canvas.hidden = true; tryBtn.disabled = false;
      say("The 3D model didn't load. Check the connection and tap again.");
    }
  });

  update();
}
