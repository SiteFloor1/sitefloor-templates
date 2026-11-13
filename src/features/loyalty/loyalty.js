// @ts-check
/**
 * Loyalty card: stamps fill in once the card is on screen; the slider works out free cuts a year (barbers: "every N
 * weeks", from the service's price) or free coffees a year (cafés: "N times a week", from the menu item's price,
 * which the template passes as data attributes).
 */
import { loyaltyYear, pounds } from "../../core/lib/savings.js";

/** @type {import("../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const l = ctx.data.loyalty;
  const perWeek = root.dataset.lyMode === "week";
  const svc = perWeek ? { name: root.dataset.lyName ?? "", price: Number(root.dataset.lyPrice) } : ctx.data.services.find((s) => s.id === l?.compareService);
  const range = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-ly-range]"));
  const out = root.querySelector("[data-ly-out]"), weeks = root.querySelector("[data-ly-weeks]");
  if (!l || !svc || !range || !out || !weeks) throw new Error("loyalty markup or data missing");

  const update = () => {
    const w = Number(range.value);
    if (perWeek) {
      const year = w * 52, free = Math.floor(year / l.stamps);
      weeks.textContent = String(w);
      /** @type {HTMLElement} */ (root.querySelector("[data-ly-unit]")).textContent = w === 1 ? "time a week" : "times a week";
      out.replaceChildren(`A ${svc.name.toLowerCase()} ${w === 1 ? "once" : `${w} times`} a week is ${year} a year: `, Object.assign(document.createElement("b"), { textContent: `${free} free` }), `, worth ${pounds(free * svc.price)}.`);
      return;
    }
    const y = loyaltyYear(w, l.stamps, svc.price);
    weeks.textContent = String(w);
    /** @type {HTMLElement} */ (root.querySelector("[data-ly-unit]")).textContent = w === 1 ? "week" : "weeks";
    out.replaceChildren(
      `A ${svc.name.toLowerCase()} every ${w === 1 ? "week" : `${w} weeks`} is ${y.cuts} cuts a year: `,
      Object.assign(document.createElement("b"), { textContent: `${y.free} free` }),
      y.free ? `, worth ${pounds(y.value)}.` : ". Come in a bit more often to fill a card in a year.",
    );
  };
  range.addEventListener("input", update);
  update();

  const stamps = [...root.querySelectorAll("[data-ly-stamps] li")];
  const fill = () => stamps.forEach((s, i) => setTimeout(() => s.classList.add("on"), matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 180 * i));
  if (!("IntersectionObserver" in window)) { fill(); return; }
  const io = new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) { fill(); io.disconnect(); } }, { threshold: 0.5 });
  io.observe(/** @type {Element} */ (root.querySelector("[data-ly-stamps]")));
}
