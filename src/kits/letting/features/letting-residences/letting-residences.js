// @ts-check
/** Residences: fills each building's floors with its free homes from the sheet; a home opens its card (letting-board). */
import { homesState, free } from "../letting-board/load.js";
import { openCard } from "../letting-board/letting-board.js";
import { updatedText } from "../../lib/homes.js";
import { pounds } from "../../lib/fees.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const table = /** @type {HTMLElement} */ (root.querySelector("[data-lr-table]"));
  const upd = /** @type {HTMLElement} */ (root.querySelector("[data-lr-updated]"));
  const card = /** @type {HTMLElement} */ (root.querySelector("[data-lb-card]"));
  const picks = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll("[data-lr-pick]")]);
  if (!table || !upd || !card) throw new Error("letting-residences markup missing");
  const cols = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-lr-col]")]);
  const show = (/** @type {string} */ id) => {
    for (const b of picks) b.setAttribute("aria-pressed", String(b.dataset.lrPick === id));
    for (const c of cols) c.classList.toggle("lr-on", c.dataset.lrCol === id); // on a phone only this building's column shows
  };
  for (const b of picks) b.addEventListener("click", () => show(b.dataset.lrPick ?? ""));
  show(table.dataset.show ?? "");

  homesState(ctx).then((s) => {
    if (s.ok) upd.textContent = updatedText(s.updatedAt, Date.now(), ctx.data.hours.timezone);
    else upd.textContent = `Our list is being updated. Call us on ${ctx.data.phone.replace("+44 ", "0")} for today's homes.`;
    root.dataset.state = s.ok ? "live" : "stale";
    for (const cell of /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-lr-cell]")])) {
      const [building, floor] = (cell.dataset.lrCell ?? "").split("|");
      const q = /** @type {HTMLElement} */ (cell.querySelector(".lr-q"));
      const homes = free(s, building, floor);
      if (!homes.length) { if (!q.textContent) q.textContent = s.ok ? "Let" : "–"; continue; }
      q.textContent = "";
      for (const h of homes) {
        const b = document.createElement("button");
        b.type = "button"; b.className = "lr-cell-home";
        const r = document.createElement("b"); r.textContent = pounds(h.rent);
        const n = document.createElement("span"); n.textContent = h.name;
        const sp = document.createElement("small"); sp.textContent = [h.beds !== null ? `${h.beds} bed` : "", h.m2 ? `${h.m2} m²` : ""].filter(Boolean).join(" · ");
        b.append(r, n, sp);
        b.addEventListener("click", () => openCard(card, h, ctx, () => b.focus()));
        cell.append(b);
      }
    }
  });
}
