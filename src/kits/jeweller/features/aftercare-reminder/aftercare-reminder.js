// @ts-check
/** Aftercare reminder: a calendar file (.ics, times in UTC) with a yearly clean-and-check reminder; nothing is sent. */
import { aftercareIcs } from "../../lib/reminders.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const form = /** @type {HTMLFormElement|null} */ (root.querySelector("[data-ac-form]"));
  const say = root.querySelector("[data-ac-say]");
  const note = root.querySelector(".jw-say")?.textContent?.trim() ?? "";
  if (!form || !say) return;
  const data = /** @type {any} */ (ctx.data);
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const date = /** @type {HTMLInputElement} */ (form.querySelector("[data-ac-date]")).value;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { say.textContent = "Choose the day first."; return; }
    const piece = /** @type {HTMLInputElement} */ (form.querySelector("[data-ac-piece]")).value.trim() || "My piece";
    const ics = aftercareIcs({ collected: date, piece, business: ctx.data.name, place: data.place ?? "", timeZone: ctx.data.hours.timezone, stamp: new Date(), note });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    a.download = "aftercare-reminder.ics";
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    say.textContent = "Done: a reminder every year from that day. Open the file to add it to your calendar.";
  });
}
