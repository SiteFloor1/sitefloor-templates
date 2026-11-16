// @ts-check
/** Coverage (PT-5): a postcode against the trainer's own districts, one answer per way they travel. */
import { coverageFor } from "../../lib/trainer.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).trainer.coverage;
  const form = /** @type {HTMLFormElement} */ (root.querySelector("[data-tcv-form]"));
  const input = /** @type {HTMLInputElement} */ (root.querySelector("[data-tcv-pc]"));
  const out = /** @type {HTMLElement} */ (root.querySelector("[data-tcv-out]"));
  if (!form || !input || !out) throw new Error("coverage markup missing");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const r = coverageFor(input.value, cfg.areas);
    root.querySelectorAll("[data-tcv-area]").forEach((el) => el.classList.remove("yes", "no"));
    if (!r) { out.textContent = "That doesn't look like a postcode. Try the first half, like SW10."; return; }
    const yes = r.areas.filter((a) => a.covered);
    r.areas.forEach((a) => root.querySelector(`[data-tcv-area="${a.id}"]`)?.classList.add(a.covered ? "yes" : "no"));
    out.innerHTML = yes.length
      ? `<b>${r.district}: yes.</b> ${yes.map((a) => a.label).join(", ")}.`
      : `<b>${r.district} is further than I travel.</b> ${cfg.elsewhere}`;
  });
}
