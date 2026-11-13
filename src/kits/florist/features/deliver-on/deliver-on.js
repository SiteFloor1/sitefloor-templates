// @ts-check
/**
 * Choose the day: the date the customer picks is checked against the florist's own delivery days, closed dates, bank
 * holidays and cut-offs (the typed postcode's area's own, where it has them). Checked again when the postcode changes,
 * every minute, and by this week's script when the order is sent. Any day that doesn't work says why.
 */
import { orderDay, AHEAD_DAYS } from "../../lib/delivery.js";
import { addDays } from "../../../../core/lib/hours.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const D = /** @type {any} */ (ctx.data).florist?.delivery;
  const input = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-when-input]"));
  const say = root.querySelector("[data-when-say]");
  if (!D || !input || !say) throw new Error("deliver-on: markup or delivery settings missing");
  const today = ctx.now().date;
  input.min = today;
  input.max = addDays(today, AHEAD_DAYS);
  const band = root.closest("[data-feature='this-week']") ?? document;
  const postcode = () => /** @type {HTMLInputElement|null} */ (band.querySelector("[data-pc-input]"))?.value ?? "";
  const check = () => {
    if (!input.value) { say.textContent = ""; say.classList.remove("is-no"); return; }
    const r = orderDay(input.value, postcode(), D, ctx.now(), D.holidays ?? []);
    say.textContent = r.text;
    say.classList.toggle("is-no", !r.ok);
  };
  input.addEventListener("change", check);
  input.addEventListener("input", check);
  band.addEventListener("input", (e) => { if (/** @type {HTMLElement} */ (e.target).matches("[data-pc-input]")) check(); });
  ctx.everyMinute(check);
}
