// @ts-check
/** The tea sommelier: three answers, one tea from the café's own library (teaFor), set like a menu card. */
import { teaFor } from "../../lib/tearoom.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const lib = /** @type {any} */ (ctx.data).tea?.library;
  const form = root.querySelector("[data-ts-form]");
  /** @param {string} k */ const out = (k) => root.querySelector(`[data-ts-${k}]`);
  if (!lib || !form || !out("name")) throw new Error("tea sommelier markup or data missing");
  const val = (/** @type {string} */ n) => /** @type {HTMLInputElement|null} */ (form.querySelector(`input[name="${n}"]:checked`))?.value ?? "";
  const set = (/** @type {string} */ k, /** @type {string} */ v) => { const el = out(k); if (el) { el.textContent = v; /** @type {HTMLElement} */ (el).hidden = !v; } };
  const draw = () => {
    const { pick, also } = teaFor(lib, { when: /** @type {any} */ (val("ts-when")), milk: val("ts-milk") === "yes", strength: val("ts-str") });
    if (!pick) return;
    set("name", pick.name);
    set("from", [pick.origin, pick.notes].filter(Boolean).join(". "));
    set("brew", pick.steep ? `${pick.steep.minutes} minutes at ${pick.steep.celsius}°C${pick.milk ? ", with milk if you like" : ""}.` : "");
    set("pairs", pick.pairs ? `With ${pick.pairs}.` : "");
    set("also", also ? `Or: ${also.name}` : "");
  };
  form.addEventListener("change", draw);
  draw();
}
