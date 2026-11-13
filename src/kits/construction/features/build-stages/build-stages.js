// @ts-check
/** How a build runs: "if we started in…" gives the handover months from the builder's own stage lengths. */
import { programme, monthSpan } from "../../lib/programme.js";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const select = /** @type {HTMLSelectElement|null} */ (root.querySelector("[data-when-start]"));
  const out = root.querySelector("[data-when-out]");
  const stages = /** @type {any} */ (ctx.data).build?.programme;
  if (!select || !out || !stages) return;
  const [y, m] = ctx.now().date.split("-").map(Number);
  for (let i = 1; i <= 12; i++) {
    const d = new Date(Date.UTC(y, m - 1 + i, 1));
    const o = document.createElement("option");
    o.value = d.toISOString().slice(0, 10); o.textContent = `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
    select.append(o);
  }
  const show = () => {
    const plan = programme(stages, select.value);
    const last = plan?.[plan.length - 1];
    out.textContent = last ? `, we'd usually hand over in ${monthSpan(last.to[0], last.to[1])}.` : "";
  };
  select.addEventListener("change", show);
  show();
}
