// @ts-check
/** What would my home let for?: the sentence becomes the WhatsApp valuation request as the owner fills it in. No figure is worked out. */
import { valuationText } from "../../lib/owners.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const form = /** @type {HTMLFormElement} */ (root.querySelector("[data-lv-form]"));
  const send = /** @type {HTMLAnchorElement} */ (root.querySelector("[data-lv-send]"));
  if (!form || !send) throw new Error("letting-valuation markup missing");
  const start = /** @type {any} */ (ctx.data).valuation.message;
  const update = () => {
    const f = new FormData(form), g = (/** @type {string} */ k) => String(f.get(k) ?? "");
    const beds = g("beds");
    send.href = ctx.waHref(valuationText(start, { address: g("address"), postcode: g("postcode"), kind: beds === "0" ? `studio ${g("kind").toLowerCase()}` : g("kind"),
      beds: beds === "0" ? "" : beds, baths: g("baths"), size: g("size").replace(/[^\d]/g, ""), unit: g("unit"), outside: g("outside"), furnished: g("furnished"), when: g("when"), service: g("service") }));
  };
  form.addEventListener("input", update);
  form.addEventListener("change", update);
  update();
}
