// @ts-check
/** The colour consultation: the message follows the form as it changes, and asks for two photos in the chat. */
import { bookText } from "../../lib/hair.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).consultation;
  const form = root.querySelector("[data-cc-form]"), send = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-cc-send]"));
  const more = /** @type {HTMLTextAreaElement|null} */ (root.querySelector("[data-cc-more]"));
  if (!cfg || !form || !send || !more) throw new Error("colour-consult markup missing");
  const val = (/** @type {string} */ n) => /** @type {HTMLInputElement|null} */ (form.querySelector(`input[name=${n}]:checked`))?.value ?? "";
  const update = () => {
    send.href = ctx.bookHref(bookText(cfg.message, { extra: [
      `I'm thinking: ${val("cc-want")}.`, `Last coloured: ${val("cc-last").toLowerCase()}.`, more.value.trim(),
      "I'll send two photos here: my hair now, in daylight, and a colour I love.",
    ] }));
  };
  form.addEventListener("change", update);
  more.addEventListener("input", update);
  update();
}
