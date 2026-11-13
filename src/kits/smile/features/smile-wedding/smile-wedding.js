// @ts-check
/**
 * When's the big day: the date in, every step dated (steps already past marked), weeks to go, the first step's date
 * passed warned about; the dates to the calendar (all-day events) or to the studio in one message.
 */
import { diaryDates, diaryStatus, ukDate } from "../../../../core/lib/diary.js";
import { dayEventsIcs } from "../../lib/smile.js";
import { saveIcs, stamp } from "../smile-journey/ics.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const data = /** @type {any} */ (ctx.data), cfg = data.wedding;
  const q = (/** @type {string} */ s) => /** @type {HTMLElement|null} */ (root.querySelector(s));
  const input = /** @type {HTMLInputElement|null} */ (q("[data-wd-date]")), away = q("[data-wd-away]"), late = q("[data-wd-late]");
  const ics = /** @type {HTMLButtonElement|null} */ (q("[data-wd-ics]")), send = /** @type {HTMLAnchorElement|null} */ (q("[data-wd-send]"));
  if (!cfg || !input || !away || !late || !ics || !send) throw new Error("wedding markup missing");
  const first = Math.max(...cfg.steps.map((/** @type {any} */ s) => s.weeksBefore));
  const plain = new Map([...root.querySelectorAll("[data-step]")].map((li) => [/** @type {HTMLElement} */ (li).dataset.step, li.querySelector("[data-when]")?.textContent ?? ""]));
  input.min = ctx.now().date;

  const render = () => {
    const day = input.value, today = ctx.now().date;
    const st = day ? diaryStatus(day, today, first) : null, ok = Boolean(st && !st.passed);
    const dates = ok ? diaryDates(day, cfg.steps, today) : [];
    root.querySelectorAll("[data-step]").forEach((li) => {
      const el = /** @type {HTMLElement} */ (li), d = dates.find((x) => x.id === el.dataset.step), when = el.querySelector("[data-when]");
      if (when) when.textContent = d ? (d.past ? "Now" : ukDate(d.date, false).replace(/ \d{4}$/, "")) : plain.get(el.dataset.step) ?? "";
      el.toggleAttribute("data-past", Boolean(d?.past));
    });
    away.textContent = !st ? "" : st.passed ? "That date has passed." : `${ukDate(day)} · ${st.weeks >= 1 ? `${st.weeks} ${st.weeks === 1 ? "week" : "weeks"} away` : `${st.days} ${st.days === 1 ? "day" : "days"} away`}`;
    late.hidden = !(st && st.late);
    ics.hidden = send.hidden = !ok;
    if (ok) send.href = ctx.bookHref([cfg.message, "", `The day: ${ukDate(day)}`, ...dates.filter((d) => !d.past).map((d) => `${d.label}: ${ukDate(d.date)}`)].join("\n"));
  };
  input.addEventListener("change", render);
  ics.addEventListener("click", () => {
    if (!input.value) return;
    const events = diaryDates(input.value, cfg.steps, ctx.now().date).filter((d) => !d.past).map((d) => ({ id: d.id, date: d.date, title: d.label, note: d.note }));
    saveIcs(dayEventsIcs({ events, studio: data.name ?? "studio", place: data.place, stamp: stamp() }), `smile-dates-${input.value}.ics`);
  });
  render();
}
