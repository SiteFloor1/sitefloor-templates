// @ts-check
/** Bring a friend: the next seven days to choose from, and the message to the club with the friend's name and the day. */
import { zonedNow } from "../../../../core/lib/hours.js";
import { addDaysYmd, ukDate } from "../../../../core/lib/diary.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const msg = /** @type {any} */ (ctx.data).gym.friend;
  const name = /** @type {HTMLInputElement} */ (root.querySelector("#gf-name")), day = /** @type {HTMLSelectElement} */ (root.querySelector("[data-gf-day]"));
  const go = /** @type {HTMLAnchorElement} */ (root.querySelector("[data-gf-go]"));
  if (!msg || !name || !day || !go) return;
  const today = zonedNow(new Date(), ctx.data.hours.timezone).date;
  for (let i = 0; i < 7; i++) {
    const d = addDaysYmd(today, i);
    day.add(new Option(i === 0 ? "Today" : i === 1 ? "Tomorrow" : ukDate(d, true).replace(/ \d{4}$/, ""), ukDate(d, true).replace(/ \d{4}$/, "")));
  }
  const paint = () => {
    const who = name.value.trim().replace(/[<>]/g, "");
    const parts = [who && `My friend's name is ${who}.`, day.value && `We'd like to come on ${day.value}.`].filter(Boolean);
    go.href = ctx.waHref([msg, ...parts].join(" "));
  };
  name.addEventListener("input", paint);
  day.addEventListener("change", paint);
  root.querySelector("form")?.addEventListener("submit", (e) => e.preventDefault());
  paint();
}
