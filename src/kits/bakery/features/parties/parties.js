// @ts-check
/** Party calculator: guests to the fewest cakes or trays that serve everyone, from the shop's own list; the enquiry. */
import { partyPlans } from "../../lib/orders.js";
import { gbp } from "../../../../core/lib/text.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const d = /** @type {any} */ (ctx.data);
  const range = /** @type {HTMLInputElement} */ (root.querySelector("[data-pa-guests]"));
  const n = root.querySelector("[data-pa-n]"), list = root.querySelector("[data-pa-plans]");
  const send = /** @type {HTMLAnchorElement} */ (root.querySelector("[data-pa-send]"));
  if (!range || !n || !list || !send) throw new Error("parties markup missing");
  const update = () => {
    const guests = Number(range.value);
    n.textContent = String(guests);
    const plans = partyPlans(guests, d.parties.servings);
    list.replaceChildren(...plans.map((p, i) => {
      const li = document.createElement("li");
      li.className = i === 0 ? "pa-plan is-best" : "pa-plan";
      const what = document.createElement("span"); what.className = "pa-what";
      what.textContent = p.items.map((x) => `${x.qty} × ${x.name}`).join(" + ");
      const meta = document.createElement("span"); meta.className = "pa-meta";
      meta.textContent = `serves ${p.servings} · ${gbp(p.price)}`;
      li.append(what, meta);
      return li;
    }));
    const best = plans[0];
    send.href = ctx.waHref([
      `Hi ${d.name}, I'm planning a party for ${guests} guests.`,
      ...(best ? [`Your calculator suggests ${best.items.map((x) => `${x.qty} × ${x.name}`).join(" + ")} (${gbp(best.price)}).`] : []),
      "Could you tell me what you'd recommend and which dates are free?",
    ].join("\n"));
  };
  range.addEventListener("input", update);
  update();
  root.dataset.ready = "true";
}
