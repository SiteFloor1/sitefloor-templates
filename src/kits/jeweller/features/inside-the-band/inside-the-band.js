// @ts-check
/** Inside the band: the words follow the inside of the band in the photo as they're typed, in the chosen lettering. */
import { engraving } from "../../lib/messages.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const input = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-eng-text]"));
  const show = root.querySelector("[data-eng-show]");
  const svgText = /** @type {SVGTextElement|null} */ (root.querySelector("[data-eng-svg]"));
  const left = root.querySelector("[data-eng-left]");
  const say = root.querySelector("[data-eng-say]");
  const send = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-eng-send]"));
  if (!input || !show || !svgText || !left || !say || !send) return;
  const max = Number(root.dataset.max);
  const paint = () => {
    const { text } = engraving(input.value, max);
    const style = /** @type {HTMLInputElement|null} */ (root.querySelector('input[type="radio"]:checked'));
    show.textContent = text || " ";
    svgText.dataset.style = style?.value ?? "";
    left.textContent = `${max - text.length} letters left`;
    say.textContent = text ? `Engraved inside: ${text}` : "";
    const msg = text
      ? `Hello ${ctx.data.name}, I'd like ${root.dataset.piece} engraved inside: "${text}", in ${style?.dataset.label ?? "your"} lettering. Is that possible?`
      : `Hello ${ctx.data.name}, I'd like to ask about engraving ${root.dataset.piece}.`;
    send.href = ctx.waHref(msg); send.dataset.waText = msg;
  };
  root.addEventListener("input", paint);
  root.addEventListener("change", paint);
  paint();
}
