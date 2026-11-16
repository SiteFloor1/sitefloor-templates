// @ts-check
/**
 * The patch-test day: the appointment in, the clinic's hours before it as a calendar day (on or before). A day
 * already past, or an appointment too soon for the rule, says so and offers nothing to save.
 */
import { daysBetween } from "../../../../core/lib/diary.js";
import { dayEventsIcs, longDay, patchDay } from "../../lib/skin.js";
import { saveIcs, stamp } from "../../lib/save.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const data = /** @type {any} */ (ctx.data), cfg = data.patch;
  const input = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-pt-date]"));
  const out = root.querySelector("[data-pt-out]"), ics = /** @type {HTMLButtonElement|null} */ (root.querySelector("[data-pt-ics]"));
  const send = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-pt-send]"));
  if (!cfg || !input || !out || !ics || !send) throw new Error("patch markup missing");
  input.min = ctx.now().date;
  const render = () => {
    const day = input.value, today = ctx.now().date;
    const patch = day ? patchDay(day, cfg.hoursBefore) : "";
    const ok = Boolean(patch && daysBetween(today, patch) >= 0);
    out.textContent = !day ? "" : daysBetween(today, day) < 0 ? "That date has passed." : ok ? `Your patch test: on or before ${longDay(patch)}.` : `That is less than ${cfg.hoursBefore} hours away. Ask us on WhatsApp what we can do.`;
    ics.hidden = !ok;
    send.hidden = !day || daysBetween(today, day) < 0;
    if (day) send.href = ctx.bookHref(ok ? `Hello ${data.name}, I'd like to book a patch test on or before ${longDay(patch)}, for my appointment on ${longDay(day)}.` : `Hello ${data.name}, my appointment is on ${longDay(day)}. Is there time for a patch test?`);
  };
  input.addEventListener("change", render);
  ics.addEventListener("click", () => {
    const patch = patchDay(input.value, cfg.hoursBefore);
    saveIcs(dayEventsIcs({ events: [{ id: "patch", date: patch, title: `Patch test at ${data.name}`, note: `For the appointment on ${longDay(input.value)}` }], clinic: data.name, place: data.place, stamp: stamp() }), `patch-test-${patch}.ics`);
  });
  render();
}
