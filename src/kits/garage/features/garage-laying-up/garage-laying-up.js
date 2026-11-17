// @ts-check
/** Laying up: the care visits between two dates and the day the car comes back, as a calendar file made here. */
import { layingUpEvents, addDays, dayWords, icsFile } from "../../lib/garage.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const d = /** @type {any} */ (ctx.data);
  const from = /** @type {HTMLInputElement|null} */ (root.querySelector("#lu-from")), to = /** @type {HTMLInputElement|null} */ (root.querySelector("#lu-to"));
  const list = root.querySelector("[data-lu-events]"), link = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-lu-ics]"));
  if (!d.layingUp || !from || !to || !list || !link) return;
  const today = ctx.now().date;
  from.min = today; to.min = today;
  if (!from.value) from.value = addDays(today, 7);
  if (!to.value) to.value = addDays(from.value, 120);
  let url = "";
  const draw = () => {
    const ev = layingUpEvents(from.value, to.value, d.layingUp);
    if (!ev.length) { link.hidden = true; return; }
    list.replaceChildren(...ev.map((e) => { const li = document.createElement("li"); li.textContent = `${dayWords(e.date)}: ${e.title}`; return li; }));
    if (url) URL.revokeObjectURL(url);
    url = URL.createObjectURL(new Blob([icsFile(d.name, ev, new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z")], { type: "text/calendar" }));
    link.href = url; link.hidden = false;
  };
  from.addEventListener("change", draw); to.addEventListener("change", draw);
  draw();
}
