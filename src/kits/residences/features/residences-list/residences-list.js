// @ts-check
/** Residences: the sheet's free homes with filters by stay, bedrooms and the date needed. */
import { homesState } from "../residences-homes/load.js";
import { card, detail } from "../residences-homes/card.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const list = /** @type {HTMLElement} */ (root.querySelector("[data-rl-list]"));
  const n = /** @type {HTMLElement} */ (root.querySelector("[data-rl-n]"));
  const d = /** @type {HTMLDialogElement} */ (root.querySelector("[data-rl-dialog]"));
  const stay = /** @type {HTMLSelectElement} */ (root.querySelector("[data-rl-stay]"));
  const beds = /** @type {HTMLSelectElement} */ (root.querySelector("[data-rl-beds]"));
  const from = /** @type {HTMLInputElement} */ (root.querySelector("[data-rl-from]"));
  const today = ctx.now().date;
  from.min = today;
  root.querySelector("form")?.addEventListener("submit", (e) => e.preventDefault());
  homesState(ctx).then((s) => {
    root.classList.remove("rl-wait");
    if (!s.ok) return;
    const draw = () => {
      const need = from.value || "9999-12-31";
      const shown = s.homes.filter((h) => (!stay.value || (stay.value === "short" ? h.short : h.long)) && h.beds >= Number(beds.value)
        && (!from.value || h.from === "now" || h.from <= need));
      n.textContent = shown.length ? `${shown.length} of ${s.homes.length} free homes.` : "No free home matches. Clear a filter, or ask us: a home may come free sooner.";
      const st = stay.value === "long" ? "long" : null;
      list.replaceChildren(...shown.map((h) => card(h, ctx, st, (x) => detail(d, x, ctx, st, s.updatedAt))));
    };
    root.addEventListener("input", draw); root.addEventListener("change", draw);
    draw();
  });
  d.addEventListener("click", (e) => { if (e.target === d) d.close(); });
}
