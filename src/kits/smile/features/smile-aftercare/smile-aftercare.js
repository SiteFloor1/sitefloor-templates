// @ts-check
/** Aftercare reminders: the day of treatment in, each reminder as an all-day calendar event that many months later. */
import { reminderEvents, dayEventsIcs } from "../../lib/smile.js";
import { saveIcs, stamp } from "../smile-journey/ics.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const data = /** @type {any} */ (ctx.data);
  const day = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-ac-day]"));
  const go = /** @type {HTMLButtonElement|null} */ (root.querySelector("[data-ac-ics]"));
  if (!day || !go || !data.reminders?.length) return; // no reminders set: the page is just the instructions
  day.max = ctx.now().date;
  day.addEventListener("input", () => { go.disabled = !day.value; });
  go.addEventListener("click", () => {
    if (!day.value) return;
    saveIcs(dayEventsIcs({ events: reminderEvents(day.value, data.reminders), studio: data.name ?? "studio", place: data.place, stamp: stamp() }), "aftercare-reminders.ics");
  });
}
