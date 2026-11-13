// @ts-check
/** Bespoke brief: keeps the WhatsApp message in step with the form. */
import { briefText } from "../../lib/messages.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const form = root.querySelector("[data-brief-form]");
  const send = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-brief-send]"));
  if (!form || !send) return;
  const v = (/** @type {string} */ s) => /** @type {HTMLInputElement|null} */ (form.querySelector(s))?.value.trim() ?? "";
  const paint = () => {
    const by = v("[data-b-by]");
    const text = briefText({ house: ctx.data.name, kind: v('input[name="b-kind"]:checked'), metal: v('input[name="b-metal"]:checked'), budget: v('input[name="b-budget"]:checked'), stone: v("[data-b-stone]"), by: /^\d{4}-\d{2}-\d{2}$/.test(by) ? by : undefined, story: v("[data-b-story]") });
    send.href = ctx.waHref(text); send.dataset.waText = text;
  };
  form.addEventListener("input", paint);
  form.addEventListener("change", paint);
  paint();
}
