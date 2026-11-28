// @ts-check
/** A day with us: marks the moment under way, on weekdays while the nursery is open (its own time zone). */
import { aroundNow, minutesIn, ymdIn, dayKey } from "../../lib/nursery.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).nursery.day;
  if (!cfg) throw new Error("day data missing");
  const tz = ctx.data.hours.timezone, now = Date.now();
  const i = aroundNow(cfg.times.map((/** @type {string} */ time) => ({ time })), minutesIn(now, tz), dayKey(ymdIn(now, tz)), cfg.closes);
  root.querySelectorAll("[data-nu-moment]").forEach((li, k) => {
    li.classList.toggle("is-now", k === i);
    const tag = /** @type {HTMLElement|null} */ (li.querySelector(".nu-now"));
    if (tag) tag.hidden = k !== i;
  });
}
