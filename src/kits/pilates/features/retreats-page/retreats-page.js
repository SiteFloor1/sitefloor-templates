// @ts-check
/**
 * Retreats: hide any that have finished since the site was built, so a past retreat never shows as coming. On a
 * retreat's own page, say how long until the balance is due, and that it has finished once it has.
 */
import { daysUntil } from "../../lib/members.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const card = /** @type {HTMLElement|null} */ (root.querySelector("[data-rt-card]"));
  if (card) { retreatPage(card, ctx); return; }
  const none = /** @type {HTMLElement|null} */ (root.querySelector("[data-rt-none]"));
  if (!none) throw new Error("retreats markup missing");
  const tidy = () => {
    const today = ctx.now().date;
    let left = 0;
    for (const li of root.querySelectorAll("[data-to]")) {
      const done = (/** @type {HTMLElement} */ (li).dataset.to ?? "") < today;
      /** @type {HTMLElement} */ (li).hidden = done;
      if (!done) left++;
    }
    none.hidden = left > 0;
  };
  tidy();
  ctx.everyMinute(tidy);
}

/** @param {HTMLElement} card @param {import("../../../../core/js/core.js").Ctx} ctx */
function retreatPage(card, ctx) {
  const days = /** @type {HTMLElement|null} */ (card.querySelector("[data-rt-days]")), past = /** @type {HTMLElement|null} */ (card.querySelector("[data-rt-past]"));
  const pay = /** @type {HTMLElement|null} */ (card.querySelector(".pl-rt-go"));
  const tidy = () => {
    const today = ctx.now().date;
    const over = (card.dataset.to ?? "") < today;
    if (past) past.hidden = !over;
    if (pay) pay.hidden = over;
    if (days) {
      const n = daysUntil(today, days.dataset.due ?? today);
      days.textContent = n > 1 ? `· in ${n} days` : n === 1 ? "· tomorrow" : n === 0 ? "· today" : "";
    }
  };
  tidy();
  ctx.everyMinute(tidy);
}
