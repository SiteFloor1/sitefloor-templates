// @ts-check
/** Maintenance: the chosen plan's visits as one repeating calendar entry, and its Stripe Payment Link to join monthly. */
import { maintenanceIcs } from "../../lib/dates.js";
import { isYmd } from "../../../../core/lib/diary.js";
import { download } from "../first-wash/download.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const data = /** @type {any} */ (ctx.data), m = data.detailing.maintenance;
  const form = /** @type {HTMLFormElement|null} */ (root.querySelector("[data-mt-form]")), date = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-mt-date]")), out = root.querySelector("[data-mt-out]");
  if (!form || !date || !out || !m) throw new Error("maintenance markup missing");
  if (!date.value) date.value = ctx.now().date;
  const join = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-mt-join]"));
  form.addEventListener("change", (e) => {
    const t = /** @type {HTMLInputElement} */ (e.target);
    if (!join || t.name !== "dt-plan") return;
    const plan = m.plans.find((/** @type {any} */ p) => p.id === t.value);
    join.hidden = !plan?.payLink;
    if (plan?.payLink) join.href = plan.payLink;
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const plan = m.plans.find((/** @type {any} */ p) => p.id === (/** @type {HTMLInputElement|null} */ (form.querySelector("[name=dt-plan]:checked")))?.value);
    if (!plan || !isYmd(date.value)) { out.textContent = "Choose a plan and the day you collect."; return; }
    download(maintenanceIcs({ plan, from: date.value, count: m.count, business: data.name, place: data.detailing.place, tz: data.hours.timezone, stamp: new Date() }), `${data.name}-${plan.id}.ics`);
    out.textContent = `${plan.name}: ${m.count} visits, every ${plan.every} ${plan.every === 1 ? "week" : "weeks"}, in your calendar.`;
  });
}
