// @ts-check
/** A repeating calendar entry for the regular clean: the bill's visit length, the chosen weekday and start time. */
import { cleanIcs, icsStamp, clock } from "../../lib/plan.js";
import { hm } from "../../lib/visit.js";
import { addDaysYmd } from "../../../../core/lib/diary.js";
import { saveIcs } from "./save.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const data = /** @type {any} */ (ctx.data);
  const day = /** @type {HTMLSelectElement|null} */ (root.querySelector("[data-sch-day]")), time = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-sch-time]"));
  const btn = /** @type {HTMLButtonElement|null} */ (root.querySelector("[data-sch-ics]")), note = /** @type {HTMLElement|null} */ (root.querySelector("[data-sch-note]"));
  if (!day || !time || !btn || !note) throw new Error("schedule markup missing");
  /** @type {any} */ let s = null;
  const words = () => {
    if (!s) return;
    const once = s.choice.freq === "once";
    btn.disabled = once;
    const [h, m] = (time.value || "09:00").split(":").map(Number), start = h * 60 + m;
    note.textContent = once ? "A one-off deep clean: we agree the day with you." : `${day.options[day.selectedIndex].text}s, ${clock(start)} to ${clock(start + s.visit.work)}, ${s.choice.freq === "week" ? "every week" : "every other week"}.`;
  };
  ctx.watch("cleaningVisit", (/** @type {any} */ v) => { s = v; words(); });
  day.addEventListener("change", words); time.addEventListener("change", words);
  btn.addEventListener("click", () => {
    if (!s || s.choice.freq === "once") return;
    const today = ctx.now().date, wd = Number(day.value);
    let date = addDaysYmd(today, 1);
    while (new Date(`${date}T12:00:00Z`).getUTCDay() !== wd) date = addDaysYmd(date, 1);
    const [h, m] = (time.value || "09:00").split(":").map(Number);
    saveIcs(cleanIcs({ date, start: h * 60 + m, minutes: s.visit.work, every: s.choice.freq === "week" ? 1 : 2, title: `Cleaning · ${data.name}`, place: "", business: data.name, stamp: icsStamp(new Date()), note: `About ${hm(s.visit.work)}. ${s.words.home}.` }), "cleaning-day.ics");
  });
}
