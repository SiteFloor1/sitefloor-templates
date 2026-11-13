// @ts-check
/** Bridal party orders: keeps the count, what it comes to at the client's own prices, and the request in step. */
import { partyText } from "../../lib/messages.js";
import { partyTotal } from "../../lib/pieces.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const form = /** @type {HTMLFormElement|null} */ (root.querySelector("[data-bp-form]"));
  const send = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-bp-send]"));
  const sum = root.querySelector("[data-bp-sum]");
  if (!form || !send || !sum) throw new Error("bridal party markup missing");
  const gbp = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 });
  const val = (/** @type {string} */ sel) => /** @type {HTMLInputElement|null} */ (form.querySelector(sel))?.value.trim() ?? "";
  const update = () => {
    const rows = [...form.querySelectorAll("[data-bp-row]")].map((tr) => {
      const sel = /** @type {HTMLSelectElement} */ (tr.querySelector("[data-bp-piece]"));
      const opt = sel.selectedOptions[0];
      const input = /** @type {HTMLInputElement} */ (tr.querySelector("[data-bp-n]"));
      const n = Math.max(0, Math.min(Number(input.max) || 40, Math.floor(Number(input.value) || 0)));
      return { role: /** @type {HTMLElement} */ (tr).dataset.role ?? "", piece: opt?.dataset.name ?? "", n, price: opt?.dataset.price ? Number(opt.dataset.price) : undefined };
    });
    const t = partyTotal(rows);
    sum.textContent = !t.count ? "Nothing chosen yet."
      : `${t.count} piece${t.count === 1 ? "" : "s"} · ${t.total === null ? "price on request" : `${gbp.format(t.total)} at our listed prices, before any engraving`}`;
    const date = val("[data-bp-date]");
    const text = partyText({ house: ctx.data.name, date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : "", rows: rows.map((r) => ({ ...r, role: r.role.toLowerCase() })), names: val("[data-bp-names]"), note: val("[data-bp-note]"), name: val("[data-bp-name]") });
    send.href = ctx.waHref(text);
    send.dataset.waText = text;
  };
  form.addEventListener("input", update);
  form.addEventListener("change", update);
  update();
}
