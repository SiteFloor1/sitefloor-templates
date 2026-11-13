// @ts-check
/**
 * Will you bring it to us: the venue's postcode district is matched against the studio's own areas (lib areaFor).
 * A district the studio lists wins over its postcode area; anywhere not listed asks for the venue, never guesses.
 */
import { areaFor, pounds } from "../../lib/cakes.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).cakes?.delivery;
  const form = /** @type {HTMLFormElement|null} */ (root.querySelector("[data-vc-form]"));
  const input = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-vc-input]"));
  const out = root.querySelector("[data-vc-result]");
  if (!cfg || !form || !input || !out) throw new Error("venue check markup missing");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const hit = areaFor(input.value, cfg.areas);
    if (!hit) { out.textContent = "Type the venue's postcode, or just its first half, like RG9."; return; }
    out.textContent = hit.area
      ? `Yes, we come to ${hit.district} (${hit.area.name}). Delivery and set-up from ${pounds(hit.area.from)}; we arrive ${hit.area.arrive}.`
      : String(cfg.unknown).replaceAll("{district}", hit.district);
  });
}
