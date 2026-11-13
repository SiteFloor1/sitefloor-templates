// @ts-check
/** Probate cost estimator: sum the chosen answers onto the published starting fee; show VAT when the firm charges it. */
import { vat } from "../../lib/estimate.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) {
  const form = /** @type {HTMLFormElement|null} */ (root.querySelector("#est-form"));
  const fee = /** @type {HTMLElement|null} */ (root.querySelector("[data-est-fee]"));
  const withVat = /** @type {HTMLElement|null} */ (root.querySelector("[data-est-vat]"));
  if (!form || !fee || !withVat) throw new Error("estimator markup missing");
  const from = Number(root.dataset.from);
  const gbp = (/** @type {number} */ n) => `£${n.toLocaleString("en-GB")}`;
  const show = () => {
    let low = from, high = from;
    for (const r of /** @type {NodeListOf<HTMLInputElement>} */ (form.querySelectorAll("input:checked"))) { low += Number(r.dataset.low); high += Number(r.dataset.high); }
    fee.textContent = low === high ? gbp(low) : `${gbp(low)} to ${gbp(high)}`;
    withVat.textContent = root.dataset.vat === "yes" ? `${low === high ? gbp(vat(low)) : `${gbp(vat(low))} to ${gbp(vat(high))}`} with VAT at 20%` : "No VAT is added to our fees.";
  };
  form.addEventListener("change", show);
  show();
  root.setAttribute("data-ready", "");
}
