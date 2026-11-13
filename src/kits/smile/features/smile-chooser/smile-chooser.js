// @ts-check
/**
 * Tell me what you'd change: one choice at a time; the message it writes shows in the bubble and goes in the Send link.
 */
import { chooserText } from "../../lib/smile.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const opts = /** @type {any} */ (ctx.data).chooser?.options;
  const bubble = root.querySelector("[data-ch-text]"), send = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-ch-send]"));
  const chips = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll("[data-ch]")]);
  if (!opts || !bubble || !send || !chips.length) throw new Error("chooser markup missing");
  const choose = (/** @type {number} */ i) => {
    const text = chooserText(opts[i].message);
    chips.forEach((b, j) => b.setAttribute("aria-pressed", String(i === j)));
    bubble.textContent = text;
    send.href = ctx.bookHref(text);
    if (send.hasAttribute("data-wa-text")) send.dataset.waText = text;
  };
  chips.forEach((b, i) => b.addEventListener("click", () => choose(i)));
}
