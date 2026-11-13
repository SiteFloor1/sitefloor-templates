// @ts-check
/** Workshops: hide dates that have passed since the build; places left from the Sheet ("workshop,<id>,<n>") when set. */
import { startStudio } from "../../lib/studio.js";
import { placesLeft } from "../../lib/orders.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const none = /** @type {HTMLElement|null} */ (root.querySelector("[data-ws-none]"));
  const items = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-ws]")]);
  const tidy = () => {
    const today = ctx.now().date;
    let left = 0;
    for (const li of items) { const gone = (li.dataset.date ?? "") < today; li.hidden = gone; if (!gone) left++; }
    if (none) none.hidden = left > 0;
  };
  tidy();
  ctx.everyMinute(tidy);
  startStudio(ctx);
  ctx.watch("studio", (/** @type {any} */ s) => {
    if (!s?.ok) return;
    for (const li of items) {
      const live = s.workshop?.[li.dataset.ws ?? ""];
      if (live === undefined) continue;
      const places = Number(li.dataset.places);
      const n = placesLeft(places, places, live);
      const el = li.querySelector("[data-ws-left]");
      if (el) el.textContent = n === 0 ? "Full" : `${n} of ${places} places left`;
      const pay = /** @type {HTMLElement|null} */ (li.querySelector("[data-ws-pay]"));
      if (pay) pay.hidden = n === 0;
    }
  });
}
