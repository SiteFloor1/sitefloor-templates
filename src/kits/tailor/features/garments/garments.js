// @ts-check
/** The first-appointment request: the sheet opens from the button; the WhatsApp message follows the form as it changes. */
import { appointmentText } from "../../lib/tailor.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).garments;
  const form = root.querySelector("[data-gm-form]");
  const send = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-gm-send]"));
  const sheet = /** @type {HTMLDialogElement|null} */ (root.querySelector("[data-gm-sheet]"));
  const open = /** @type {HTMLElement|null} */ (root.querySelector("[data-gm-open]")), close = root.querySelector("[data-gm-close]");
  if (!cfg || !form || !send || !sheet || !open || !close || typeof sheet.showModal !== "function") throw new Error("garments markup missing");
  const update = () => {
    const garments = [...form.querySelectorAll("input[name=gm-what]:checked")].map((i) => /** @type {HTMLInputElement} */ (i).value);
    const when = /** @type {HTMLInputElement|null} */ (form.querySelector("input[name=gm-when]:checked"))?.value ?? "";
    send.href = ctx.bookHref(appointmentText(cfg.message, { garments, when }));
  };
  open.addEventListener("click", (e) => { e.preventDefault(); sheet.showModal(); });
  close.addEventListener("click", () => sheet.close());
  sheet.addEventListener("click", (e) => { if (e.target === sheet) sheet.close(); });
  sheet.addEventListener("close", () => open.focus());
  form.addEventListener("change", update);
  update();
}
