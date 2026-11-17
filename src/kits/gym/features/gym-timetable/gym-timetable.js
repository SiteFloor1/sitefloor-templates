// @ts-check
/**
 * Classes: shows the visitor's today (only classes still to start) and tomorrow from the week the build wrote, and
 * writes places left beside a class only while gym-spaces has a fresh count for it.
 */
import { zonedNow, toMinutes } from "../../../../core/lib/hours.js";
import { addDaysYmd } from "../../../../core/lib/diary.js";
import { placesWords } from "../../lib/gym.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const days = /** @type {HTMLElement[]} */ ([...root.querySelectorAll(".gt-day")]);
  const paint = () => {
    const now = zonedNow(new Date(), ctx.data.hours.timezone);
    const show = [now.date, addDaysYmd(now.date, 1)];
    if (!days.some((d) => d.dataset.date === now.date)) return; // older than the build's week: leave the built page
    days.forEach((d) => {
      const i = show.indexOf(d.dataset.date ?? "");
      d.hidden = i < 0;
      if (i < 0) return;
      const label = /** @type {HTMLElement} */ (d.querySelector("[data-gt-label]"));
      if (label) label.textContent = i === 0 ? "Today" : "Tomorrow";
      let left = 0;
      d.querySelectorAll(".gt-s").forEach((s) => {
        const el = /** @type {HTMLElement} */ (s);
        el.hidden = i === 0 && toMinutes(el.dataset.time ?? "00:00") <= now.minutes;
        if (!el.hidden) left++;
      });
      const none = /** @type {HTMLElement} */ (d.querySelector("[data-gt-none]"));
      if (none) none.hidden = left > 0;
    });
  };
  ctx.watch("gymPlaces", (/** @type {any} */ p) => {
    root.querySelectorAll(".gt-s").forEach((s) => {
      const el = /** @type {HTMLElement} */ (s), out = /** @type {HTMLElement} */ (el.querySelector("[data-left]"));
      const n = p?.ok ? p.left[el.dataset.key ?? ""] : undefined;
      if (out) { out.hidden = n === undefined; out.textContent = n === undefined ? "" : placesWords(n); }
    });
  });
  paint();
  ctx.everyMinute(paint);
}
