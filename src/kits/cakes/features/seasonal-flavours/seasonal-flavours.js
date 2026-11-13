// @ts-check
/** The flavour calendar: shows the studio's flavours in season in the chosen month, starting from this month. */
import { inSeason } from "../../lib/cakes.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const items = /** @type {any[]|null} */ (/** @type {any} */ (ctx.data).cakes?.flavours);
  const select = /** @type {HTMLSelectElement|null} */ (root.querySelector("[data-sf-month]"));
  const list = root.querySelector("[data-sf-list]");
  if (!items || !select || !list) throw new Error("flavour calendar markup missing");
  const render = () => {
    const on = inSeason(items, Number(select.value));
    list.replaceChildren(...on.map((f) => {
      const li = document.createElement("li");
      const b = document.createElement("b");
      b.textContent = f.name;
      const s = document.createElement("span");
      s.textContent = f.what;
      li.append(b, s);
      return li;
    }));
  };
  select.value = String(Number(ctx.now().date.slice(5, 7)));
  select.addEventListener("change", render);
  render();
}
