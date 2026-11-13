// @ts-check
/** Gift a season: the chosen length, start date, postcode and card go on WhatsApp; the Pay link follows the length. */
import { addDays } from "../../../../core/lib/hours.js";
import { outward } from "../../lib/delivery.js";
import { pounds } from "../../lib/orders.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const G = /** @type {any} */ (ctx.data).florist?.giftSeason;
  const form = root.querySelector("[data-gift-form]");
  const send = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-gift-send]"));
  const pay = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-gift-pay]"));
  const start = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-gift-start]"));
  if (!G || !form || !send || !pay || !start) throw new Error("gift a season: markup or data missing");
  start.min = addDays(ctx.now().date, G.leadDays);
  const chosen = () => /** @type {HTMLInputElement} */ (form.querySelector('input[name="gift-weeks"]:checked'));
  const refresh = () => {
    const c = chosen();
    pay.href = c.dataset.pay ?? pay.href;
    pay.textContent = `Pay ${pounds(Number(c.dataset.price))}`;
    const to = outward(/** @type {HTMLInputElement} */ (form.querySelector("[data-gift-to]")).value);
    const card = /** @type {HTMLTextAreaElement} */ (form.querySelector("[data-gift-card]")).value.trim();
    const lines = [G.message, "", `${c.value} weeks of flowers (${pounds(Number(c.dataset.price))})`];
    if (start.value) lines.push(`First delivery: ${new Date(`${start.value}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })}`);
    if (to) lines.push(`To: ${to}`);
    if (card) lines.push("", "Card:", card);
    send.href = ctx.waHref(lines.join("\n"));
  };
  form.addEventListener("input", refresh);
  form.addEventListener("change", refresh);
  send.addEventListener("click", refresh);
  refresh();
}
