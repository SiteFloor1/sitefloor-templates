// @ts-check
/** The bridal timeline: every step dated back from the day; only steps still ahead are saved or sent. */
import { diaryDates, diaryStatus, ukDate } from "../../../../core/lib/diary.js";
import { dayEventsIcs, shortDay } from "../../lib/skin.js";
import { saveIcs, stamp } from "../../lib/save.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const data = /** @type {any} */ (ctx.data), cfg = data.bridal;
  const q = (/** @type {string} */ s) => /** @type {HTMLElement|null} */ (root.querySelector(s));
  const input = /** @type {HTMLInputElement|null} */ (q("[data-br-date]")), away = q("[data-br-away]"), late = q("[data-br-late]");
  const ics = /** @type {HTMLButtonElement|null} */ (q("[data-br-ics]")), send = /** @type {HTMLAnchorElement|null} */ (q("[data-br-send]"));
  if (!cfg || !input || !away || !late || !ics || !send) throw new Error("bridal markup missing");
  const first = Math.max(...cfg.steps.map((/** @type {any} */ s) => s.weeksBefore));
  const plain = new Map([...root.querySelectorAll("[data-step]")].map((li) => [/** @type {HTMLElement} */ (li).dataset.step, li.querySelector("[data-when]")?.textContent ?? ""]));
  input.min = ctx.now().date;
  const render = () => {
    const day = input.value, today = ctx.now().date;
    const st = day ? diaryStatus(day, today, first) : null, ok = Boolean(st && !st.passed);
    const dates = ok ? diaryDates(day, cfg.steps, today) : [];
    root.querySelectorAll("[data-step]").forEach((li) => {
      const el = /** @type {HTMLElement} */ (li), d = dates.find((x) => x.id === el.dataset.step), when = el.querySelector("[data-when]");
      if (when) when.textContent = d ? (d.past ? "Now" : shortDay(d.date)) : plain.get(el.dataset.step) ?? "";
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
    const events = diaryDates(input.value, cfg.steps, ctx.now().date).filter((d) => !d.past).map((d) => ({ id: d.id, date: d.date, title: d.label, ...(d.note ? { note: d.note } : {}) }));
    saveIcs(dayEventsIcs({ events, clinic: data.name, place: data.place, stamp: stamp() }), `bridal-${input.value}.ics`);
  });
  render();
}
