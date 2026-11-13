// @ts-check
/**
 * Celebration cakes page: the price as the visitor chooses, the earliest day (notice, closed days and full days from
 * the sheet), the day checked before the request goes, and "remind me next year".
 */
import { quote, requestText, dayProblem } from "../../lib/cake.js";
import { watchEarliest, allergenList, downloadReminder, longDay } from "./cake-ui.js";
import { gbp } from "../../../../core/lib/text.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const d = /** @type {any} */ (ctx.data);
  const field = (/** @type {string} */ k) => /** @type {HTMLInputElement|HTMLSelectElement} */ (root.querySelector(`[data-cc="${k}"]`));
  const price = root.querySelector("[data-cc-price]"), serves = root.querySelector("[data-cc-serves]"), all = root.querySelector("[data-cc-allergens]");
  const send = /** @type {HTMLAnchorElement} */ (root.querySelector("[data-cc-send]"));
  const errEl = /** @type {HTMLElement} */ (root.querySelector("[data-cc-err]"));
  const remind = /** @type {HTMLButtonElement} */ (root.querySelector("[data-cc-remind]"));
  const soon = document.querySelector("[data-cc-soon]");
  if (!price || !serves || !all || !send || !errEl || !remind) throw new Error("celebration-cakes markup missing");
  let earliest = /** @type {string|null} */ (null), full = /** @type {string[]} */ ([]);

  const choice = () => ({ stack: field("stack").value, sponge: field("sponge").value, filling: field("filling").value, finish: field("finish").value, colour: field("colour").value, toppings: [], message: field("message").value });
  const update = () => {
    const q = quote(d.cakes, choice());
    price.textContent = gbp(q.price);
    serves.textContent = String(q.servings);
    const names = allergenList(q.allergens);
    all.textContent = names.length ? `Contains ${names.join(", ")}.` : "Lists no allergens.";
    field("colour").disabled = q.finish.coloured === false;
    const day = field("day").value;
    const problem = day ? dayProblem(day, earliest, d.hours, full) : null;
    errEl.hidden = !problem; errEl.textContent = problem ?? "";
    send.href = ctx.waHref(requestText(q, { business: d.name, day: day && !problem ? day : null, name: field("name").value, note: "", allergenNames: names }));
    remind.disabled = !day || Boolean(problem);
  };
  watchEarliest(ctx, (e, f) => {
    earliest = e; full = f;
    const day = /** @type {HTMLInputElement} */ (field("day"));
    // The day follows the earliest one until the visitor picks their own (the sheet may arrive a moment later).
    if (e) { day.min = e; if (!day.value || day.dataset.auto) { day.value = e; day.dataset.auto = "1"; } }
    if (soon) soon.textContent = e ? `The earliest we can make one now: ${longDay(e)}.` : "Message us for a date: we're fully booked for the next few months.";
    update();
  });
  field("day").addEventListener("input", () => { delete /** @type {HTMLInputElement} */ (field("day")).dataset.auto; });
  root.addEventListener("input", update);
  root.addEventListener("change", update);
  send.addEventListener("click", (e) => { if (!errEl.hidden) { e.preventDefault(); field("day").focus(); } });
  remind.addEventListener("click", () => { const day = field("day").value; if (day) downloadReminder(ctx, day, field("message").value); });
  root.dataset.ready = "true";
}
