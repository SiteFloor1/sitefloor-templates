// @ts-check
/** Maintenance plans: one plan's year at a time; the question to the studio follows the plan, size and postcode. */
import { planText } from "../../lib/garden.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).maintenance;
  const pick = /** @type {HTMLElement|null} */ (root.querySelector("[data-mp-pick]"));
  const plans = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-mp-show]")]);
  const which = /** @type {HTMLSelectElement|null} */ (root.querySelector("[data-mp-which]"));
  const size = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-mp-size]"));
  const postcode = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-mp-postcode]"));
  const send = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-mp-send]"));
  if (!cfg || !pick || !plans.length || !which || !size || !postcode || !send) throw new Error("maintenance-plans markup missing");
  const update = () => {
    const plan = cfg.plans.find((/** @type {any} */ p) => p.id === which.value);
    send.href = ctx.bookHref(planText(cfg.message, { plan: plan?.name ?? "", size: size.value.trim(), postcode: postcode.value }));
  };
  const show = (/** @type {string} */ id) => {
    plans.forEach((p) => { p.hidden = p.dataset.mpShow !== id; });
    pick.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mpPlan === id)));
    which.value = id;
    update();
  };
  pick.removeAttribute("data-wait");
  pick.addEventListener("click", (e) => { const b = /** @type {HTMLElement} */ (e.target).closest("button"); if (b?.dataset.mpPlan) show(b.dataset.mpPlan); });
  which.addEventListener("change", () => show(which.value));
  size.addEventListener("input", update);
  postcode.addEventListener("input", update);
  show(cfg.plans[0].id);
}
