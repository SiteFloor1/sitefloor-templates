// @ts-check
/** The shop page: stock words per piece and, per size, whether any are left (from the brand's sheet). */
import { paintStock, stockConfig, loadStock, pieceNow } from "../../browser/stock.js";

/** @param {HTMLElement} root @param {import("../../../../core/js/core.js").Ctx} ctx */
export function init(root, ctx) {
  const sizes = async () => {
    const c = stockConfig();
    if (!c) return;
    const table = await loadStock(c);
    for (const row of /** @type {NodeListOf<HTMLElement>} */ (root.querySelectorAll("[data-stock]"))) {
      const p = pieceNow(c, table, row.dataset.stock ?? "");
      for (const li of /** @type {NodeListOf<HTMLElement>} */ (row.querySelectorAll("[data-size]"))) {
        const n = p?.counts?.get(li.dataset.size ?? "");
        li.dataset.left = n === undefined || p?.state === "soon" || p?.state === "unknown" ? "" : n === 0 ? "out" : n <= c.lowAt ? "few" : "in";
        li.title = n === undefined || !li.dataset.left ? "" : n === 0 ? "Sold out in this size" : `${n} left in this size`;
      }
    }
  };
  const paint = () => { paintStock(root); sizes(); };
  paint();
  ctx.everyMinute(paint);
}
