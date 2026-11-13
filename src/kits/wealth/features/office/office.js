// @ts-check
/** Our office: each office's time now and whether it is open, refreshed with the page's minute tick. */
import { officeNow, officeLine } from "../../lib/offices.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const offices = /** @type {any} */ (ctx.data).offices;
  if (!Array.isArray(offices)) throw new Error("office data missing");
  const draw = () => {
    const at = new Date();
    offices.forEach((/** @type {any} */ o, /** @type {number} */ i) => {
      const n = officeNow(o.hours, at);
      root.querySelectorAll(`[data-office-time="${i}"]`).forEach((el) => { el.textContent = n.time; });
      root.querySelectorAll(`[data-office-state="${i}"]`).forEach((el) => {
        const name = /** @type {HTMLElement} */ (el).dataset.officeName;
        el.textContent = name ? `in ${name} now. ${officeLine(n)}` : officeLine(n);
        el.classList.toggle("is-open", n.open);
      });
    });
  };
  draw();
  ctx.everyMinute(draw);
}
