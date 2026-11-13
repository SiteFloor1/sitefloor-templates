// @ts-check
/** The studio's month follows the year above; the next start hides itself once it is out of date. */
import { isFresh, monthOf, MONTHS } from "../../lib/garden.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).month;
  const months = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-cal-month]")]);
  if (!cfg || months.length !== 12) throw new Error("garden-calendar markup missing");
  const show = (/** @type {number} */ m) => months.forEach((el, i) => { el.hidden = i + 1 !== m; });
  const today = ctx.now().date;
  show(monthOf(today));
  // a look may name the month elsewhere on the page (Almanac's phone bar): the visitor's month, not the build's
  document.querySelectorAll("[data-month-name]").forEach((el) => { el.textContent = MONTHS[monthOf(today) - 1]; });
  ctx.watch("gardenMonth", (m) => show(Number(m)));
  const next = /** @type {HTMLElement|null} */ (root.querySelector("[data-cal-next]"));
  if (next && cfg.nextStart) next.hidden = !isFresh(cfg.nextStart.updated, today, cfg.nextStart.staleAfterDays);
}
