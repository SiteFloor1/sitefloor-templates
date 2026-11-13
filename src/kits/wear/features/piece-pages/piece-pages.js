// @ts-check
/** A piece's page: stock words and sizes from the sheet, and its fit block. */
import { paintStock, stockConfig, loadStock, pieceNow } from "../../browser/stock.js";
import { bindFit } from "../fit-room/fit-room.js";

/** @param {HTMLElement} root @param {import("../../../../core/js/core.js").Ctx} ctx */
export function init(root, ctx) {
  root.querySelectorAll("[data-fit]").forEach((sec) => bindFit(/** @type {HTMLElement} */ (sec)));
  const paint = async () => {
    paintStock(root);
    const c = stockConfig();
    const box = /** @type {HTMLElement|null} */ (root.querySelector("[data-stock]"));
    if (!c || !box) return;
    const p = pieceNow(c, await loadStock(c), box.dataset.stock ?? "");
    for (const li of /** @type {NodeListOf<HTMLElement>} */ (box.querySelectorAll(".wr-sizes [data-size]"))) {
      const n = p?.counts?.get(li.dataset.size ?? "");
      li.dataset.left = n === undefined || p?.state === "soon" || p?.state === "unknown" ? "" : n === 0 ? "out" : n <= c.lowAt ? "few" : "in";
    }
  };
  paint();
  ctx.everyMinute(paint);
}
