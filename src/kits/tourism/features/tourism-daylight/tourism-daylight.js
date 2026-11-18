// @ts-check
/**
 * Daylight on a journey page: for the month chosen (it opens on the journey's first good month from now), each stop's
 * sunrise, sunset and hours of light on the 15th, in the stop's own clock, worked out astronomically here.
 */
import { daylight, MONTHS } from "../../lib/tourism.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const sel = /** @type {HTMLSelectElement|null} */ (root.querySelector("[data-dl-month]"));
  const rows = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-dl-stop]")]);
  if (!sel || !rows.length) throw new Error("daylight markup missing");
  const go = (root.dataset.go ?? "").split(",").filter(Boolean).map(Number);
  const now = ctx.now().date, thisMonth = Number(now.slice(5, 7)), thisYear = Number(now.slice(0, 4));
  const next = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((k) => ((thisMonth - 1 + k) % 12) + 1).find((m) => go.includes(m)) ?? thisMonth;
  sel.value = String(next);
  const draw = () => {
    const m = Number(sel.value), year = m >= thisMonth ? thisYear : thisYear + 1;
    for (const r of rows) {
      const out = r.querySelector("[data-dl-out]");
      if (!out) continue;
      try { out.textContent = daylight(Number(r.dataset.lat), Number(r.dataset.lon), r.dataset.tz ?? "UTC", m, year).words; } catch { out.textContent = ""; }
    }
    const label = root.querySelector("[data-dl-when]");
    if (label) label.textContent = `Mid-${MONTHS[m - 1]} ${year}`;
  };
  sel.addEventListener("change", draw);
  draw();
}
