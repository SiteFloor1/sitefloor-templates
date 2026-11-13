// @ts-check
/**
 * Aftercare reminders, shared by the home-page card and the aftercare page: the fitting date plus each
 * step's day gives the reminder dates; the calendar file is made in the browser and nothing is sent anywhere.
 */
import { aftercareIcs } from "../../lib/aftercare.js";
import { addDays } from "../../../../core/lib/hours.js";

/** @param {string} iso */
const nice = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

/**
 * @param {HTMLElement} box holds input[name=fitted], [data-ac-add] and step items with data-day
 * @param {import("../../../../core/js/core.js").Ctx} ctx
 * @param {() => any} service the chosen aftercare service
 */
export function wireReminders(box, ctx, service) {
  const date = /** @type {HTMLInputElement|null} */ (box.querySelector("input[name=fitted]"));
  const add = /** @type {HTMLButtonElement|null} */ (box.querySelector("[data-ac-add]"));
  if (!date || !add) throw new Error("aftercare reminder markup missing");
  if (!date.value) date.value = ctx.now().date;
  const paint = () => {
    const s = service();
    const fitted = date.value || ctx.now().date;
    for (const li of box.querySelectorAll("[data-day]")) {
      const at = li.querySelector("[data-ac-date]");
      if (at) at.textContent = nice(addDays(fitted, Number(/** @type {HTMLElement} */ (li).dataset.day)));
    }
    const n = s.steps.filter((/** @type {any} */ x) => x.day >= 1).length;
    add.textContent = `Add ${n} reminder${n === 1 ? "" : "s"} to my calendar`;
    add.disabled = !n;
  };
  date.addEventListener("input", paint);
  add.addEventListener("click", () => {
    const s = service();
    const fitted = /^\d{4}-\d{2}-\d{2}$/.test(date.value) ? date.value : ctx.now().date;
    const d = /** @type {any} */ (ctx.data);
    const ics = aftercareIcs({ service: s, fitted, place: d.place, business: d.name, timeZone: d.hours.timezone, stamp: new Date() });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([ics], { type: "text/calendar" })), download: `${s.id}-aftercare.ics` });
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  });
  return paint;
}
