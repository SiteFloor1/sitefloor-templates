// @ts-check
/** Send us your paint: every answer goes into the WhatsApp message, with the photographs to send next. */
import { paintText } from "../../lib/packages.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const p = /** @type {any} */ (ctx.data).detailing.paint;
  const form = root.querySelector("[data-pr-form]"), go = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-pr-go]"));
  if (!p || !form || !go) throw new Error("paint request markup missing");
  const val = (/** @type {string} */ s) => (/** @type {HTMLInputElement|null} */ (root.querySelector(s)))?.value ?? "";
  const update = () => {
    go.href = ctx.waHref(paintText({
      opening: p.message, car: val("[data-pr-car]"), colour: val("[data-pr-colour]"), note: val("[data-pr-note]"),
      concerns: [...root.querySelectorAll("[name=dt-concern]:checked")].map((x) => /** @type {HTMLInputElement} */ (x).value),
      kept: (/** @type {HTMLInputElement|null} */ (root.querySelector("[name=dt-kept]:checked")))?.value ?? "", photos: p.photos,
    }));
  };
  form.addEventListener("input", update);
  form.addEventListener("change", update);
  update();
}
