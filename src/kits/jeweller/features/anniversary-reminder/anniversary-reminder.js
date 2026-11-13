// @ts-check
/** Anniversary reminder: makes a calendar file (.ics, times in UTC) with a yearly reminder; nothing is sent anywhere. */
import { anniversaryIcs } from "../../lib/reminders.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const form = /** @type {HTMLFormElement|null} */ (root.querySelector("[data-anni-form]"));
  const say = root.querySelector("[data-anni-say]");
  if (!form || !say) return;
  const data = /** @type {any} */ (ctx.data);
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const date = /** @type {HTMLInputElement} */ (form.querySelector("[data-anni-date]")).value;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { say.textContent = "Choose the date first."; return; }
    const label = /** @type {HTMLInputElement} */ (form.querySelector("[data-anni-label]")).value.trim() || "Our anniversary";
    const weeks = Number(/** @type {HTMLInputElement|null} */ (form.querySelector('input[name="anni-weeks"]:checked'))?.value ?? 4);
    // The three on show in the shortlist, if there is one, go in the reminder.
    const band = /** @type {HTMLInputElement|null} */ (form.querySelector('[data-sl]:not(.tier-off) input[type="radio"]:checked'))?.value;
    const ideas = band === undefined ? [] : [...form.querySelectorAll(`[data-sl-panel="${band}"] [data-sl-item]`)].map((li) => /** @type {HTMLElement} */ (li).dataset.slItem ?? "");
    const ics = anniversaryIcs({ ideas, date, weeksBefore: weeks, label, business: ctx.data.name, place: data.place ?? "", url: data.url ?? "", timeZone: ctx.data.hours.timezone, today: ctx.now().date, stamp: new Date() });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    a.download = "anniversary-reminder.ics";
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    say.textContent = `Done: a reminder ${weeks} weeks before, every year${ideas.length ? `, with your three` : ""}. Open the file to add it to your calendar.`;
  });
}
