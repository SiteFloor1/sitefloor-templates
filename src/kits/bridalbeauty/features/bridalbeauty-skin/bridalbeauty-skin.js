// @ts-check
/** Skin prep dates from her wedding date (the artist's own days before), into her calendar, and a message to the artist. */
import { prepDates, ukDate, calendar, icsStamp, skinText } from "../../lib/bridalbeauty.js";
import { dateField } from "../../partials/date-field.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const d = /** @type {any} */ (ctx.data);
  const cfg = d.skin;
  const list = root.querySelector("[data-sk-list]"), late = /** @type {HTMLElement|null} */ (root.querySelector("[data-sk-late]"));
  const ics = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-sk-ics]")), ask = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-sk-ask]"));
  if (!cfg || !list || !late || !ics || !ask) throw new Error("skin markup or data missing");
  const words = new Map([...list.querySelectorAll("li[data-step]")].map((li) => [/** @type {HTMLElement} */ (li).dataset.step, li.querySelector("[data-sk-date]")?.textContent ?? ""]));
  let url = "";
  dateField(root, ctx, "wedding", (wedding) => {
    if (url) { URL.revokeObjectURL(url); url = ""; }
    const today = ctx.now().date;
    const dates = wedding && wedding >= today ? prepDates(wedding, cfg.steps, today) : [];
    for (const li of list.querySelectorAll("li[data-step]")) {
      const id = /** @type {HTMLElement} */ (li).dataset.step ?? "";
      const x = dates.find((s) => s.id === id), out = li.querySelector("[data-sk-date]");
      if (out) out.textContent = x ? ukDate(x.date) : words.get(id) ?? "";
      li.classList.toggle("past", Boolean(x?.past));
    }
    late.hidden = !dates.some((x) => x.past);
    const next = dates.find((x) => !x.past);
    const text = skinText(cfg.message, dates.length ? wedding : "", next ? `Next on your list: ${next.label.toLowerCase()} on ${ukDate(next.date)}.` : "");
    ask.href = ctx.bookHref(text);
    if (ask.dataset.waText !== undefined) ask.dataset.waText = text;
    const ahead = dates.filter((x) => !x.past);
    if (!ahead.length) { ics.hidden = true; return; }
    const file = calendar({ artist: d.name, place: "", stamp: icsStamp(new Date()), events: ahead.map((x) => ({ id: x.id, date: x.date, title: x.label, note: x.text })) });
    url = URL.createObjectURL(new Blob([file], { type: "text/calendar" }));
    ics.href = url; ics.hidden = false;
  });
}
