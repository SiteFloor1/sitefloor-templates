// @ts-check
/** Members' events: an event whose day has passed (in the club's time zone) leaves the list; the next one becomes the lead. */
import { zonedNow } from "../../../../core/lib/hours.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const items = /** @type {HTMLElement[]} */ ([...root.querySelectorAll(".gev-e")]);
  const none = /** @type {HTMLElement|null} */ (root.querySelector("[data-gev-none]"));
  const paint = () => {
    const today = zonedNow(new Date(), ctx.data.hours.timezone).date;
    let shown = 0;
    for (const li of items) { li.hidden = (li.dataset.date ?? "") < today; if (!li.hidden) shown++; }
    if (none) none.hidden = shown > 0;
  };
  paint();
  ctx.everyMinute(paint);
}
