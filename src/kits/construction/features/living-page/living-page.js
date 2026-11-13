// @ts-check
/** Living through a build: the programme for the chosen start date, and its calendar file. */
import { programme, programmeIcs, shortDate, addDays } from "../../lib/programme.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const stages = /** @type {any} */ (ctx.data).build?.programme;
  const start = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-lv-start]"));
  const ics = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-lv-ics]"));
  if (!stages || !start || !ics) return;
  const [y, m] = ctx.now().date.split("-").map(Number);
  start.value = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10); // the first of next month
  start.min = ctx.now().date;
  /** @type {string} */ let url = "";
  const show = () => {
    const plan = programme(stages, start.value);
    if (!plan) return;
    plan.forEach((p, i) => {
      const el = root.querySelector(`[data-lv-dates="${i}"]`);
      if (el) el.textContent = `${shortDate(p.from[0])} to ${shortDate(addDays(p.to[1], -1))}`;
    });
    if (url) URL.revokeObjectURL(url);
    url = URL.createObjectURL(new Blob([programmeIcs(plan, ctx.data.name, new Date())], { type: "text/calendar" }));
    ics.href = url;
  };
  start.addEventListener("change", show);
  show();
}
