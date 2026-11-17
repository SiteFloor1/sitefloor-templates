// @ts-check
/** Exams: one calendar file of the exam dates still to come. */
import { yearIcs, icsStamp } from "../../lib/ballet.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const data = /** @type {any} */ (ctx.data);
  const btn = root.querySelector("[data-ex-ics]");
  const done = /** @type {HTMLElement|null} */ (root.querySelector("[data-ex-done]"));
  if (!data.exams || !btn || !done) throw new Error("exams markup or data missing");
  btn.addEventListener("click", () => {
    const items = data.exams.items.filter((/** @type {any} */ x) => x.date >= ctx.now().date);
    const ics = yearIcs({ items, school: data.school, place: data.place, stamp: icsStamp(Date.now()) });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([ics], { type: "text/calendar" })), download: "exam-dates.ics" });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    done.hidden = false;
    done.textContent = `${items.length} exam date${items.length === 1 ? "" : "s"}, ready to open in your calendar.`;
  });
}
