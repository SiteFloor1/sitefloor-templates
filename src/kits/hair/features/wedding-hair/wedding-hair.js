// @ts-check
/** The wedding hair planner: every step's date from the wedding, to the calendar in one file and to WhatsApp. */
import { diaryDates, diaryIcs, ukDate } from "../../../../core/lib/diary.js";
import { dateField } from "../../partials/date-field.js";
import { saveIcs } from "../../partials/save-ics.js";
import { icsStamp, bookText } from "../../lib/hair.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const data = /** @type {any} */ (ctx.data), cfg = data.wedding;
  const q = (/** @type {string} */ s) => /** @type {HTMLElement|null} */ (root.querySelector(s));
  const field = q("[data-date-field]"), list = q("[data-wd-steps]"), late = q("[data-wd-late]"), day = q("[data-wd-day]");
  const ics = /** @type {HTMLButtonElement|null} */ (q("[data-wd-ics]")), send = /** @type {HTMLAnchorElement|null} */ (q("[data-wd-send]"));
  if (!cfg || !field || !list || !late || !day || !ics || !send) throw new Error("wedding-hair markup missing");
  const date = dateField(field), opening = send.href;
  const plain = new Map([...list.querySelectorAll("[data-step]")].map((li) => [/** @type {HTMLElement} */ (li).dataset.step, li.querySelector("[data-when]")?.textContent ?? ""]));
  let wedding = "", dates = /** @type {ReturnType<typeof diaryDates>} */ ([]);
  const render = () => {
    const today = ctx.now().date;
    wedding = date.get();
    const ok = Boolean(wedding) && wedding >= today;
    dates = ok ? diaryDates(wedding, cfg.steps, today) : [];
    for (const li of /** @type {NodeListOf<HTMLElement>} */ (list.querySelectorAll("[data-step]"))) {
      const d = dates.find((x) => x.id === li.dataset.step), when = li.querySelector("[data-when]");
      if (when) when.textContent = d ? ukDate(d.date) : plain.get(li.dataset.step) ?? "";
      li.toggleAttribute("data-past", Boolean(d?.past));
    }
    day.textContent = ok ? ukDate(wedding) : "The day";
    const missed = dates.filter((d) => d.past).map((d) => d.label.toLowerCase());
    late.hidden = !(wedding && (!ok || missed.length));
    late.textContent = !wedding ? "" : !ok ? "That date has passed." : `The ${missed.join(" and ")} would have been earlier. Message us and we'll fit it in.`;
    ics.hidden = !ok; 
    send.href = ok ? ctx.bookHref(bookText(cfg.message, { extra: [`The wedding is on ${ukDate(wedding)}.`, ...dates.filter((d) => !d.past).map((d) => `${d.label}: ${ukDate(d.date)}.`)] })) : opening;
  };
  ics.addEventListener("click", () => {
    if (!wedding) return;
    saveIcs(diaryIcs({ wedding, dates, salon: data.name, place: data.place, stamp: icsStamp(), title: "wedding hair" }), "wedding-hair");
  });
  date.on(render);
  render();
}
