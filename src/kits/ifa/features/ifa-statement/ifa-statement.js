// @ts-check
/**
 * Fees in pounds: reworks the statement for any amount typed or picked. The schedule is the firm's published fees; the
 * sums are arithmetic only. A blank, too small or too large amount shows dashes and says why, never a guess.
 */
import { statement, readAmount, money, pounds } from "../../lib/fees.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const input = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-st-amount]"));
  if (!input) return; // the schedule didn't build: the card already links to the fees page
  const why = /** @type {HTMLElement} */ (root.querySelector("[data-st-why]"));
  const presets = /** @type {HTMLElement} */ (root.querySelector("[data-st-presets]"));
  const outs = /** @type {Record<string, HTMLElement>} */ (Object.fromEntries([...root.querySelectorAll("[data-st]")].map((el) => [/** @type {HTMLElement} */ (el).dataset.st, el])));
  const { schedule } = /** @type {any} */ (ctx.data).fees;
  const WHY = {
    amount: "Type an amount in whole pounds.",
    below: `We advise on amounts from ${schedule.from !== undefined ? pounds(schedule.from) : "£1"}.`,
    above: schedule.to !== undefined ? `For more than ${pounds(schedule.to)}, we agree the fee with you in writing.` : "",
    schedule: "Our fees are on the fees page.",
  };
  const paint = () => {
    const amount = readAmount(input.value);
    const s = statement(amount, schedule);
    if (s.ok) {
      for (const k of ["initial", "ongoing", "monthly", "firstYear"]) outs[k].textContent = money(/** @type {any} */ (s)[k]);
      why.hidden = true;
      input.removeAttribute("aria-invalid");
    } else {
      for (const el of Object.values(outs)) el.textContent = "—";
      why.textContent = WHY[s.why];
      why.hidden = false;
      input.setAttribute("aria-invalid", "true");
    }
    for (const b of presets.querySelectorAll("[data-st-pick]")) b.setAttribute("aria-pressed", String(Number(/** @type {HTMLElement} */ (b).dataset.stPick) === amount));
  };
  presets.classList.remove("if-wait");
  presets.addEventListener("click", (e) => {
    const b = /** @type {HTMLElement|null} */ (/** @type {Element} */ (e.target).closest("[data-st-pick]"));
    if (!b) return;
    input.value = Number(b.dataset.stPick).toLocaleString("en-GB");
    paint();
  });
  input.addEventListener("input", paint);
  input.addEventListener("blur", () => { const n = readAmount(input.value); if (Number.isFinite(n)) input.value = n.toLocaleString("en-GB"); });
  paint();
}
