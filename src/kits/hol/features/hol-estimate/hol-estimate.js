// @ts-check
/** HOL-6: bedrooms and own weeks re-work the sum from the company's own figures (lib/estimate.js). */
import { estimate } from "../../lib/estimate.js";
import { pounds } from "../../lib/money.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const fig = /** @type {any} */ (ctx.data).estimate;
  const form = /** @type {HTMLFormElement} */ (root.querySelector(".st-ctl"));
  const set = (/** @type {string} */ k, /** @type {string} */ v) => { const el = root.querySelector(`[data-se="${k}"]`); if (el) el.textContent = v; };
  const run = () => {
    const beds = Number(/** @type {HTMLInputElement} */ (form.querySelector("[name=beds]:checked")).value);
    const own = Number(/** @type {HTMLInputElement} */ (form.querySelector("[name=own]:checked")).value);
    const e = estimate(fig, beds, own);
    if (!e) return;
    set("guests", pounds(e.guests)); set("fee", pounds(e.fee)); set("you", pounds(e.toYou));
    set("gl", `guests pay: ${e.nights} nights at ${pounds(e.night)} on average`); set("basis", e.basis);
  };
  form.addEventListener("change", run);
}
