// @ts-check
/** Tell us about her: what he knows, the wrap and the card, as one WhatsApp message to the shop. */
import { herText } from "../../lib/fit.js";
import { must } from "../dom.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  /** @param {string} s */
  const v = (s) => /** @type {HTMLInputElement} */ (must(root, `[data-her-${s}]`));
  const card = /** @type {HTMLTextAreaElement} */ (must(root, "[data-her-card]"));
  const count = must(root, "[data-her-count]");
  const send = /** @type {HTMLAnchorElement} */ (must(root, "[data-her-send]"));
  const update = () => {
    count.textContent = card.value ? `${card.maxLength - card.value.length} left` : "";
    send.href = ctx.waHref(herText({ business: ctx.data.name, size: v("size").value, wears: v("wears").value, budget: v("budget").value, occasion: v("occasion").value, wrap: v("wrap").checked, card: card.value, name: v("name").value }));
  };
  root.addEventListener("input", update);
  root.addEventListener("change", update);
  update();
}
