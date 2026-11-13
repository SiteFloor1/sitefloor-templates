// @ts-check
/** Gift wrap: the card's words, counted, put into the WhatsApp message. */
import { must } from "../dom.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const card = /** @type {HTMLTextAreaElement} */ (must(root, "[data-wrap-card]"));
  const count = must(root, "[data-wrap-count]");
  const send = /** @type {HTMLAnchorElement} */ (must(root, "[data-wrap-send]"));
  const update = () => {
    const words = card.value.replace(/\s+/g, " ").trim();
    count.textContent = card.value ? `${card.maxLength - card.value.length} left` : "";
    send.href = ctx.waHref([`Hello ${ctx.data.name}, please gift wrap my order.`, words ? `For the card: "${words}"` : ""].filter(Boolean).join("\n"));
  };
  card.addEventListener("input", update);
  update();
}
