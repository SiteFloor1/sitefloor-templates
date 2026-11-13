// @ts-check
/** Arriving: the route from the door to the chair, timed from the appointment the visitor picks. */
import { arrivalTimes } from "../../lib/smile.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const steps = /** @type {any} */ (ctx.data).arrival?.steps;
  const route = /** @type {HTMLElement|null} */ (root.querySelector("[data-ar-route]"));
  const picks = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll("[data-ar]")]);
  if (!steps || !route) throw new Error("arrival markup missing");
  const cells = [...route.querySelectorAll("[data-ar-time]")];
  const show = (/** @type {string} */ at) => {
    arrivalTimes(at, steps).forEach((s, i) => { if (cells[i]) cells[i].textContent = s.time; });
    picks.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.ar === at)));
  };
  picks.forEach((b) => b.addEventListener("click", () => show(b.dataset.ar ?? "")));
  show(route.dataset.start ?? "");
}
