// @ts-check
/** A free day pass: the next fourteen days to choose from; the message carries the day and the goal. */
import { zonedNow } from "../../../../core/lib/hours.js";
import { addDaysYmd, ukDate } from "../../../../core/lib/diary.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const msg = /** @type {any} */ (ctx.data).gym.dayPass;
  const day = /** @type {HTMLSelectElement} */ (root.querySelector("[data-gd-day]")), goal = /** @type {HTMLSelectElement|null} */ (root.querySelector("[data-gd-goal]"));
  const go = /** @type {HTMLAnchorElement} */ (root.querySelector("[data-gd-go]"));
  if (!msg || !day || !go) return;
  const today = zonedNow(new Date(), ctx.data.hours.timezone).date;
  for (let i = 0; i < 14; i++) {
    const label = ukDate(addDaysYmd(today, i), true).replace(/ \d{4}$/, "");
    day.add(new Option(i === 0 ? "Today" : i === 1 ? "Tomorrow" : label, label));
  }
  const paint = () => {
    const parts = [day.value && `I'd like to come on ${day.value}.`, goal?.value && `I train for ${goal.value.toLowerCase()}.`].filter(Boolean);
    go.href = ctx.waHref([msg, ...parts].join(" "));
  };
  day.addEventListener("change", paint);
  goal?.addEventListener("change", paint);
  root.querySelector("form")?.addEventListener("submit", (e) => e.preventDefault());
  paint();
}
