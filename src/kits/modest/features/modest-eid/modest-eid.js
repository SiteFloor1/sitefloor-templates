// @ts-check
/** Eid last order dates: worked out on the day from the expected windows and the shop's cut-offs (lib/modest.js). */
import { eidOrderDates, leftWords } from "../../lib/modest.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const cfg = /** @type {any} */ (ctx.data).eid;
  const when = root.querySelector("[data-eid-when]"), rows = root.querySelector("[data-eid-rows]");
  if (!cfg || !when || !rows) return;
  const r = eidOrderDates(cfg.windows, cfg.cutoffs, ctx.now().date);
  root.hidden = !r; // no Eid ahead in the table: never a guessed date
  if (!r) return;
  when.textContent = r.words;
  rows.replaceChildren(...r.rows.map((x) => {
    const tr = document.createElement("tr");
    if (!x.open) tr.className = "is-closed";
    for (const t of [x.label, `Order by ${x.byWords}`, leftWords(x)]) tr.append(Object.assign(document.createElement("td"), { textContent: t }));
    return tr;
  }));
}
