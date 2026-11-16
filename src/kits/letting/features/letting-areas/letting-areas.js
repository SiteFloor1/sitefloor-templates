// @ts-check
/** Areas: how many homes are free in each area, and on an area's page the homes themselves, from the sheet. Fails closed. */
import { homesState, free } from "../letting-board/load.js";
import { openCard } from "../letting-board/letting-board.js";
import { updatedText } from "../../lib/homes.js";
import { pounds } from "../../lib/fees.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  homesState(ctx).then((s) => {
    const inAll = (/** @type {string} */ ids) => ids.split(",").filter(Boolean).flatMap((b) => free(s, b));
    for (const el of /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-la-free]")])) {
      const n = inAll(el.dataset.laFree ?? "").length;
      el.textContent = !s.ok ? "" : n ? `${n} free now` : "All let";
    }
    const upd = /** @type {HTMLElement} */ (root.querySelector("[data-la-updated]"));
    const list = /** @type {HTMLElement|null} */ (root.querySelector("[data-la-list]"));
    if (!list) { // the areas index: only a stale list needs saying
      if (!s.ok) upd.textContent = `Our list is being updated. Call us on ${ctx.data.phone.replace("+44 ", "0")} for today's homes.`;
      return;
    }
    const card = /** @type {HTMLElement} */ (root.querySelector("[data-lb-card]"));
    upd.textContent = s.ok ? updatedText(s.updatedAt, Date.now(), ctx.data.hours.timezone)
      : `Our list is being updated. Call us on ${ctx.data.phone.replace("+44 ", "0")} for today's homes.`;
    const homes = inAll(list.dataset.laList ?? "");
    if (s.ok && !homes.length) upd.textContent += ". Everything here is let.";
    list.replaceChildren(...homes.map((h) => {
      const li = document.createElement("li"), b = document.createElement("button");
      b.type = "button"; b.className = "lr-cell-home";
      const r = document.createElement("b"); r.textContent = pounds(h.rent);
      const n = document.createElement("span"); n.textContent = h.name;
      const sp = document.createElement("small"); sp.textContent = [h.beds !== null ? `${h.beds} bed` : "", h.m2 ? `${h.m2} m²` : "", h.available === "now" ? "free now" : `from ${h.available}`].filter(Boolean).join(" · ");
      b.append(r, n, sp);
      b.addEventListener("click", () => openCard(card, h, ctx, () => b.focus()));
      li.append(b); return li;
    }));
  });
}
