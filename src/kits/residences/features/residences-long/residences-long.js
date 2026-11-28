// @ts-check
/** Long lets: the Tenant Fees Act caps on the holding deposit and the deposit, worked out from a monthly rent. */
import { quote, pounds } from "../../lib/stay.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) {
  const rent = /** @type {HTMLInputElement} */ (root.querySelector("[data-rlg-rent]"));
  const out = /** @type {HTMLElement} */ (root.querySelector("[data-rlg-out]"));
  root.querySelector("form")?.addEventListener("submit", (e) => e.preventDefault());
  const row = (/** @type {string} */ k, /** @type {string} */ v) => { const dt = document.createElement("dt"); dt.textContent = k; const dd = document.createElement("dd"); dd.textContent = v; return [dt, dd]; };
  const draw = () => {
    const r = Math.round(Number(rent.value));
    if (!(r > 0)) { out.replaceChildren(); return; }
    const h = /** @type {any} */ ({ long: true, short: false, rent: r });
    const q = quote(h, "long");
    if (q.kind !== "long") { const p = document.createElement("dd"); p.className = "rlg-wide"; p.textContent = "Above £100,000 a year a tenancy isn't an assured tenancy, so these caps aren't worked out here: ask us for the terms."; out.replaceChildren(p); return; }
    const note = document.createElement("dd"); note.className = "rlg-wide";
    note.textContent = `Six weeks from £50,000 a year, five below; the holding deposit is taken off the first rent or the deposit. Your first month's rent, ${pounds(r)}, is paid once the tenancy is signed.`;
    out.replaceChildren(...row("Holding deposit, at most", pounds(q.holding)), ...row(`Deposit, at most (${q.depositWeeks} weeks)`, pounds(q.deposit)), note);
  };
  rent.addEventListener("input", draw);
  draw();
}
