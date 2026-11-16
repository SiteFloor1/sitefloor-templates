// @ts-check
/** Move-in day planner: dates from the keys day, shown and saved as a calendar file (lib/moveday.js). Nothing is sent. */
import { plan, planIcs } from "../../lib/moveday.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const keys = /** @type {HTMLInputElement} */ (root.querySelector("[data-lmd-keys]"));
  const paid = /** @type {HTMLInputElement} */ (root.querySelector("[data-lmd-paid]"));
  const list = /** @type {HTMLElement} */ (root.querySelector("[data-lmd-plan]"));
  const ics = /** @type {HTMLButtonElement} */ (root.querySelector("[data-lmd-ics]"));
  if (!keys || !paid || !list || !ics) throw new Error("letting-moveday markup missing");
  const cfg = /** @type {any} */ (ctx.data).moveday;
  /** @type {import("../../lib/moveday.js").Planned[]} */ let planned = [];
  const render = () => {
    planned = plan(keys.value, cfg.steps, paid.value || undefined);
    ics.disabled = !planned.length;
    if (!planned.length) return;
    list.replaceChildren(...planned.map((p) => {
      const li = document.createElement("li"), w = document.createElement("span"), t = document.createElement("span"), b = document.createElement("b");
      w.className = "lmd-when"; w.textContent = p.when + (p.time ? `, ${p.time}` : "");
      t.className = "lmd-what"; b.textContent = p.label; t.append(b);
      if (p.note) t.append(" " + p.note);
      if (p.rule) li.className = "lmd-rule";
      li.append(w, t); return li;
    }));
  };
  // start from a fortnight ahead, so the plan reads as dates before anything is touched
  if (!keys.value) { const d = new Date(Date.now() + 14 * 86_400_000); keys.value = d.toISOString().slice(0, 10); }
  render();
  keys.addEventListener("change", render);
  paid.addEventListener("change", render);
  ics.addEventListener("click", () => {
    const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
    const file = planIcs({ planned, agent: cfg.agent, place: cfg.place, stamp, tz: ctx.data.hours.timezone });
    const url = URL.createObjectURL(new Blob([file], { type: "text/calendar" }));
    const a = document.createElement("a");
    a.href = url; a.download = "move-in-day.ics"; document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
}
