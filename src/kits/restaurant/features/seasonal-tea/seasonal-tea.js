// @ts-check
/** Seasonal stands: the one being served today leads ("Being served now"), else the next ("Next"). */
import { seasonFor } from "../../lib/tearoom.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const list = root.querySelector(".st-list");
  const seasons = /** @type {any} */ (ctx.data).seasons;
  if (!list || !seasons) throw new Error("seasonal stands markup or data missing");
  const s = seasonFor(seasons, ctx.now().date);
  const lead = s.now ?? s.next;
  for (const li of /** @type {HTMLElement[]} */ ([...list.children])) {
    const id = li.dataset.st, st = /** @type {HTMLElement} */ (li.querySelector("[data-st-state]"));
    li.classList.toggle("is-lead", id === lead?.id);
    st.textContent = id === s.now?.id ? "Being served now" : id === s.next?.id ? "Next" : "";
  }
  if (lead) list.prepend(/** @type {Element} */ (list.querySelector(`[data-st="${lead.id}"]`)));
}
