// @ts-check
/** Delivery dates for a chosen shoot date: working days after it, skipping UK bank holidays (lib/carfilm.js). */
import { deliveryDate, shortDay } from "../../lib/carfilm.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const t = /** @type {any} */ (ctx.data).carfilm?.turnaround;
  const input = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-ta-date]"));
  if (!t || !input) throw new Error("turnaround markup missing");
  const paint = () => {
    const ok = /^\d{4}-\d\d-\d\d$/.test(input.value);
    for (const p of t.packages) {
      const row = root.querySelector(`[data-ta="${p.id}"]`);
      for (const [k, days] of [["photos", p.photosDays], ["film", p.filmDays]]) {
        const cell = row?.querySelector(`[data-ta-${k}]`);
        if (cell) cell.textContent = ok && days ? shortDay(deliveryDate(input.value, days, t.workdays, t.postcode)) : "";
      }
    }
  };
  input.addEventListener("change", paint);
  input.addEventListener("input", paint);
}
