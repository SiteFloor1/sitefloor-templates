// @ts-check
/**
 * Room by room in 3D: loads the flat on tap (its own chunk) and shows each room's tasks and minutes from visit(), for a
 * two-bedroom flat with two bathrooms, regular clean: the same minutes the strip shows for that home.
 */
import { visit, hm } from "../../lib/visit.js";

/** @param {string} s */
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c);
const ID = /** @type {Record<string, string>} */ ({ shower: "bath2" });

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).cleaning?.visit;
  const q = (/** @type {string} */ s) => /** @type {HTMLElement|null} */ (root.querySelector(s));
  const btn = /** @type {HTMLButtonElement|null} */ (q("[data-3d-open]")), stage = q("[data-3d-stage]"), msg = q("[data-3d-msg]"), card = q("[data-3d-card]");
  const canvas = /** @type {HTMLCanvasElement|null} */ (q("[data-3d-canvas]"));
  if (!cfg || !btn || !stage || !msg || !card || !canvas) throw new Error("3D markup or config missing");
  const flat = visit(cfg, { beds: 2, baths: 2, freq: "fortnight" });
  /** @type {any} */ let model = null;
  btn.addEventListener("click", async () => {
    if (model) { stage.hidden = !stage.hidden; return; }
    let ok;
    try { ok = !!(canvas.getContext("webgl2") || canvas.getContext("webgl")); } catch { ok = false; }
    if (!ok) { msg.hidden = false; msg.textContent = "3D isn't available on this device. Every room and its minutes are in the strip above."; btn.disabled = true; return; }
    btn.disabled = true; msg.hidden = false; msg.textContent = "Loading the illustration…";
    try {
      const { createModel } = await import("./model-3d.js");
      stage.hidden = false;
      model = createModel(canvas, { far: 1.7, onPick: (/** @type {string|null} */ id) => {
        const r = id ? flat.rooms.find((x) => x.id === (ID[id] ?? id)) : null;
        card.hidden = !r;
        if (r) card.innerHTML = `<b>${esc(r.name)}<em>${hm(r.min)}</em></b><span>${r.tasks.slice(0, 4).map(esc).join(" · ")}</span>`;
      } });
      msg.hidden = true; btn.disabled = false; btn.textContent = "Room by room in 3D"; root.dataset.live = "";
    } catch (err) {
      console.error("[sitefloor] the 3D flat didn't load", err);
      btn.disabled = false; msg.textContent = "The illustration didn't load. Check the connection and tap again.";
    }
  });
}
