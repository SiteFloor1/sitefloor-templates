// @ts-check
/**
 * The film-coverage builder: the car's size and a package set what the 3D car shows (once opened), the price and days
 * from the studio's price sheet (simulated on a demo), and the WhatsApp message. An unreadable sheet or a package the
 * sheet doesn't price for that car says "Ask us".
 */
import { stage } from "../correction-3d/stage.js";
import { filmText } from "../../lib/packages.js";
import { gbp } from "../../../../core/lib/text.js";
import { daysLabel } from "../../lib/packages.js";

/** @typedef {{ load: (ctx: import("../../../../core/js/core.js").Ctx) => Promise<import("../../lib/packages.js").FilmPrices> }} FilmPriceProvider */

/** @type {import("../../../../core/js/core.js").FeatureInit} */
export function init(root, ctx) {
  const d = /** @type {any} */ (ctx.data).detailing;
  const provider = /** @type {FilmPriceProvider|null} */ (ctx.providers.filmPrices);
  const from = /** @type {HTMLElement|null} */ (root.querySelector("[data-fp-from]"));
  const total = root.querySelector("[data-fp-total]"), days = root.querySelector("[data-fp-days]"), go = /** @type {HTMLAnchorElement|null} */ (root.querySelector("[data-fp-go]"));
  if (!total || !days || !go || !d.film) throw new Error("film builder markup missing");
  /** @type {import("./../correction-3d/bay-3d.js").Bay|null} */ let bay = null;
  /** @type {Map<string, { price: number, days: number }>} */ let prices = new Map();
  const picked = () => /** @type {HTMLInputElement|null} */ (root.querySelector("[name=dt-cover]:checked"));
  const body = () => /** @type {HTMLInputElement|null} */ (root.querySelector("[data-body-pick]:checked"))?.value ?? "suv";
  const update = () => {
    const c = picked();
    if (!c) return;
    const b = body(), bodyName = d.film.bodies[b] ?? b, p = prices.get(`${c.value}|${b}`);
    for (const cell of /** @type {NodeListOf<HTMLElement>} */ (root.querySelectorAll("[data-fp-for]"))) {
      const q = prices.get(`${cell.dataset.fpFor}|${b}`);
      cell.textContent = q ? gbp(q.price) : "";
    }
    total.textContent = p ? gbp(p.price) : "Ask us";
    if (from) from.hidden = !p;
    days.textContent = p ? `About ${daysLabel(p.days)} with us.` : " ";
    go.href = ctx.waHref(filmText({ opening: d.film.message, body: bodyName, pkg: c.dataset.name ?? c.value, price: p?.price ?? null, days: p?.days ?? null }));
    bay?.cover(/** @type {any} */ (c.dataset.area));
  };
  root.addEventListener("change", (e) => { if (/** @type {HTMLElement} */ (e.target).matches("[name=dt-cover]")) update(); });
  ctx.watch("detailBody", () => update());
  stage(root, ctx, "protection", (b) => { bay = b; update(); });
  if (provider) provider.load(ctx).then((r) => { if (r.ok) prices = r.prices; update(); }, () => update());
  else update();
}
