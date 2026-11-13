// @ts-check
/**
 * Payment Link buttons. On a client site they are plain links to the shop's own Stripe pages.
 * A deposit that holds a request can carry a reference to it: a kit shares `pay-ref:<id>` (from core/lib/pay-ref.js's
 * payRef) and the link gains Stripe's `client_reference_id`, so the business can match the deposit to the request.
 * On a demo the links are fake, so a tap shows a short note in place instead of leaving the site.
 */
import { withRef } from "../../core/lib/pay-ref.js";

/** @type {import("../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const buttons = /** @type {HTMLAnchorElement[]} */ (root.matches("[data-pay]") ? [root] : [...root.querySelectorAll("[data-pay]")]);
  for (const a of buttons) {
    if (a.dataset.payReady) continue;
    a.dataset.payReady = "true";
    const base = a.dataset.payUrl;
    if (base) ctx.watch(`pay-ref:${a.dataset.pay}`, (ref) => { a.href = withRef(base, typeof ref === "string" ? ref : ""); });
    if (ctx.data.mode !== "demo") continue;
    a.addEventListener("click", (e) => {
      e.preventDefault();
      let note = /** @type {HTMLElement|null} */ (a.nextElementSibling?.matches("[data-pay-demo]") ? a.nextElementSibling : null);
      if (!note) {
        note = document.createElement("span");
        note.className = "pl-demo";
        note.dataset.payDemo = "";
        note.setAttribute("role", "status");
        a.after(note);
      }
      note.textContent = "Demo site: no payment taken. On a real site this opens the shop's own Stripe payment page.";
    });
  }
}
