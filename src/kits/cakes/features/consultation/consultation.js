// @ts-check
/** Book a design consultation: the way to meet, the days that suit and the event date go into the WhatsApp message. */
import { longDate } from "../../lib/cakes.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).cakes?.consultation;
  const form = /** @type {HTMLFormElement|null} */ (root.querySelector("[data-cs-form]"));
  const send = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-cs-send]"));
  if (!cfg || !form || !send) throw new Error("consultation markup missing");
  const render = () => {
    const kind = cfg.kinds.find((/** @type {any} */ k) => k.id === (/** @type {HTMLInputElement|null} */ (form.querySelector("input[name=cs-kind]:checked")))?.value);
    const when = [.../** @type {NodeListOf<HTMLInputElement>} */ (form.querySelectorAll("input[name=cs-when]:checked"))].map((i) => i.value);
    const date = /** @type {HTMLInputElement|null} */ (form.querySelector("[data-cs-date]"))?.value ?? "";
    const lines = [cfg.message];
    if (kind) lines.push(`How: ${kind.name}`);
    if (when.length) lines.push(`Best for us: ${when.join(", ")}`);
    if (date) lines.push(`Our event: ${longDate(date)}`);
    const text = lines.join("\n");
    send.href = ctx.waHref(text);
    send.dataset.waText = text;
  };
  form.addEventListener("change", render);
  render();
}
