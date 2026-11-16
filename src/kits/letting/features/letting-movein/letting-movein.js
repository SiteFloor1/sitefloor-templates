// @ts-check
/** What you pay before the keys: retyping the rent updates the amounts, from lib/fees.js (the GOV.UK caps). */
import { tenantSide, rentFrom } from "../../lib/fees.js";
import { fillRows, rentBox } from "../letting-net/letting-net.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const fees = /** @type {any} */ (ctx.data).fees;
  const input = /** @type {HTMLInputElement} */ (root.querySelector("[data-lm-rent]"));
  const rows = /** @type {HTMLElement} */ (root.querySelector("[data-lm-rows]"));
  const total = /** @type {HTMLElement} */ (root.querySelector("[data-lm-total]"));
  const note = /** @type {HTMLElement} */ (root.querySelector("[data-lm-note]"));
  if (!input || !rows || !total || !note) throw new Error("letting-movein markup missing");
  const calc = (/** @type {number} */ rent) => { const t = tenantSide(rent, fees.tenant); fillRows(rows, t.rows); total.textContent = t.total; note.textContent = t.note; };
  rentBox(input, calc);
  calc(rentFrom(input.value));
}
