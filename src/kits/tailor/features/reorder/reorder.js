// @ts-check
/**
 * From your pattern: the order slip becomes one WhatsApp message (the code, the garment, the cloth, any change). The send
 * link waits for a code that looks like one; nothing is stored or sent by the site.
 */
import { cleanCode, reorderText } from "../../lib/tailor.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).reorder;
  const q = (/** @type {string} */ s) => /** @type {HTMLElement|null} */ (root.querySelector(s));
  const form = /** @type {HTMLFormElement|null} */ (q("[data-ro-form]")), codeIn = /** @type {HTMLInputElement|null} */ (q("[data-ro-code]"));
  const send = /** @type {HTMLAnchorElement|null} */ (q("[data-ro-send]")), help = q("[data-ro-help]");
  if (!cfg || !form || !codeIn || !send || !help) throw new Error("re-order slip markup missing");
  const helpText = help.textContent ?? "";
  const clothSel = /** @type {HTMLSelectElement|null} */ (q("[data-ro-cloth]")), changes = /** @type {HTMLTextAreaElement|null} */ (q("[data-ro-changes]"));

  let left = false; // say a code looks wrong only once it could be whole, or the visitor has moved on
  const render = () => {
    const raw = codeIn.value.trim(), code = cleanCode(raw);
    const bad = Boolean(raw) && !code && (left || raw.replace(/[^a-z0-9]/gi, "").length >= 12);
    codeIn.setAttribute("aria-invalid", String(bad));
    help.textContent = bad ? "That doesn't look like an order code: 8 to 12 letters and numbers." : helpText;
    if (code) send.removeAttribute("aria-disabled"); else send.setAttribute("aria-disabled", "true");
    const garment = /** @type {HTMLInputElement|null} */ (form.querySelector("input[name=ro-garment]:checked"))?.value ?? "";
    const opt = clothSel?.selectedOptions[0];
    const cloth = !clothSel ? null : opt?.value === "same" ? "the same as last time" : opt?.value ? opt.dataset.label ?? "" : "";
    send.href = ctx.bookHref(reorderText(cfg.message, { code, garment, cloth, changes: changes?.value ?? "" }));
  };
  codeIn.addEventListener("blur", () => { left = true; render(); });
  send.addEventListener("click", (e) => { if (!cleanCode(codeIn.value)) { e.preventDefault(); left = true; codeIn.focus(); render(); } });
  form.addEventListener("input", render);
  form.addEventListener("change", render);
  render();
}
