// @ts-check
/** Term dates: hides any date that has passed since the page was built, and makes one calendar file of what's ahead. */
import { upcoming, ics, icsStamp, ymdIn } from "../../lib/nursery.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).nursery.terms;
  const data = /** @type {any} */ (ctx.data).nursery;
  if (!cfg) throw new Error("terms data missing");
  const today = ymdIn(Date.now(), ctx.data.hours.timezone);
  root.querySelectorAll("[data-nu-terms] li").forEach((li) => { /** @type {HTMLElement} */ (li).hidden = (/** @type {HTMLElement} */ (li).dataset.end ?? "") < today; });
  const btn = /** @type {HTMLButtonElement|null} */ (root.querySelector("[data-nu-ics]"));
  const items = upcoming(cfg.items, today);
  if (!btn || !items.length) return;
  btn.hidden = false;
  btn.addEventListener("click", () => {
    const file = ics({ name: data.name, place: data.place, stamp: icsStamp(Date.now()), items });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([file], { type: "text/calendar" })), download: `${data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-dates.ics` });
    document.body.append(a); a.click(); a.remove();
  });
}
