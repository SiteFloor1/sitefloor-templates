// @ts-check
/** Gift vouchers: the preview follows the form, and the button orders it with every detail filled in. */
import { isAllowedAmount, voucherMessage } from "../../core/lib/vouchers.js";
import { pounds } from "../../core/lib/savings.js";

/** @type {import("../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = ctx.data.vouchers;
  const form = /** @type {HTMLFormElement|null} */ (root.querySelector("[data-vc-form]"));
  const order = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-vc-order]"));
  if (!cfg || !form || !order) throw new Error("vouchers markup or data missing");
  const q = (/** @type {string} */ s) => /** @type {HTMLInputElement} */ (root.querySelector(s));
  const custom = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-vc-custom]"));
  const err = q("[data-vc-err]");

  const amount = () => {
    const picked = /** @type {HTMLInputElement|null} */ (form.querySelector('input[name="vc-amount"]:checked'));
    if (!picked) return NaN;
    return picked.value === "custom" ? Number(custom?.value) : Number(picked.value);
  };
  const update = () => {
    const isCustom = /** @type {HTMLInputElement|null} */ (form.querySelector('input[value="custom"]'))?.checked ?? false;
    if (custom) custom.hidden = !isCustom;
    const a = amount();
    const ok = isAllowedAmount(a, cfg);
    err.hidden = ok || (isCustom && !custom?.value);
    err.textContent = cfg.custom ? `Choose a whole amount from £${cfg.custom.min} to £${cfg.custom.max}.` : "Choose an amount.";
    const to = q("[data-vc-to]").value.trim(), from = q("[data-vc-from]").value.trim(), note = q("[data-vc-note]").value.trim();
    q("[data-vc-show-amount]").textContent = ok ? pounds(a) : "£–";
    q("[data-vc-show-to]").textContent = to ? `For ${to}${from ? `, from ${from}` : ""}` : "Gift voucher";
    q("[data-vc-show-note]").textContent = note;
    order.setAttribute("aria-disabled", String(!ok));
    order.href = ok ? ctx.waHref(voucherMessage({ amount: a, to, from, note })) : "#";
  };
  form.addEventListener("input", update);
  form.addEventListener("submit", (e) => e.preventDefault());
  order.addEventListener("click", (e) => { if (order.getAttribute("aria-disabled") === "true") { e.preventDefault(); err.hidden = false; } });
  update();
}
