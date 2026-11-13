// @ts-check
/** Memberships: the slider re-scores every plan against paying each time and marks the best one. */
import { compareMemberships, pounds } from "../../core/lib/savings.js";

/** @type {import("../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const m = ctx.data.memberships;
  const svc = ctx.data.services.find((s) => s.id === m?.compareService);
  const range = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-mb-range]"));
  if (!m || !svc || !range) throw new Error("memberships markup or data missing");
  const cards = [...root.querySelectorAll("[data-mb-plan]")];

  const update = () => {
    const w = Number(range.value);
    const r = compareMemberships(m.plans, w, svc.price);
    /** @type {HTMLElement} */ (root.querySelector("[data-mb-weeks]")).textContent = String(w);
    /** @type {HTMLElement} */ (root.querySelector("[data-mb-unit]")).textContent = w === 1 ? "week" : "weeks";
    /** @type {HTMLElement} */ (root.querySelector("[data-mb-payg]")).textContent = pounds(r.payg);
    cards.forEach((card, i) => {
      const row = r.plans[i], plan = m.plans[i];
      card.classList.toggle("best", r.best === row.name);
      /** @type {HTMLElement} */ (card.querySelector("[data-mb-tag]")).textContent = r.best === row.name ? "Best for you" : plan.featured ? "Most popular" : "";
      /** @type {HTMLElement} */ (card.querySelector("[data-mb-save]")).textContent = row.saving > 0 ? `You'd save ${pounds(row.saving)} a month`
        : row.saving < 0 ? `${pounds(-row.saving)} a month more than paying each time` : "Same as paying each time";
    });
  };
  range.addEventListener("input", update);
  update();
}
