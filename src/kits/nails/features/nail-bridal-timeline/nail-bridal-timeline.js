// @ts-check
/** The bridal timeline: the wedding date gives each step its day (the salon's days before), UK order, one calendar file. */
import { bridalDates, ukDate, allDayIcs, icsStamp } from "../../lib/dates.js";
import { bridalText } from "../../lib/messages.js";
import { dateField } from "../../partials/date-field.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const data = /** @type {any} */ (ctx.data);
  const list = root.querySelector("[data-bt-list]"), late = /** @type {HTMLElement|null} */ (root.querySelector("[data-bt-late]"));
  const ask = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-bt-ask]")), ics = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-bt-ics]"));
  if (!data.bridal || !list || !late || !ask || !ics) throw new Error("bridal timeline markup missing");
  const words = new Map([...list.querySelectorAll("li[data-step]")].map((li) => [/** @type {HTMLElement} */ (li).dataset.step, li.querySelector("[data-bt-date]")?.textContent ?? ""]));
  let url = "";
  dateField(root, ctx, "wedding", (wedding) => {
    if (url) { URL.revokeObjectURL(url); url = ""; }
    ask.href = ctx.bookHref(bridalText(data.bridal.message, wedding));
    const today = ctx.now().date;
    const dates = wedding ? bridalDates(wedding, data.bridal.steps, today) : [];
    for (const li of list.querySelectorAll("li[data-step]")) {
      const id = /** @type {HTMLElement} */ (li).dataset.step ?? "";
      const d = dates.find((x) => x.id === id);
      const out = li.querySelector("[data-bt-date]");
      if (out) out.textContent = d ? ukDate(d.date) : words.get(id) ?? "";
      li.classList.toggle("past", Boolean(d?.past));
    }
    late.hidden = !dates.some((d) => d.past) || wedding < today;
    const ahead = dates.filter((d) => !d.past);
    if (!ahead.length) { ics.hidden = true; return; }
    const file = allDayIcs({ salon: data.name, place: data.place, stamp: icsStamp(new Date()), kind: "bridal nails", events: ahead.map((d) => ({ id: d.id, date: d.date, title: `${d.label} · ${data.name}`, note: d.text ?? "" })) });
    url = URL.createObjectURL(new Blob([file], { type: "text/calendar" }));
    ics.href = url; ics.hidden = false;
  });
}
