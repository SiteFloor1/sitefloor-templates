// @ts-check
/**
 * Complete the look: the set's pieces and her length, totalled (lib/modest.js); "Send this look" carries the whole
 * look to the shop. The shop's Stripe link has a fixed amount, so it shows only while the total matches it. The look
 * bar ([data-look-…], in the look's phone bar) follows the set she last changed.
 */
import { lookTotal, lookMessage, pounds } from "../../lib/modest.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const data = /** @type {any} */ (ctx.data), cfg = data.looks;
  if (!cfg) return;
  for (const form of /** @type {NodeListOf<HTMLFormElement>} */ (root.querySelectorAll("form[data-set]"))) {
    const set = cfg.sets.find((/** @type {any} */ s) => s.id === form.dataset.set);
    const total = form.querySelector("[data-set-total]"), send = /** @type {HTMLAnchorElement|null} */ (form.querySelector("[data-set-send]"));
    const pay = /** @type {HTMLElement|null} */ (form.querySelector("[data-set-pay]")), note = /** @type {HTMLElement|null} */ (form.querySelector("[data-set-paynote]"));
    if (!set || !total || !send) continue;
    const amount = Number(form.dataset.payAmount || NaN);
    /** @param {boolean} toBar */
    const draw = (toBar) => {
      const fd = new FormData(form);
      const chosen = set.items.map((/** @type {any} */ _x, /** @type {number} */ i) => fd.getAll("add").includes(String(i)));
      const length = Number(fd.get("length")) || null;
      const t = lookTotal(set.items, chosen);
      total.textContent = pounds(t.total);
      send.href = ctx.bookHref(lookMessage(data.name, set.name, t.picked, length, t.total));
      if (pay && note) { const fits = t.total === amount; pay.hidden = !fits; note.hidden = fits; }
      if (!toBar) return;
      for (const el of document.querySelectorAll("[data-look-items]")) el.textContent = t.picked.map((/** @type {any} */ x, /** @type {number} */ i) => (i === 0 ? `${x.name}, ${length ?? "to measure"}` : x.name)).join(" · ");
      for (const el of document.querySelectorAll("[data-look-total]")) el.textContent = pounds(t.total);
    };
    form.addEventListener("change", () => draw(true));
    form.addEventListener("submit", (e) => e.preventDefault());
    draw(false);
  }
}
