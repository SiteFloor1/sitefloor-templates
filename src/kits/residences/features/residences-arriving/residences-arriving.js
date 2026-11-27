// @ts-check
/** Arriving: the chosen day and time as a calendar file, made in the browser. */
import { arrivalIcs } from "../../lib/arrival.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const a = /** @type {any} */ (ctx.data).arriving;
  const day = /** @type {HTMLInputElement} */ (root.querySelector("[data-ra2-day]"));
  const time = /** @type {HTMLInputElement} */ (root.querySelector("[data-ra2-time]"));
  const go = /** @type {HTMLAnchorElement} */ (root.querySelector("[data-ra2-go]"));
  const today = ctx.now().date;
  day.min = today; day.value = today;
  root.querySelector("form")?.addEventListener("submit", (e) => e.preventDefault());
  /** @type {string} */ let url = "";
  const make = () => {
    if (url) URL.revokeObjectURL(url);
    const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
    const ics = arrivalIcs({ day: day.value || today, time: time.value || "18:30", name: ctx.data.name, place: a.place, steps: a.steps, concierge: a.concierge, stamp });
    url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    go.href = url;
  };
  day.addEventListener("change", make); time.addEventListener("change", make);
  make();
}
