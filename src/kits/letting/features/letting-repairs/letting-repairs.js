// @ts-check
/** Report a repair: the form writes the WhatsApp message as the tenant types. Nothing is sent or stored by the site. */
import { repairText } from "../../lib/repairs.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const form = /** @type {HTMLFormElement} */ (root.querySelector("[data-lp-form]"));
  const send = /** @type {HTMLAnchorElement} */ (root.querySelector("[data-lp-send]"));
  if (!form || !send) throw new Error("letting-repairs markup missing");
  const start = /** @type {any} */ (ctx.data).repairs.message;
  const update = () => {
    const f = new FormData(form);
    send.href = ctx.waHref(repairText(start, { home: String(f.get("home") ?? ""), what: String(f.get("what") ?? ""), where: String(f.get("where") ?? ""), keys: String(f.get("keys") ?? "") }));
  };
  form.addEventListener("input", update);
  form.addEventListener("change", update);
  update();
}
