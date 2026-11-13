// @ts-check
/** Compare two cars: the client's figures and rules side by side. A missing figure shows as a dash, never a guess. */
import { money } from "../../lib/quote.js";

/** @type {[string, string, (v: any) => string][]} */
const LINES = [
  ["from", "From", (/** @type {any} */ v) => v], ["power", "Power", (/** @type {any} */ v) => `${v} bhp`], ["zero", "0–62 mph", (/** @type {any} */ v) => `${v} s`],
  ["seats", "Seats", String], ["boot", "Boot", String], ["gearbox", "Gearbox", String], ["deposit", "Deposit", (v) => money(v)],
  ["excess", "Excess", (v) => money(v)], ["driver", "Driver", String], ["miles", "Mileage", String],
];

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) {
  const data = JSON.parse(root.querySelector("[data-cmp-data]")?.textContent ?? "[]");
  const self = data.find((/** @type {any} */ c) => c.id === root.dataset.cmpThis);
  const sel = /** @type {HTMLSelectElement} */ (root.querySelector("[data-cmp-with]"));
  const out = /** @type {HTMLElement} */ (root.querySelector("[data-cmp-out]"));
  sel.addEventListener("change", () => {
    const other = data.find((/** @type {any} */ c) => c.id === sel.value);
    if (!other || !self) { out.textContent = ""; return; }
    const cell = (/** @type {any} */ c, /** @type {string} */ k, /** @type {Function} */ f) => (c[k] === null || c[k] === undefined ? "—" : esc(String(f(c[k]))));
    out.innerHTML = `<table class="hr-cmp-t"><caption class="sr-only">${esc(self.name)} compared with ${esc(other.name)}</caption>`
      + `<thead><tr><td></td><th scope="col">${esc(self.name)}</th><th scope="col">${esc(other.name)}</th></tr></thead><tbody>`
      + LINES.filter(([k]) => (self[k] ?? null) !== null || (other[k] ?? null) !== null).map(([k, label, f]) => `<tr><th scope="row">${label}</th><td>${cell(self, k, f)}</td><td>${cell(other, k, f)}</td></tr>`).join("")
      + "</tbody></table>";
  });
}

/** @param {string} s */
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c);
