// @ts-check
/** Remember the date: a yearly calendar event (.ics) with an order-by reminder, made in the browser; nothing is sent. */
import { rememberIcs } from "../../lib/remember.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const form = /** @type {HTMLFormElement|null} */ (root.querySelector("[data-rem-form]"));
  const say = root.querySelector("[data-rem-say]");
  const F = /** @type {any} */ (ctx.data).florist;
  if (!form || !say || !F?.remember) throw new Error("remember the date: markup or data missing");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const date = /** @type {HTMLInputElement} */ (form.querySelector("[data-rem-date]")).value;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { say.textContent = "Choose the date first."; return; }
    const who = /** @type {HTMLInputElement} */ (form.querySelector("[data-rem-who]")).value.trim();
    const kind = /** @type {HTMLSelectElement} */ (form.querySelector("[data-rem-kind]")).value;
    const label = who ? `${who}: ${kind.toLowerCase()}` : kind;
    const ics = rememberIcs({ label, date, orderDaysBefore: F.remember.orderDaysBefore, business: ctx.data.name, url: F.url, timeZone: ctx.data.hours.timezone, today: ctx.now().date, stamp: new Date(), uid: `${date}-${Date.now()}@sitefloor` });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    a.download = "remember-the-date.ics";
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    say.textContent = `Done: every year, with a reminder ${F.remember.orderDaysBefore === 1 ? "the day" : `${F.remember.orderDaysBefore} days`} before. Open the file to add it to your calendar.`;
  });
}
