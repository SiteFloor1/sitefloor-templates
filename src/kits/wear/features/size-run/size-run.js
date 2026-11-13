// @ts-check
/** The size run: each cell's count and a bar emptying from the fullest size of that piece. Hidden without fresh stock. */
import { stockConfig, loadStock, pieceNow } from "../../browser/stock.js";

/** @param {HTMLElement} root @param {import("../../../../core/js/core.js").Ctx} ctx */
export function init(root, ctx) {
  const paint = async () => {
    const c = stockConfig();
    const table = c ? await loadStock(c) : null;
    if (!c || !table) { root.hidden = true; return; }
    root.hidden = false;
    for (const row of /** @type {NodeListOf<HTMLElement>} */ (root.querySelectorAll("[data-sr]"))) {
      const p = pieceNow(c, table, row.dataset.sr ?? "");
      const counts = p?.counts;
      const max = counts ? Math.max(1, ...counts.values()) : 1;
      for (const td of /** @type {NodeListOf<HTMLElement>} */ (row.querySelectorAll("[data-sr-size]"))) {
        const size = td.dataset.srSize ?? "";
        const n = p?.sizes.includes(size) ? counts?.get(size) : undefined;
        const bar = /** @type {HTMLElement|null} */ (td.querySelector("i"));
        const num = td.querySelector(".wr-sr-n");
        td.dataset.left = n === undefined ? "" : n === 0 ? "out" : n <= c.lowAt ? "few" : "in";
        if (bar) bar.style.width = n === undefined ? "0" : `${Math.round((n / max) * 100)}%`;
        if (num) num.textContent = n === undefined ? "–" : n === 0 ? "Gone" : String(n);
      }
    }
    const note = root.querySelector("[data-sr-note]");
    if (note) note.textContent = c.source === "fixed" ? "Demo numbers. On a live site these come from the brand's stock sheet and empty as it's updated." : "From the brand's stock sheet.";
  };
  paint();
  ctx.everyMinute(paint);
}
