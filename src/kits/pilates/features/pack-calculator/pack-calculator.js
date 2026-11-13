// @ts-check
/** Packs and memberships: redraw the options, cheapest first, for the chosen classes a week (lib packOptions). */
import { packOptions } from "../../lib/members.js";

const money = (/** @type {number} */ n) => `£${n.toLocaleString("en-GB", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const p = /** @type {any} */ (ctx.data).pilates?.packs;
  const list = root.querySelector("[data-pk-list]");
  if (!p || !list) throw new Error("pack calculator markup missing");
  root.dataset.ready = "";
  const render = () => {
    const n = Number(/** @type {HTMLInputElement|null} */ (root.querySelector('input[name="pk-n"]:checked'))?.value ?? 2);
    const opts = packOptions(n, { single: p.single, packs: p.items ?? [], memberships: p.memberships ?? [] });
    list.replaceChildren(...opts.map((o, i) => {
      const li = document.createElement("li");
      if (i === 0) li.dataset.best = "";
      const b = document.createElement("b"); b.textContent = o.name;
      const cost = document.createElement("span"); cost.className = "pl-pk-c"; cost.textContent = `${money(o.perMonth)} a month`;
      const per = document.createElement("span"); per.textContent = [`${money(o.perClass)} a class`, o.note].filter(Boolean).join(" · ");
      if (i === 0) { const k = document.createElement("em"); k.textContent = "Best for you"; li.append(k); }
      li.append(b, cost, per);
      return li;
    }));
  };
  root.addEventListener("change", render);
  render();
}
