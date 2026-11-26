// @ts-check
/** Do you cover me? (DRIVE-1): a postcode against the instructor's own districts. */
import { coverAnswer } from "../../lib/driving.js";
import { openable } from "../../lib/cards.js";

/** @param {string} s */
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c);

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  openable(root);
  const cfg = /** @type {any} */ (ctx.data).driving.areas;
  const form = /** @type {HTMLFormElement|null} */ (root.querySelector("[data-da-form]"));
  const input = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-da-pc]"));
  const out = /** @type {HTMLElement|null} */ (root.querySelector("[data-da-out]"));
  if (!form || !input || !out) throw new Error("areas markup missing");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const r = coverAnswer(input.value, cfg.districts);
    out.classList.toggle("yes", r.state === "yes");
    if (r.state === "bad") out.textContent = "Try the first half of a postcode, like E14.";
    else if (r.state === "yes") out.innerHTML = `Yes, <b>${r.district}</b>, ${esc(r.name)}.`;
    else out.innerHTML = `<b>${r.district}</b> isn't one of our areas. ${esc(cfg.notCovered)}`;
  });
}
