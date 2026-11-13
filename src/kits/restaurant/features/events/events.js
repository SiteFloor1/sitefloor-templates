// @ts-check
/** Events: hides events once their day has passed (the page may be older than today) and makes calendar files. */
import { eventIcs } from "../../lib/events.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const data = /** @type {any} */ (ctx.data);
  const today = ctx.now().date;
  let left = 0;
  for (const el of /** @type {NodeListOf<HTMLElement>} */ (root.querySelectorAll("[data-ev]"))) {
    el.hidden = (el.dataset.date ?? "") < today;
    if (!el.hidden) left++;
  }
  const none = /** @type {HTMLElement|null} */ (root.querySelector("[data-ev-none]"));
  if (none) none.hidden = left > 0;
  root.addEventListener("click", (e) => {
    const b = /** @type {HTMLElement} */ (e.target).closest("[data-ev-ics]");
    if (!b) return;
    const ev = data.events.find((/** @type {any} */ x) => x.id === /** @type {HTMLElement} */ (b).dataset.evIcs);
    if (!ev) return;
    const ics = eventIcs({ event: ev, place: data.place, business: data.name, timeZone: data.hours.timezone, stamp: new Date() });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    a.download = `${ev.id}.ics`;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  });
}
