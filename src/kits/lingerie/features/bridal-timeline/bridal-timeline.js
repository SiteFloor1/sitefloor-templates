// @ts-check
/** Wedding dates: the steps worked back from her date (the bridal diary's logic), a calendar file, the dates on WhatsApp. */
import { diaryDates, diaryIcs, ukDate, isYmd, daysBetween } from "../../../../core/lib/diary.js";
import { readData, must, saveIcs, icsStamp } from "../dom.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = readData(root);
  const input = /** @type {HTMLInputElement} */ (must(root, "[data-dates-day]"));
  const list = must(root, "[data-dates-list]");
  const left = must(root, "[data-dates-left]");
  const late = /** @type {HTMLElement} */ (must(root, "[data-dates-late]"));
  const ics = /** @type {HTMLButtonElement} */ (must(root, "[data-dates-ics]"));
  const send = /** @type {HTMLAnchorElement} */ (must(root, "[data-dates-send]"));
  const today = ctx.now().date;
  input.min = today;
  const update = () => {
    const day = input.value;
    if (!isYmd(day) || day < today) { ics.disabled = true; left.textContent = day && day < today ? "That day has passed." : ""; return; }
    const dates = diaryDates(day, cfg.steps, today);
    list.replaceChildren(...dates.map((d) => {
      const li = document.createElement("li");
      li.classList.toggle("past", d.past);
      const what = Object.assign(document.createElement("span"), { className: "dates-what", textContent: d.label });
      if (d.note) what.append(Object.assign(document.createElement("small"), { textContent: d.note }));
      li.append(Object.assign(document.createElement("span"), { className: "dates-when", textContent: d.past ? `${ukDate(d.date, false)} (passed)` : ukDate(d.date) }), what);
      return li;
    }));
    const weeks = Math.floor(daysBetween(today, day) / 7);
    left.textContent = `${ukDate(day)}: ${weeks === 1 ? "one week" : `${weeks} weeks`} away.`;
    late.hidden = !dates.length || !dates[0].past;
    ics.disabled = false;
    ics.onclick = () => saveIcs("wedding-dates.ics", diaryIcs({ wedding: day, dates, salon: ctx.data.name, title: "wedding dates", place: cfg.place, stamp: icsStamp() }));
    send.href = ctx.waHref([`Hello ${ctx.data.name}, my wedding is on ${ukDate(day)}. My dates:`, ...dates.filter((d) => !d.past).map((d) => `· ${d.label}: ${ukDate(d.date)}`)].join("\n"));
  };
  input.addEventListener("change", update);
  input.addEventListener("input", update);
}
