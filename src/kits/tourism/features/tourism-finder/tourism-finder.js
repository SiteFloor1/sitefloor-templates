// @ts-check
/**
 * The year, drawn: month, who's going and how long. Rows that fit move to the top in the operator's order, the
 * rest fade back; the line under the table counts them, or says plainly that nothing fits. Opens on this month.
 */
import { fits, MONTHS } from "../../lib/tourism.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const body = root.querySelector("[data-tf-rows]"), found = root.querySelector("[data-tf-found]");
  if (!body || !found) throw new Error("finder markup missing");
  const rows = /** @type {HTMLTableRowElement[]} */ ([...body.querySelectorAll("[data-tf-row]")]);
  const order = rows.map((r) => r.dataset.tfRow);
  const nums = (/** @type {string|undefined} */ s) => (s ?? "").split(",").filter(Boolean).map(Number);
  const q = { month: Number(ctx.now().date.slice(5, 7)), who: "couple", nights: 10 };
  const pressed = (/** @type {string} */ attr, /** @type {string} */ v) => {
    for (const b of root.querySelectorAll(`[${attr}]`)) b.setAttribute("aria-pressed", String(b.getAttribute(attr) === v));
  };
  const draw = () => {
    pressed("data-tf-month", String(q.month)); pressed("data-tf-who", q.who); pressed("data-tf-nights", String(q.nights));
    root.querySelectorAll("thead th").forEach((th, i) => th.classList.toggle("sel", i + 1 === q.month));
    const fit = rows.filter((r) => fits({ go: nums(r.dataset.go), who: (r.dataset.who ?? "").split(","), nights: Number(r.dataset.nights) }, q));
    const sorted = [...fit, ...rows.filter((r) => !fit.includes(r))].sort((a, b) => Number(fit.includes(b)) - Number(fit.includes(a)) || order.indexOf(a.dataset.tfRow) - order.indexOf(b.dataset.tfRow));
    for (const r of sorted) {
      r.classList.toggle("off", !fit.includes(r));
      r.querySelectorAll("td.tf-m").forEach((td, i) => td.classList.toggle("sel", i + 1 === q.month));
      body.append(r);
    }
    const m = MONTHS[q.month - 1];
    found.textContent = fit.length ? `${fit.length} ${fit.length === 1 ? "journey fits" : "journeys fit"} ${m}.` : `Nothing fits ${m} as it stands. Tell us anyway: most of our trips are made to order.`;
  };
  root.addEventListener("click", (e) => {
    const b = /** @type {HTMLElement} */ (e.target).closest("button");
    if (!b) return;
    if (b.dataset.tfMonth) q.month = Number(b.dataset.tfMonth);
    else if (b.dataset.tfWho) q.who = b.dataset.tfWho;
    else if (b.dataset.tfNights) q.nights = Number(b.dataset.tfNights);
    else return;
    draw();
  });
  draw();
}
