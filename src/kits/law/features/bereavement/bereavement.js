// @ts-check
/** When someone has died: suggested days for each step from the chosen start, and one calendar file of reminders. */
import { addDaysYmd, longDate, remindersIcs } from "../../lib/matter.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const start = /** @type {HTMLInputElement|null} */ (root.querySelector("#bv-start"));
  const btn = root.querySelector("#bv-ics");
  if (!start || !btn) throw new Error("bereavement markup missing");
  const steps = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-days]")]);
  start.value = ctx.now().date;
  const show = () => {
    const from = start.value;
    for (const s of steps) {
      const when = /** @type {HTMLElement} */ (s.querySelector("[data-bv-when]"));
      when.hidden = !from;
      if (from) when.textContent = `Suggested reminder: ${longDate(addDaysYmd(from, Number(s.dataset.days)))}`;
    }
  };
  start.addEventListener("change", show);
  btn.addEventListener("click", () => {
    if (!start.value) { start.focus(); return; }
    const ics = remindersIcs(steps.map((s) => ({ id: `bv-${s.dataset.bvStep}`, date: addDaysYmd(start.value, Number(s.dataset.days)), title: s.dataset.title ?? "", text: s.querySelector("p")?.textContent ?? "" })), "Bereavement", new Date());
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    a.download = "reminders.ics";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  show();
  root.setAttribute("data-ready", "");
}
