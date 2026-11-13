// @ts-check
/** Infill reminder: the set's day plus the chosen weeks, worded in UK order and offered as a calendar file. */
import { addDaysYmd, ukDate, allDayIcs, icsStamp } from "../../lib/dates.js";
import { dateField } from "../../partials/date-field.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const data = /** @type {any} */ (ctx.data);
  const form = root.querySelector("[data-in-form]"), out = root.querySelector("[data-in-out]"), ics = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-in-ics]"));
  if (!data.infill || !form || !out || !ics) throw new Error("infill markup missing");
  const first = out.textContent ?? "";
  let set = "", url = "";
  const update = () => {
    const weeks = Number(/** @type {HTMLInputElement|null} */ (form.querySelector("input[name=in-weeks]:checked"))?.value ?? data.infill.defaultWeeks);
    if (url) { URL.revokeObjectURL(url); url = ""; }
    if (!set) { out.textContent = first; ics.hidden = true; return; }
    const day = addDaysYmd(set, weeks * 7);
    out.textContent = `Your infill: ${ukDate(day)}.${day < ctx.now().date ? " That day has passed; book in when you can." : ""}`;
    const file = allDayIcs({ salon: data.name, place: data.place, stamp: icsStamp(new Date()), kind: "infill", events: [{ id: "infill", date: day, title: `Infill at ${data.name}`, note: "Book it on WhatsApp or by phone." }] });
    url = URL.createObjectURL(new Blob([file], { type: "text/calendar" }));
    ics.href = url; ics.hidden = day < ctx.now().date;
  };
  dateField(root, ctx, "set-day", (ymd) => { set = ymd; update(); });
  form.addEventListener("change", update);
}
