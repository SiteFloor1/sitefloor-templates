// @ts-check
/** HOL-3: as the owner answers, the button's WhatsApp message is rewritten in their words (lib/owners.js). */
import { reviewText } from "../../lib/owners.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const form = /** @type {HTMLFormElement} */ (root);
  const send = /** @type {HTMLAnchorElement} */ (root.querySelector("[data-sr-send]"));
  const opening = /** @type {any} */ (ctx.data).review.opening;
  const update = () => {
    const d = new FormData(form);
    send.href = ctx.waHref(reviewText(opening, Object.fromEntries([...d.entries()].map(([k, v]) => [k, String(v)]))));
  };
  form.addEventListener("input", update);
  form.addEventListener("change", update);
  update();
}
