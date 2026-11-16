// @ts-check
/** Onboarding: the checklist tallies as the owner ticks, and writes the WhatsApp message (ready, still to sort). */
import { checklistText } from "../../lib/owners.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const form = /** @type {HTMLFormElement} */ (root.querySelector("[data-lb2-form]"));
  const tally = /** @type {HTMLElement} */ (root.querySelector("[data-lb2-tally]"));
  const send = /** @type {HTMLAnchorElement} */ (root.querySelector("[data-lb2-send]"));
  if (!form || !tally || !send) throw new Error("letting-onboarding markup missing");
  const start = /** @type {any} */ (ctx.data).onboarding.message;
  const boxes = /** @type {HTMLInputElement[]} */ ([...form.querySelectorAll("input[type=checkbox]")]);
  const update = () => {
    const ready = boxes.filter((b) => b.checked).map((b) => b.value), missing = boxes.filter((b) => !b.checked).map((b) => b.value);
    tally.textContent = missing.length ? `${ready.length} of ${boxes.length} ready. We can help with the rest.` : "Everything's ready.";
    send.href = ctx.waHref(checklistText(start, ready, missing));
  };
  form.addEventListener("change", update);
  update();
}
