// @ts-check
/** The first wash and care: the studio's steps from the day you collect, as one calendar file. Nothing is booked. */
import { careIcs } from "../../lib/dates.js";
import { isYmd } from "../../../../core/lib/diary.js";
import { download } from "./download.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const data = /** @type {any} */ (ctx.data);
  const form = root.querySelector("[data-fw-form]"), date = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-fw-date]")), out = root.querySelector("[data-fw-out]");
  if (!form || !date || !out) throw new Error("first wash markup missing");
  if (!date.value) date.value = ctx.now().date;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!isYmd(date.value)) { out.textContent = "Choose the day you collect the car."; return; }
    const file = careIcs({ steps: data.detailing.care, handover: date.value, business: data.name, place: data.detailing.place, tz: data.hours.timezone, stamp: new Date() });
    download(file, `${data.name}-care.ics`);
    out.textContent = `${data.detailing.care.length} reminders added, from your handover on ${date.value.split("-").reverse().join("/")}.`;
  });
}
