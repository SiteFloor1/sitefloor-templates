// @ts-check
/** The organ: choose up to the house's number of ingredients; they turn to colour and the fragrances that have them rise. */
import { organMatches, joinAnd } from "../../lib/fragrance.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const data = /** @type {any} */ (ctx.data), max = data.organ?.max ?? 3;
  const buttons = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll(".fr-ing")]);
  const list = root.querySelector("[data-org-res]"), say = root.querySelector("[data-org-say]");
  const rows = new Map([...root.querySelectorAll("[data-scent-row]")].map((r) => [/** @type {HTMLElement} */ (r).dataset.scentRow, /** @type {HTMLElement} */ (r)]));
  if (!list || !say) throw new Error("organ markup missing");
  /** @type {string[]} */ let picked = [];
  const render = () => {
    for (const b of buttons) b.setAttribute("aria-pressed", String(picked.includes(b.dataset.note ?? "")));
    root.classList.toggle("is-full", picked.length >= max);
    if (!picked.length) {
      say.textContent = `Choose up to ${max}.`;
      for (const r of rows.values()) { r.hidden = true; }
      return;
    }
    const m = organMatches(data.fragrances, picked);
    for (const r of rows.values()) r.hidden = true;
    for (const { item, matched } of m) {
      const r = rows.get(item.id); if (!r) continue;
      r.hidden = false; list.appendChild(r);
      const t = r.querySelector("[data-matched]"); if (t) t.textContent = `Has ${joinAnd(matched)}`;
    }
    say.textContent = m.length ? `${m.length === 1 ? "One fragrance has" : `${m.length} fragrances have`} ${picked.length === 1 ? "it" : "them"}${m.length > 1 ? ", most first" : ""}.` : "None of ours has that one yet.";
  };
  for (const b of buttons) b.addEventListener("click", () => {
    const n = b.dataset.note ?? "";
    if (picked.includes(n)) picked = picked.filter((p) => p !== n);
    else if (picked.length < max) picked = [...picked, n];
    render();
  });
  render();
}
