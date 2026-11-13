// @ts-check
/**
 * The menu's filters and tonight's marks, shared by the home menu and the menu page: only items that carry every
 * chosen mark and none of the avoided allergens stay visible; tonight's sheet adds "a few left" or "sold out".
 */
import { passes } from "../../lib/orders.js";
import { stateOf, STATUS_WORDS } from "../../lib/bakes.js";
import { startBakes } from "../bakes/sheet-provider.js";

/** @param {HTMLElement} root @param {import("../../../../core/js/core.js").Ctx} ctx */
export function menuUi(root, ctx) {
  const items = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-item]")]);
  const sections = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-bk-sec]")]);
  const count = root.querySelector("[data-bk-count]");
  const avoidCount = root.querySelector("[data-avoid-count]");
  const boxes = /** @type {HTMLInputElement[]} */ ([...root.querySelectorAll("[data-diet], [data-avoid]")]);
  const read = (/** @type {HTMLElement} */ el) => ({ allergens: (el.dataset.allergens ?? "").split(" ").filter(Boolean), diets: (el.dataset.diets ?? "").split(" ").filter(Boolean) });

  const apply = () => {
    const f = { diets: boxes.filter((b) => b.matches("[data-diet]") && b.checked).map((b) => b.value), avoid: boxes.filter((b) => b.matches("[data-avoid]") && b.checked).map((b) => b.value) };
    let shown = 0;
    for (const el of items) { const ok = passes(read(el), f); el.hidden = !ok; if (ok) shown++; }
    for (const s of sections) { const none = s.querySelector("[data-bk-none]"); if (none) /** @type {HTMLElement} */ (none).hidden = s.querySelector("[data-item]:not([hidden])") !== null; }
    if (avoidCount) avoidCount.textContent = f.avoid.length ? `(${f.avoid.length})` : "";
    if (count) count.textContent = f.diets.length || f.avoid.length ? `Showing ${shown} of ${items.length}` : "";
  };
  for (const b of boxes) b.addEventListener("change", apply);
  root.dataset.ready = "true";

  startBakes(ctx);
  ctx.watch("bakes", (/** @type {import("../../lib/bakes.js").Bakes} */ b) => {
    for (const el of items) {
      const st = el.querySelector("[data-item-status]");
      const s = stateOf(b, { id: el.dataset.item ?? "", name: el.dataset.name ?? "" });
      el.classList.toggle("is-out", s?.status === "sold out");
      el.classList.toggle("is-low", s?.status === "low");
      if (!st) continue;
      /** @type {HTMLElement} */ (st).hidden = !s || s.status === "available";
      st.textContent = s && s.status !== "available" ? STATUS_WORDS[s.status] : "";
    }
  });
}
