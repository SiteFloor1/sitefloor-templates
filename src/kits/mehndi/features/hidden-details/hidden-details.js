// @ts-check
/** Personal details in the design: what to hide, the exact words, where and the date, gathered into one WhatsApp message. */
import { personalText } from "../../lib/mehndi.js";
import { dateField } from "../../partials/date-field.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).personal;
  const details = /** @type {HTMLTextAreaElement|null} */ (root.querySelector("[data-pd-details]"));
  const send = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-pd-send]"));
  if (!cfg || !details || !send) throw new Error("personal details markup missing");
  let wedding = "";
  const update = () => {
    const kinds = [...root.querySelectorAll("input[name=pd-k]:checked")].map((i) => /** @type {HTMLInputElement} */ (i).value);
    const where = /** @type {HTMLInputElement|null} */ (root.querySelector("input[name=pd-w]:checked"))?.value ?? "";
    send.href = ctx.bookHref(personalText(cfg.message, { kinds, details: details.value.trim(), where, wedding }));
  };
  root.addEventListener("submit", (e) => e.preventDefault());
  root.addEventListener("change", update);
  details.addEventListener("input", update);
  dateField(root, ctx, "wedding", (ymd) => { wedding = ymd; update(); });
}
