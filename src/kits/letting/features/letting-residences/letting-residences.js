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

  const filters = /** @type {HTMLFormElement|null} */ (root.querySelector("[data-lr-filters]"));
  const count = /** @type {HTMLElement|null} */ (root.querySelector("[data-lr-count]"));
  /** @type {import("../letting-board/load.js").HomesState|null} */ let state = null;

  /** Does a home match the filters? @param {import("../../lib/homes.js").Home} h */
  const matches = (h) => {
    if (!filters) return true;
    const f = new FormData(filters), beds = String(f.get("beds") ?? ""), max = Number(f.get("max") ?? 0);
    if (beds === "3" ? !((h.beds ?? 0) >= 3) : beds && h.beds !== Number(beds)) return false;
    if (max && h.rent > max) return false;
    if (f.get("now") && h.available !== "now") return false;
    if (f.get("outside") && !h.more.some(([k, v]) => k === "Outside space" && !/^none$/i.test(v))) return false;
    return true;
  };

  const render = () => {
    const s = state;
    if (!s) return;
    let shown = 0, all = 0;
    for (const cell of /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-lr-cell]")])) {
      const [building, floor] = (cell.dataset.lrCell ?? "").split("|");
      const q = /** @type {HTMLElement} */ (cell.querySelector(".lr-q"));
      const note = cell.dataset.note ?? (cell.dataset.note = q.textContent ?? "");
      cell.querySelectorAll(".lr-cell-home").forEach((b) => b.remove());
      const homes = free(s, building, floor);
      all += homes.length;
      const fit = homes.filter(matches);
      shown += fit.length;
      q.textContent = note || (!s.ok ? "–" : !homes.length ? "Let" : !fit.length ? "–" : "");
      for (const h of fit) {
        const b = document.createElement("button");
        b.type = "button"; b.className = "lr-cell-home";
        const r = document.createElement("b"); r.textContent = pounds(h.rent);
        const n = document.createElement("span"); n.textContent = h.name;
        const sp = document.createElement("small"); sp.textContent = [h.beds !== null ? `${h.beds} bed` : "", h.m2 ? `${h.m2} m²` : "", h.available === "now" ? "free now" : ""].filter(Boolean).join(" · ");
        b.append(r, n, sp);
        b.addEventListener("click", () => openCard(card, h, ctx, () => b.focus()));
        cell.append(b);
      }
    }
    if (count) count.textContent = !s.ok ? "" : shown === all ? `${all} homes free` : `${shown} of ${all} homes`;
  };

  homesState(ctx).then((s) => {
    state = s;
    if (s.ok) upd.textContent = updatedText(s.updatedAt, Date.now(), ctx.data.hours.timezone);
    else upd.textContent = `Our list is being updated. Call us on ${ctx.data.phone.replace("+44 ", "0")} for today's homes.`;
    root.dataset.state = s.ok ? "live" : "stale";
    if (filters) {
      if (!s.ok) filters.hidden = true;
      // rent steps from the homes themselves: every £1,000 between the lowest and highest rent
      const rents = s.homes.filter((h) => h.status === "available").map((h) => h.rent);
      const sel = /** @type {HTMLSelectElement} */ (filters.querySelector("select[name=max]"));
      if (rents.length) for (let v = Math.ceil(Math.min(...rents) / 1000) * 1000; v < Math.max(...rents); v += 1000) {
        const o = document.createElement("option"); o.value = String(v); o.textContent = pounds(v); sel.append(o);
      }
      filters.addEventListener("change", render);
    }
    render();
  });
}
