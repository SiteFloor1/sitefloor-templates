// @ts-check
/** What you receive and when: a wedding date gives each step its day, in UK order. Shares the date check's date. */
import { deliveryDates } from "../../lib/dates.js";
import { ukDate, isYmd } from "../../../../core/lib/diary.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const steps = /** @type {any} */ (ctx.data).weddingfilm?.delivery;
  const date = /** @type {HTMLInputElement|null} */ (root.querySelector("[data-dl-date]"));
  if (!steps || !date) throw new Error("delivery markup missing");
  const render = () => {
    const ymd = date.value;
    for (const s of isYmd(ymd) ? deliveryDates(ymd, steps) : steps) {
      const cell = root.querySelector(`[data-step="${s.id}"] [data-when]`);
      if (cell) cell.textContent = isYmd(ymd) && "date" in s ? ukDate(/** @type {string} */ (s.date)) : "";
    }
  };
  date.addEventListener("change", () => { render(); if (isYmd(date.value)) ctx.share("wedding", date.value); });
  ctx.watch("wedding", (/** @type {string} */ ymd) => { if (isYmd(ymd) && ymd !== date.value) { date.value = ymd; render(); } });
}
