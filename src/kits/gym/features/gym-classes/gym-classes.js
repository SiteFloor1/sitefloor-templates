// @ts-check
/** The class finder: pressing a choice narrows the list (pressing it again lets it go); the count says how many fit. */
import { classMatches, finderCount } from "../../lib/club.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root) {
  const buttons = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll("button[data-k]")]);
  const rows = /** @type {HTMLElement[]} */ ([...root.querySelectorAll(".gcf-c")]);
  const count = /** @type {HTMLElement|null} */ (root.querySelector("[data-gcf-n]"));
  /** @type {Record<string, string>} */
  const pick = {};
  const paint = () => {
    let n = 0;
    for (const r of rows) {
      const c = { goals: (r.dataset.goals ?? "").split(" ").filter(Boolean), level: r.dataset.level ?? "", bands: (r.dataset.bands ?? "").split(" ").filter(Boolean) };
      const fits = classMatches(c, pick);
      r.hidden = !fits;
      if (fits) n++;
      r.querySelectorAll("li[data-band]").forEach((li) => li.classList.toggle("is-off", !!pick.band && /** @type {HTMLElement} */ (li).dataset.band !== pick.band));
    }
    if (count) count.textContent = finderCount(n);
  };
  for (const b of buttons) {
    b.addEventListener("click", () => {
      const k = b.dataset.k ?? "", v = b.dataset.v ?? "";
      const on = pick[k] !== v;
      if (on) pick[k] = v; else delete pick[k];
      buttons.filter((x) => x.dataset.k === k).forEach((x) => x.setAttribute("aria-pressed", String(on && x === b)));
      paint();
    });
  }
}
