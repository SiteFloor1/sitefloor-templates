// @ts-check
/**
 * Same-day line, countdown and postcode check from the florist's own settings (cut-offs, closed dates, districts).
 * Refreshed every minute; never says "today" after the cut-off. The look's phone bar can carry [data-sd-bar].
 */
import { sameDay, leftLabel, postcodeAnswer, areaFor, withArea } from "../../lib/delivery.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const D = /** @type {any} */ (ctx.data).florist?.delivery;
  if (!D) throw new Error("same-day: delivery settings missing");
  // On an area's own page, that area's cut-offs (where the florist set them).
  const here = withArea(D, root.dataset.area ? areaFor(root.dataset.area, D.areas) : null);
  const state = () => sameDay(here, ctx.now(), D.holidays ?? []);
  const paint = () => {
    const s = state();
    const line = s.open ? `Order in the next ${leftLabel(s.left)} for delivery today` : s.next ? `Today's deliveries have gone. Order now for ${s.next.label}.` : "Deliveries are paused for now.";
    for (const el of root.querySelectorAll("[data-sd-text]")) el.textContent = line;
    root.querySelector("[data-sd-state]")?.classList.toggle("is-off", !s.open);
    for (const el of document.querySelectorAll("[data-sd-bar]")) el.textContent = s.open ? `Today by ${s.cutoff} · ${leftLabel(s.left)} left` : s.next ? `Next delivery ${s.next.label}` : "Deliveries paused";
  };
  paint();
  ctx.everyMinute(paint);
  const form = root.querySelector("[data-sd-form]");
  const say = root.querySelector("[data-sd-answer]");
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = /** @type {HTMLInputElement} */ (form.querySelector("[data-pc-input]"));
    const a = postcodeAnswer(input.value, D, state(), ctx.now(), D.holidays ?? []);
    if (say) { say.textContent = a.text; say.classList.toggle("is-no", !a.ok); }
  });
}
