// @ts-check
/** Planning a proposal: keeps the private WhatsApp message in step with the form. */
import { proposalText } from "../../lib/messages.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const form = root.querySelector("[data-prop-form]");
  const send = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-prop-send]"));
  if (!form || !send) return;
  const v = (/** @type {string} */ s) => /** @type {HTMLInputElement|null} */ (form.querySelector(s))?.value.trim() ?? "";
  const paint = () => {
    const size = v("[data-prop-size]").toUpperCase();
    const text = proposalText({
      house: ctx.data.name, date: /^\d{4}-\d{2}-\d{2}$/.test(v("[data-prop-date]")) ? v("[data-prop-date]") : undefined,
      size: size || undefined, sizeKnown: size ? true : false,
      style: v('input[name="prop-style"]:checked'), budget: v('input[name="prop-budget"]:checked'), note: v("[data-prop-note]"),
    });
    send.href = ctx.waHref(text); send.dataset.waText = text;
  };
  form.addEventListener("input", paint);
  form.addEventListener("change", paint);
  paint();
}
