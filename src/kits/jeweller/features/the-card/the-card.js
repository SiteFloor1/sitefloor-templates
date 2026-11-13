// @ts-check
/** The gift, arranged: the card takes the words as they're typed; the request names the piece, the day and the card. */
import { giftText } from "../../lib/messages.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const form = /** @type {HTMLFormElement|null} */ (root.querySelector("[data-tc-form]"));
  const send = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-tc-send]"));
  const show = root.querySelector("[data-tc-show]");
  const left = root.querySelector("[data-tc-left]");
  const area = /** @type {HTMLTextAreaElement|null} */ (root.querySelector("[data-tc-text]"));
  if (!form || !send || !show || !left || !area) throw new Error("the card markup missing");
  const sample = show.textContent ?? "";
  const max = area.maxLength;
  const val = (/** @type {string} */ sel) => /** @type {HTMLInputElement|null} */ (form.querySelector(sel))?.value.trim() ?? "";
  const update = () => {
    const card = area.value.replace(/\s+/g, " ").trim();
    show.textContent = card || sample;
    show.classList.toggle("is-sample", !card);
    const n = max - area.value.length;
    left.textContent = n <= 20 ? `${n} letter${n === 1 ? "" : "s"} left` : `Up to ${max} letters.`;
    const by = val("[data-tc-by]");
    const text = giftText({
      house: ctx.data.name,
      occasion: root.dataset.tcOccasion ?? "",
      piece: val('input[name="tc-piece"]:checked') || val('input[name="tc-piece"]'),
      by: /^\d{4}-\d{2}-\d{2}$/.test(by) ? by : "",
      card,
      name: val("[data-tc-name]"),
    });
    send.href = ctx.waHref(text);
    send.dataset.waText = text;
  };
  form.addEventListener("input", update);
  form.addEventListener("change", update);
  update();
}
