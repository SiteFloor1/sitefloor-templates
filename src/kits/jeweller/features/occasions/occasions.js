// @ts-check
/**
 * Occasions: hides any whose dates have passed since the build, and leads with the one on now (the latest to have
 * started), else the next to come; the same rule as the build (lib/calendar.js).
 */
import { occasionOrder } from "../../lib/calendar.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const items = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-to]")]);
  const paint = () => {
    const today = ctx.now().date;
    const { lead } = occasionOrder(items.map((el) => ({ el, from: el.dataset.from ?? "", to: el.dataset.to ?? "" })), today);
    for (const el of items) {
      el.hidden = (el.dataset.to ?? "") < today;
      el.classList.toggle("is-lead", el === lead?.el);
    }
    if (lead && lead.el !== items.find((el) => !el.hidden)) lead.el.parentElement?.prepend(lead.el);
  };
  paint();
  ctx.everyMinute(paint);
}
