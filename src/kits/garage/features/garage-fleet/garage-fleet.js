// @ts-check
/** The business enquiry, written as one WhatsApp message as the form changes. */
import { fleetMessage } from "../../lib/garage.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const form = /** @type {HTMLFormElement|null} */ (root.querySelector("[data-fl-form]")), send = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-fl-send]"));
  if (!form || !send) return;
  const draw = () => {
    const f = new FormData(form);
    send.href = ctx.bookHref(fleetMessage(/** @type {any} */ (ctx.data).name, {
      company: String(f.get("company") ?? "").trim(), vehicles: String(f.get("vehicles") ?? ""), when: String(f.get("when") ?? ""),
      invoice: f.get("invoice") === "on", note: String(f.get("note") ?? ""),
    }));
  };
  form.addEventListener("input", draw); form.addEventListener("change", draw);
  form.addEventListener("submit", (e) => e.preventDefault());
  draw();
}
