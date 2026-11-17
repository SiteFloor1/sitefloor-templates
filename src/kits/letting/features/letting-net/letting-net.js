// @ts-check
/** One rent, from both sides: retyping the rent or choosing a service updates both columns, from lib/fees.js. */
import { tenantSide, ownerSide, rentFrom } from "../../lib/fees.js";

/** @param {HTMLElement} dl @param {[string, string][]} rows */
export function fillRows(dl, rows) {
  dl.replaceChildren(...rows.flatMap(([k, v]) => { const dt = document.createElement("dt"), dd = document.createElement("dd"); dt.textContent = k; dd.textContent = v; return [dt, dd]; }));
}

/** Keeps a rent box tidy (digits, thousands commas) and calls back with the rent. @param {HTMLInputElement} input @param {(rent: number) => void} fn */
export function rentBox(input, fn) {
  input.addEventListener("input", () => { const n = rentFrom(input.value); input.value = n ? n.toLocaleString("en-GB") : ""; fn(n); });
}

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const fees = /** @type {any} */ (ctx.data).fees;
  const q = (/** @type {string} */ s) => /** @type {HTMLElement} */ (root.querySelector(s));
  const input = /** @type {HTMLInputElement} */ (q("[data-ln-rent]"));
  const btns = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll("[data-ln-svc]")]);
  let svc = fees.services[fees.services.length - 1], rent = rentFrom(input.value);
  const calc = () => {
    const t = tenantSide(rent, fees.tenant), o = ownerSide(rent, svc);
    fillRows(q("[data-ln-tenant]"), t.rows); q("[data-ln-keys]").textContent = t.total; q("[data-ln-tnote]").textContent = t.note;
    fillRows(q("[data-ln-owner]"), o.rows); q("[data-ln-olabel]").textContent = o.totalLabel; q("[data-ln-net]").textContent = o.total;
    for (const b of btns) b.setAttribute("aria-pressed", String(b.dataset.lnSvc === svc.id));
  };
  rentBox(input, (n) => { rent = n; calc(); });
  for (const b of btns) b.addEventListener("click", () => { svc = fees.services.find((/** @type {any} */ s) => s.id === b.dataset.lnSvc) ?? svc; calc(); });
}
