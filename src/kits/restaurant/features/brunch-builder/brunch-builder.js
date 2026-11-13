// @ts-check
/**
 * Brunch builder: one plate per person (tabs), each a brunch dish with sides; the order, total and allergens from
 * src/kits/restaurant/lib/brunch.js; "Add to my table request" shares it as "brunch" for the table request.
 */
import { brunchOrder, brunchSummary } from "../../lib/brunch.js";
import { money } from "../../lib/order.js";

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  /** @type {{ maxPlates: number, dishes: import("../../lib/brunch.js").MenuDish[] }} */
  const cfg = /** @type {any} */ (ctx.data).brunch;
  const tabs = root.querySelector("[data-bb-tabs]"), addBtn = /** @type {HTMLButtonElement|null} */ (root.querySelector("[data-bb-add]"));
  const lines = root.querySelector("[data-bb-lines]"), total = root.querySelector("[data-bb-total]"), all = root.querySelector("[data-bb-all]");
  const go = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-bb-go]"));
  if (!cfg || !tabs || !addBtn || !lines || !total || !all || !go) throw new Error("brunch builder markup or data missing");
  const dishes = new Map(cfg.dishes.map((d) => [d.id, d]));
  const radios = /** @type {HTMLInputElement[]} */ ([...root.querySelectorAll('[name="bb-plate"]')]);
  const sides = /** @type {HTMLInputElement[]} */ ([...root.querySelectorAll('[name="bb-side"]')]);
  /** @type {import("../../lib/brunch.js").Plate[]} */
  const plates = [{ plate: radios[0]?.value ?? "", sides: [] }];
  let cur = 0;

  const load = () => { for (const img of root.querySelectorAll("img[data-src]")) { img.setAttribute("src", img.getAttribute("data-src") ?? ""); img.removeAttribute("data-src"); } };
  if ("IntersectionObserver" in window) { const io = new IntersectionObserver((e) => { if (e.some((x) => x.isIntersecting)) { load(); io.disconnect(); } }, { rootMargin: "600px 0px" }); io.observe(root); } else load();

  const paint = () => {
    tabs.replaceChildren(...plates.map((p, i) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "bb-tab"; b.setAttribute("aria-pressed", String(i === cur));
      b.textContent = `Plate ${i + 1}`;
      b.addEventListener("click", () => { cur = i; paint(); });
      return b;
    }));
    addBtn.hidden = plates.length >= cfg.maxPlates;
    const p = plates[cur];
    for (const r of radios) r.checked = r.value === p.plate;
    for (const s of sides) s.checked = p.sides.includes(s.value);
    const o = brunchOrder(plates, dishes);
    lines.replaceChildren(...o.lines.map((l, i) => {
      const li = document.createElement("li");
      const t = document.createElement("span"); t.textContent = l.label;
      const pr = document.createElement("b"); pr.textContent = money(l.pence);
      li.append(t, pr);
      if (plates.length > 1) {
        const x = document.createElement("button"); x.type = "button"; x.className = "bb-x"; x.textContent = "Remove"; x.setAttribute("aria-label", `Remove plate ${i + 1}`);
        x.addEventListener("click", () => { plates.splice(i, 1); cur = Math.min(cur, plates.length - 1); paint(); });
        li.append(x);
      }
      return li;
    }));
    total.textContent = money(o.totalPence);
    all.textContent = o.allergens.length ? `Allergens in these plates: ${o.allergens.join(", ").toLowerCase()}.` : "No allergens listed in these plates.";
    return o;
  };
  root.addEventListener("change", (e) => {
    const t = /** @type {HTMLInputElement} */ (e.target);
    if (t.name === "bb-plate") plates[cur].plate = t.value;
    if (t.name === "bb-side") plates[cur].sides = sides.filter((s) => s.checked).map((s) => s.value);
    paint();
  });
  addBtn.addEventListener("click", () => { plates.push({ plate: radios[0]?.value ?? "", sides: [] }); cur = plates.length - 1; paint(); });
  go.addEventListener("click", () => {
    const o = paint();
    ctx.share("brunch", { plates: o.lines.length, summary: brunchSummary(o), line: `${o.lines.length} plate${o.lines.length === 1 ? "" : "s"}, ${money(o.totalPence)}` });
  });
  paint();
}
