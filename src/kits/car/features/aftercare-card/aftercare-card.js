// @ts-check
/** Aftercare reminder card: shows the steps for the chosen work with real dates, and makes the calendar file. */
import { wireReminders } from "./reminders.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const a = /** @type {any} */ (ctx.data).aftercare;
  const box = /** @type {HTMLElement|null} */ (root.querySelector("[data-ac]"));
  const pick = /** @type {HTMLSelectElement|null} */ (root.querySelector("select[name=service]"));
  if (!a || !box || !pick) throw new Error("aftercare card markup or data missing");
  const service = () => a.services.find((/** @type {any} */ s) => s.id === pick.value) ?? a.services[0];
  const paint = wireReminders(box, ctx, service);
  const show = () => {
    for (const el of root.querySelectorAll("[data-ac-svc]")) el.classList.toggle("off", /** @type {HTMLElement} */ (el).dataset.acSvc !== service().id);
    paint();
  };
  pick.addEventListener("change", show);
  show();
}
